"""
Email breach lookup via XposedOrNot (free API, no key required).

Proxies requests server-side to respect upstream rate limits and enrich
breach names with metadata from the public breach catalog.
"""
from __future__ import annotations

import re
import time
from typing import Any
from urllib.parse import quote

import requests

XON_CHECK_URL = "https://api.xposedornot.com/v1/check-email/{email}"
XON_BREACHES_URL = "https://api.xposedornot.com/v1/breaches"
USER_AGENT = "SivicScraper-BreachCheck/1.0"

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

# In-memory cache for the full breach catalog (~750 entries).
_catalog_cache: dict[str, dict[str, Any]] | None = None
_catalog_fetched_at: float = 0.0
_CATALOG_TTL_SECONDS = 6 * 60 * 60  # 6 hours


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _validate_email(email: str) -> None:
    if not email or not EMAIL_RE.match(email):
        raise ValueError("Enter a valid email address.")


def _request_json(url: str, *, timeout: float = 20.0) -> Any:
    response = requests.get(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
        timeout=timeout,
    )
    if response.status_code == 429:
        raise RuntimeError("Breach lookup is temporarily rate-limited. Try again shortly.")
    if response.status_code >= 500:
        raise RuntimeError("Breach data service is unavailable. Try again later.")
    if not response.ok and response.status_code not in (404,):
        raise RuntimeError(f"Upstream breach service error ({response.status_code}).")
    return response.json()


def _load_breach_catalog() -> dict[str, dict[str, Any]]:
    """Return breach metadata keyed by breachID (case-sensitive upstream ids)."""
    global _catalog_cache, _catalog_fetched_at

    now = time.time()
    if _catalog_cache is not None and (now - _catalog_fetched_at) < _CATALOG_TTL_SECONDS:
        return _catalog_cache

    payload = _request_json(XON_BREACHES_URL)
    rows = payload.get("exposedBreaches") if isinstance(payload, dict) else None
    if not isinstance(rows, list):
        raise RuntimeError("Unexpected breach catalog response.")

    catalog: dict[str, dict[str, Any]] = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        breach_id = str(row.get("breachID") or "").strip()
        if breach_id:
            catalog[breach_id] = row

    _catalog_cache = catalog
    _catalog_fetched_at = now
    return catalog


def _flatten_breach_names(payload: dict[str, Any]) -> list[str]:
    """XposedOrNot returns names nested in a single inner array."""
    raw = payload.get("breaches")
    if not isinstance(raw, list) or not raw:
        return []
    first = raw[0]
    if isinstance(first, list):
        return [str(name).strip() for name in first if str(name).strip()]
    if isinstance(first, str):
        return [first.strip()]
    return []


def _format_breach_row(breach_id: str, meta: dict[str, Any] | None) -> dict[str, Any]:
    exposed = []
    if meta and isinstance(meta.get("exposedData"), list):
        exposed = [str(item).strip() for item in meta["exposedData"] if str(item).strip()]

    return {
        "id": breach_id,
        "name": breach_id,
        "date": (meta or {}).get("breachedDate"),
        "added_date": (meta or {}).get("addedDate"),
        "domain": (meta or {}).get("domain") or None,
        "industry": (meta or {}).get("industry") or None,
        "exposed_records": (meta or {}).get("exposedRecords"),
        "exposed_data": exposed,
        "description": (meta or {}).get("exposureDescription") or None,
        "verified": bool((meta or {}).get("verified")),
        "sensitive": bool((meta or {}).get("sensitive")),
        "logo": (meta or {}).get("logo") or None,
    }


def get_email_breach_payload(email: str) -> dict[str, Any]:
    """
    Look up an email in XposedOrNot and return normalized breach results.

    Raises ValueError for invalid input and RuntimeError for upstream failures.
    """
    normalized = _normalize_email(email)
    _validate_email(normalized)

    encoded = quote(normalized, safe="")
    check_payload = _request_json(XON_CHECK_URL.format(email=encoded))

    if isinstance(check_payload, dict) and check_payload.get("Error") == "Not found":
        return {
            "email": normalized,
            "found": False,
            "breach_count": 0,
            "breaches": [],
            "source": "xposedornot",
        }

    names = _flatten_breach_names(check_payload if isinstance(check_payload, dict) else {})
    if not names:
        return {
            "email": normalized,
            "found": False,
            "breach_count": 0,
            "breaches": [],
            "source": "xposedornot",
        }

    catalog = _load_breach_catalog()
    breaches = [_format_breach_row(name, catalog.get(name)) for name in names]

    # Newest breaches first when metadata is available.
    breaches.sort(key=lambda row: str(row.get("date") or ""), reverse=True)

    return {
        "email": normalized,
        "found": True,
        "breach_count": len(breaches),
        "breaches": breaches,
        "source": "xposedornot",
    }

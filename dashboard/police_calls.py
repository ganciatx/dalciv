"""
Fetch Dallas Police Active Calls from Socrata, geocode block/location, expose map-ready JSON.
"""
from __future__ import annotations

import json
import os
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlencode

import requests

from dashboard.call_type_glossary import describe_call_type

# Socrata SODA 2.x resource endpoint (public dataset).
SOCRATA_DATASET_ID = "9fxf-t2tr"
SOCRATA_RESOURCE_URL = (
    f"https://www.dallasopendata.com/resource/{SOCRATA_DATASET_ID}.json"
)
SOCRATA_VIEW_META_URL = f"https://www.dallasopendata.com/api/views/{SOCRATA_DATASET_ID}.json"
SOURCE_PORTAL_URL = (
    "https://www.dallasopendata.com/Public-Safety/Dallas-Police-Active-Calls/9fxf-t2tr"
)

# Rough Dallas metro bounding box for geocode sanity checks.
DALLAS_LAT_MIN, DALLAS_LAT_MAX = 32.55, 33.25
DALLAS_LON_MIN, DALLAS_LON_MAX = -97.05, -96.45

# Nominatim usage policy: max 1 request per second.
GEOCODE_MIN_INTERVAL_SEC = 1.05
MAX_GEOCODE_PER_REQUEST = 25

_last_geocode_at = 0.0


def utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def geocode_cache_path(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / "geocode_cache.json"


def load_geocode_cache(project_root: Path) -> dict[str, Any]:
    path = geocode_cache_path(project_root)
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def save_geocode_cache(project_root: Path, cache: dict[str, Any]) -> None:
    path = geocode_cache_path(project_root)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def geocode_key(block: str, location: str) -> str:
    return f"{block.strip().lower()}|{location.strip().lower()}"


def build_address(block: str, location: str) -> str:
    block = (block or "").strip()
    location = (location or "").strip()
    if block and location:
        street = f"{block} {location}"
    else:
        street = location or block
    if not street:
        return ""
    return f"{street}, Dallas, TX"


def in_dallas_bbox(lat: float, lon: float) -> bool:
    return (
        DALLAS_LAT_MIN <= lat <= DALLAS_LAT_MAX
        and DALLAS_LON_MIN <= lon <= DALLAS_LON_MAX
    )


def _socrata_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/json",
        "User-Agent": "SivicScraper/1.0 (local dashboard; police map)",
    }
    token = os.environ.get("SOCRATA_APP_TOKEN", "").strip()
    if token:
        headers["X-App-Token"] = token
    return headers


def fetch_active_calls(limit: int = 500) -> list[dict[str, Any]]:
    """Pull active calls from Dallas Open Data (SODA 2.x)."""
    params = {
        "$limit": max(1, min(limit, 1000)),
        "$order": "time DESC",
    }
    url = f"{SOCRATA_RESOURCE_URL}?{urlencode(params)}"
    resp = requests.get(url, headers=_socrata_headers(), timeout=45)
    resp.raise_for_status()
    data = resp.json()
    if not isinstance(data, list):
        return []
    return data


def fetch_dataset_meta() -> dict[str, Any]:
    """Optional upstream ``rowsUpdatedAt`` for staleness hints in the UI."""
    try:
        resp = requests.get(SOCRATA_VIEW_META_URL, headers=_socrata_headers(), timeout=20)
        resp.raise_for_status()
        body = resp.json()
        updated = body.get("rowsUpdatedAt")
        if updated:
            return {
                "rows_updated_at": datetime.fromtimestamp(
                    int(updated) / 1000, tz=UTC
                ).isoformat(),
            }
    except Exception:
        pass
    return {}


def geocode_address(
    address: str,
    cache: dict[str, Any],
    *,
    cache_key: str,
    budget: list[int],
) -> tuple[Optional[float], Optional[float], str]:
    """
    Resolve lat/lon via Nominatim with JSON cache. Returns (lat, lon, status).
    status: ``ok`` | ``miss`` | ``fail`` | ``skipped``
    """
    global _last_geocode_at

    if not address:
        return None, None, "skipped"

    if cache_key in cache:
        hit = cache[cache_key]
        if hit.get("status") == "ok":
            return hit.get("lat"), hit.get("lon"), "ok"
        return None, None, str(hit.get("status", "fail"))

    # Cap geocode work per API request so polls stay responsive.
    if budget[0] <= 0:
        return None, None, "pending"

    elapsed = time.monotonic() - _last_geocode_at
    if elapsed < GEOCODE_MIN_INTERVAL_SEC:
        time.sleep(GEOCODE_MIN_INTERVAL_SEC - elapsed)

    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "json", "limit": 1},
            headers={
                "User-Agent": "SivicScraper/1.0 (local dashboard; police map)",
                "Accept": "application/json",
            },
            timeout=25,
        )
        _last_geocode_at = time.monotonic()
        resp.raise_for_status()
        results = resp.json()
        if not results:
            cache[cache_key] = {"status": "fail", "address": address}
            return None, None, "fail"

        lat = float(results[0]["lat"])
        lon = float(results[0]["lon"])
        if not in_dallas_bbox(lat, lon):
            cache[cache_key] = {"status": "fail", "address": address, "reason": "outside_bbox"}
            return None, None, "fail"

        cache[cache_key] = {
            "status": "ok",
            "lat": lat,
            "lon": lon,
            "address": address,
        }
        budget[0] -= 1
        return lat, lon, "ok"
    except Exception:
        cache[cache_key] = {"status": "fail", "address": address}
        return None, None, "fail"


def normalize_row(raw: dict[str, Any]) -> dict[str, Any]:
    block = str(raw.get("block") or "")
    location = str(raw.get("location") or "")
    address = build_address(block, location)
    nature = str(raw.get("nature_of_call") or "")
    return {
        "id": str(raw.get("incident_number") or ""),
        "incident_number": str(raw.get("incident_number") or ""),
        "division": str(raw.get("division") or ""),
        "nature_of_call": nature,
        "nature_of_call_description": describe_call_type(nature),
        "priority": str(raw.get("priority") or ""),
        "date": str(raw.get("date") or ""),
        "time": str(raw.get("time") or ""),
        "unit_number": str(raw.get("unit_number") or ""),
        "block": block,
        "location": location,
        "beat": str(raw.get("beat") or ""),
        "reporting_area": str(raw.get("reporting_area") or ""),
        "status": str(raw.get("status") or ""),
        "address": address,
        "lat": None,
        "lon": None,
        "geocode_status": "pending",
    }


def _priority_rank(priority: str) -> int:
    """Lower rank = more urgent (for choosing display priority across units)."""
    try:
        return int(str(priority).strip())
    except ValueError:
        return 99


def aggregate_by_incident(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Socrata returns one row per unit at scene; collapse to one record per
    ``incident_number`` with ``unit_count`` and ``units`` list.
    """
    groups: dict[str, dict[str, Any]] = {}

    for row in rows:
        inc = str(row.get("incident_number") or "").strip()
        if not inc:
            continue

        if inc not in groups:
            unit = str(row.get("unit_number") or "").strip()
            units = [unit] if unit else []
            groups[inc] = {
                **row,
                "id": inc,
                "units": units,
                "unit_count": len(units),
            }
            continue

        group = groups[inc]
        unit = str(row.get("unit_number") or "").strip()
        if unit and unit not in group["units"]:
            group["units"].append(unit)

        # Prefer highest urgency (lowest priority number) across units.
        if _priority_rank(row.get("priority", "")) < _priority_rank(
            group.get("priority", "")
        ):
            group["priority"] = row["priority"]

        # Keep latest reported time for display.
        if str(row.get("time") or "") > str(group.get("time") or ""):
            group["time"] = row["time"]

    aggregated: list[dict[str, Any]] = []
    for inc, group in groups.items():
        units = sorted(u for u in group["units"] if u)
        group["units"] = units
        group["unit_count"] = len(units)
        group["unit_number"] = ", ".join(units)
        group["id"] = inc
        aggregated.append(group)

    aggregated.sort(key=lambda c: str(c.get("time") or ""), reverse=True)
    return aggregated


def enrich_with_geocodes(
    calls: list[dict[str, Any]], project_root: Path
) -> list[dict[str, Any]]:
    cache = load_geocode_cache(project_root)
    budget = [MAX_GEOCODE_PER_REQUEST]

    for call in calls:
        key = geocode_key(call.get("block", ""), call.get("location", ""))
        if not key or key == "|":
            call["geocode_status"] = "skipped"
            continue

        lat, lon, status = geocode_address(
            call["address"], cache, cache_key=key, budget=budget
        )
        call["geocode_status"] = status
        if status == "ok" and lat is not None and lon is not None:
            call["lat"] = lat
            call["lon"] = lon

    save_geocode_cache(project_root, cache)
    return calls


def get_active_calls_payload(
    project_root: Path,
    *,
    limit: int = 500,
) -> dict[str, Any]:
    """Full API payload for ``GET /api/police/active-calls``."""
    raw_rows = fetch_active_calls(limit=limit)
    unit_rows = [normalize_row(r) for r in raw_rows if r.get("incident_number")]
    calls = aggregate_by_incident(unit_rows)
    calls = enrich_with_geocodes(calls, project_root)

    mapped = sum(
        1 for c in calls if c.get("lat") is not None and c.get("lon") is not None
    )
    meta = {
        "fetched_at": utc_now_iso(),
        "total": len(calls),
        "unit_rows": len(unit_rows),
        "mapped": mapped,
        "unmapped": len(calls) - mapped,
        "source_url": SOURCE_PORTAL_URL,
        "socrata_resource": SOCRATA_RESOURCE_URL,
        **fetch_dataset_meta(),
    }
    return {"calls": calls, "meta": meta}

"""
Ops portal payload and in-process API usage tracking for ``/command``.

Secrets (e.g. ``SOCRATA_APP_TOKEN``) are never included in responses.
"""
from __future__ import annotations

import os
import platform
import socket
import sys
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Optional

from . import campaign_finance, council_voting, police_calls
from .campaign_finance import CACHE_TTL_SEC as FINANCE_CACHE_TTL
from .campaign_finance import cache_is_stale as finance_cache_is_stale
from .campaign_finance import cache_path as finance_cache_path
from .council_voting import CACHE_TTL_SEC as VOTING_CACHE_TTL
from .council_voting import cache_is_stale as voting_cache_is_stale
from .council_voting import cache_path as voting_cache_path
from .police_calls import geocode_cache_path, load_geocode_cache
from .supervisor import ScraperSupervisor

# Pages whose APIs are documented on /command (Police + Council accountability).
PAGE_POLICE = "police"
PAGE_COUNCIL = "council"

NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"


def utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


class ApiUsageTracker:
    """Thread-safe per-route hit counts since process start."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._started_at = utc_now_iso()
        # key: "METHOD path" -> {count, last_at}
        self._hits: dict[str, dict[str, Any]] = {}

    @property
    def started_at(self) -> str:
        return self._started_at

    def should_track(self, path: str) -> bool:
        if path.startswith("/static"):
            return False
        if path == "/api/command":
            return False
        return True

    def record(self, method: str, path: str) -> None:
        if not self.should_track(path):
            return
        key = f"{method.upper()} {path}"
        now = utc_now_iso()
        with self._lock:
            row = self._hits.setdefault(key, {"count": 0, "last_at": None})
            row["count"] += 1
            row["last_at"] = now

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            rows = [
                {
                    "route": key,
                    "count": val["count"],
                    "last_at": val["last_at"],
                }
                for key, val in sorted(
                    self._hits.items(),
                    key=lambda item: (-item[1]["count"], item[0]),
                )
            ]
        return {
            "started_at": self._started_at,
            "total_requests": sum(r["count"] for r in rows),
            "routes": rows,
        }


class UpstreamApiTracker:
    """Outbound HTTP calls (Socrata, Nominatim) triggered by dashboard pages."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._started_at = utc_now_iso()
        # key: page|service|endpoint -> {count, last_at, url, page, service, endpoint}
        self._hits: dict[str, dict[str, Any]] = {}

    def record(
        self,
        *,
        page: str,
        service: str,
        endpoint: str,
        url: str = "",
    ) -> None:
        key = f"{page}|{service}|{endpoint}"
        now = utc_now_iso()
        with self._lock:
            row = self._hits.setdefault(
                key,
                {
                    "page": page,
                    "service": service,
                    "endpoint": endpoint,
                    "url": url,
                    "count": 0,
                    "last_at": None,
                },
            )
            row["count"] += 1
            row["last_at"] = now
            if url:
                row["url"] = url

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            rows = sorted(
                self._hits.values(),
                key=lambda r: (r["page"], r["service"], r["endpoint"]),
            )
        return {
            "started_at": self._started_at,
            "total_calls": sum(r["count"] for r in rows),
            "calls": [
                {
                    "page": r["page"],
                    "service": r["service"],
                    "endpoint": r["endpoint"],
                    "url": r.get("url") or "",
                    "count": r["count"],
                    "last_at": r["last_at"],
                }
                for r in rows
            ],
        }


# Module-level upstream tracker (import ``record_upstream_call`` from data modules).
UPSTREAM_USAGE = UpstreamApiTracker()


def record_upstream_call(
    *,
    page: str,
    service: str,
    endpoint: str,
    url: str = "",
) -> None:
    """Record an outbound API call for /command (safe to call from fetch helpers)."""
    UPSTREAM_USAGE.record(
        page=page, service=service, endpoint=endpoint, url=url
    )


def _usage_for_route(
    usage: dict[str, Any], method: str, path: str
) -> dict[str, Any]:
    key = f"{method.upper()} {path}"
    for row in usage.get("routes") or []:
        if row.get("route") == key:
            return {"hits": row["count"], "last_at": row.get("last_at")}
    return {"hits": 0, "last_at": None}


def _upstream_for_page(
    upstream: dict[str, Any], page: str
) -> list[dict[str, Any]]:
    return [c for c in upstream.get("calls") or [] if c.get("page") == page]


def _merge_upstream_defs(
    definitions: list[dict[str, Any]],
    tracked: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Combine static upstream catalog with live hit counts."""
    by_key = {
        (c.get("service"), c.get("endpoint")): c for c in tracked
    }
    merged: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for d in definitions:
        key = (d["service"], d["endpoint"])
        seen.add(key)
        hit = by_key.get(key) or {}
        merged.append(
            {
                **d,
                "count": hit.get("count", 0),
                "last_at": hit.get("last_at"),
            }
        )
    for c in tracked:
        key = (c.get("service"), c.get("endpoint"))
        if key in seen:
            continue
        merged.append(c)
    return merged


def build_page_api_catalog(
    *,
    usage: dict[str, Any],
    upstream: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Police & Council: dashboard endpoints the browser calls plus upstream data APIs.
    Merges live hit counts from middleware and ``UPSTREAM_USAGE``.
    """
    police_tracked = _upstream_for_page(upstream, PAGE_POLICE)
    council_tracked = _upstream_for_page(upstream, PAGE_COUNCIL)

    police_upstream_defs = [
        {
            "service": "Dallas Open Data (Socrata)",
            "endpoint": f"resource/{police_calls.SOCRATA_DATASET_ID}",
            "url": police_calls.SOCRATA_RESOURCE_URL,
            "note": "Live fetch on each GET /api/police/active-calls",
        },
        {
            "service": "Dallas Open Data (Socrata)",
            "endpoint": f"views/{police_calls.SOCRATA_DATASET_ID} metadata",
            "url": police_calls.SOCRATA_VIEW_META_URL,
            "note": "Dataset freshness metadata",
        },
        {
            "service": "Nominatim (OpenStreetMap)",
            "endpoint": "search",
            "url": NOMINATIM_SEARCH_URL,
            "note": f"Up to {police_calls.MAX_GEOCODE_PER_REQUEST} new lookups per active-calls request",
        },
    ]
    council_upstream_defs = [
        {
            "service": "Dallas Open Data (Socrata)",
            "endpoint": f"resource/{campaign_finance.SOCRATA_DATASET_ID}",
            "url": campaign_finance.SOCRATA_RESOURCE_URL,
            "note": "Campaign finance rows on cache refresh",
        },
        {
            "service": "Dallas Open Data (Socrata)",
            "endpoint": f"views/{campaign_finance.SOCRATA_DATASET_ID} metadata",
            "url": campaign_finance.SOCRATA_VIEW_META_URL,
            "note": "Finance dataset metadata",
        },
        {
            "service": "Dallas Open Data (Socrata)",
            "endpoint": f"resource/{council_voting.SOCRATA_DATASET_ID}",
            "url": council_voting.SOCRATA_RESOURCE_URL,
            "note": "Paginated voting records on cache refresh",
        },
        {
            "service": "Dallas Open Data (Socrata)",
            "endpoint": f"views/{council_voting.SOCRATA_DATASET_ID} metadata",
            "url": council_voting.SOCRATA_VIEW_META_URL,
            "note": "Voting dataset metadata",
        },
    ]

    def ep(
        method: str,
        path: str,
        description: str,
    ) -> dict[str, Any]:
        stats = _usage_for_route(usage, method, path)
        return {
            "method": method,
            "path": path,
            "description": description,
            **stats,
        }

    return [
        {
            "id": PAGE_POLICE,
            "title": "Police active calls",
            "ui_path": "/police",
            "dashboard_endpoints": [
                ep(
                    "GET",
                    "/api/police/active-calls",
                    "Map markers + right-rail feed; client polls ~every 90s",
                ),
            ],
            "upstream_endpoints": _merge_upstream_defs(
                police_upstream_defs, police_tracked
            ),
        },
        {
            "id": PAGE_COUNCIL,
            "title": "Council accountability",
            "ui_path": "/council-accountability",
            "dashboard_endpoints": [
                ep(
                    "GET",
                    "/api/council-accountability/directory",
                    "Member directory (finance + voting merge)",
                ),
                ep(
                    "GET",
                    "/api/council-accountability/member",
                    "Single-member profile when filtered",
                ),
                ep(
                    "GET",
                    "/api/council-voting/summary",
                    "Voting KPIs + member index",
                ),
                ep(
                    "GET",
                    "/api/council-voting/votes",
                    "Paginated roll-call rows (Voting tab, by member)",
                ),
                ep(
                    "GET",
                    "/api/council-voting/agenda-items",
                    "Paginated agenda items (Voting tab, by item)",
                ),
                ep(
                    "GET",
                    "/api/council-voting/agenda-item",
                    "Single roll call detail with member votes",
                ),
                ep(
                    "GET",
                    "/api/campaign-finance/summary",
                    "Finance KPIs + charts",
                ),
                ep(
                    "GET",
                    "/api/campaign-finance/transactions",
                    "Paginated transactions table",
                ),
            ],
            "upstream_endpoints": _merge_upstream_defs(
                council_upstream_defs, council_tracked
            ),
        },
    ]


def dir_size_bytes(path: Path) -> int:
    """Total file size under ``path`` (non-recursive for single files)."""
    if not path.exists():
        return 0
    if path.is_file():
        return path.stat().st_size
    total = 0
    try:
        for child in path.rglob("*"):
            if child.is_file():
                total += child.stat().st_size
    except OSError:
        pass
    return total


def _cache_file_status(
    path: Path,
    *,
    ttl_sec: int,
    stale_fn: Any,
    row_count_fn: Any,
) -> dict[str, Any]:
    exists = path.is_file()
    size_bytes = path.stat().st_size if exists else 0
    fetched_at: Optional[str] = None
    row_count: Optional[int] = None
    stale: Optional[bool] = None
    if exists:
        try:
            import json

            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                fetched_at = data.get("fetched_at")
                row_count = row_count_fn(data)
                stale = stale_fn(data)
        except Exception:
            stale = True
    return {
        "path": str(path),
        "exists": exists,
        "size_bytes": size_bytes,
        "fetched_at": fetched_at,
        "row_count": row_count,
        "cache_ttl_sec": ttl_sec,
        "stale": stale,
    }


def _geocode_cache_status(project_root: Path) -> dict[str, Any]:
    path = geocode_cache_path(project_root)
    exists = path.is_file()
    size_bytes = path.stat().st_size if exists else 0
    entries = len(load_geocode_cache(project_root)) if exists else 0
    return {
        "path": str(path),
        "exists": exists,
        "size_bytes": size_bytes,
        "entry_count": entries,
        "note": "Address → lat/lon; no fetched_at (updated per police API call)",
    }


def list_http_routes(app: Any) -> list[dict[str, str]]:
    """Registered FastAPI/Starlette routes (no mounted static tree)."""
    rows: list[dict[str, str]] = []
    for route in getattr(app, "routes", []):
        methods = getattr(route, "methods", None)
        path = getattr(route, "path", None)
        if not methods or not path:
            continue
        if getattr(route, "name", "") == "static":
            continue
        for method in sorted(methods):
            if method in ("HEAD", "OPTIONS"):
                continue
            rows.append({"method": method, "path": path})
    rows.sort(key=lambda r: (r["path"], r["method"]))
    return rows


def build_command_payload(
    project_root: Path,
    supervisor: ScraperSupervisor,
    *,
    app: Any,
    api_usage: ApiUsageTracker,
    scraper_enabled: bool,
    summarize_job_status: dict[str, Any],
) -> dict[str, Any]:
    """Aggregate non-sensitive ops snapshot for ``GET /api/command``."""
    st = supervisor.state()
    data_dir = project_root / "scraper_dashboard_data"
    downloads_dir = project_root / "dallas_legistar_downloads"
    usage_snap = api_usage.snapshot()
    upstream_snap = UPSTREAM_USAGE.snapshot()

    return {
        "generated_at": utc_now_iso(),
        "runtime": {
            "hostname": socket.gethostname(),
            "python": sys.version.split()[0],
            "platform": platform.platform(),
            "uptime_note": "API counters reset on process restart",
        },
        "environment": {
            "scraper_enabled": scraper_enabled,
            "dashboard_host": os.environ.get("DASHBOARD_HOST", "127.0.0.1"),
            "dashboard_port": os.environ.get("DASHBOARD_PORT", "8765"),
            "socrata_token_configured": bool(
                os.environ.get("SOCRATA_APP_TOKEN", "").strip()
            ),
            "git_commit": os.environ.get("GIT_COMMIT", "").strip() or None,
            "deploy_label": os.environ.get("DEPLOY_LABEL", "").strip() or None,
        },
        "supervisor": {
            "running": st.running,
            "run_id": st.run_id,
            "pid": st.pid,
            "started_at": st.started_at,
            "paths": {
                "project_root": str(project_root),
                "data_dir": str(data_dir),
                "downloads": str(downloads_dir),
                "audit_log": str(supervisor.audit_path),
                "active_run": str(supervisor.active_path),
                "summaries_store": str(data_dir / "summaries.json"),
            },
        },
        "summarize_job": summarize_job_status,
        "disk": {
            "scraper_dashboard_data_bytes": dir_size_bytes(data_dir),
            "dallas_legistar_downloads_bytes": dir_size_bytes(downloads_dir),
        },
        "socrata": {
            "campaign_finance": {
                "dataset_id": campaign_finance.SOCRATA_DATASET_ID,
                "resource_url": campaign_finance.SOCRATA_RESOURCE_URL,
                "portal_url": campaign_finance.SOURCE_PORTAL_URL,
                "cache": _cache_file_status(
                    finance_cache_path(project_root),
                    ttl_sec=FINANCE_CACHE_TTL,
                    stale_fn=finance_cache_is_stale,
                    row_count_fn=lambda d: len(d.get("rows") or []),
                ),
            },
            "council_voting": {
                "dataset_id": council_voting.SOCRATA_DATASET_ID,
                "resource_url": council_voting.SOCRATA_RESOURCE_URL,
                "portal_url": council_voting.SOURCE_PORTAL_URL,
                "cache": _cache_file_status(
                    voting_cache_path(project_root),
                    ttl_sec=VOTING_CACHE_TTL,
                    stale_fn=voting_cache_is_stale,
                    row_count_fn=lambda d: len(d.get("rows") or []),
                ),
            },
            "police_active_calls": {
                "dataset_id": police_calls.SOCRATA_DATASET_ID,
                "resource_url": police_calls.SOCRATA_RESOURCE_URL,
                "portal_url": police_calls.SOURCE_PORTAL_URL,
                "cache": {
                    "mode": "live_fetch",
                    "note": "No response cache; geocode entries persisted on disk",
                },
                "geocode_cache": _geocode_cache_status(project_root),
            },
        },
        "api_usage": usage_snap,
        "upstream_usage": upstream_snap,
        "page_apis": build_page_api_catalog(
            usage=usage_snap,
            upstream=upstream_snap,
        ),
        "routes": list_http_routes(app),
    }


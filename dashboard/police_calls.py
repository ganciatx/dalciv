"""
Fetch Dallas Police Active Calls from Socrata, geocode block/location, expose map-ready JSON.
"""
from __future__ import annotations

import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
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

# Nominatim usage policy: max 1 request per second (fallback only).
GEOCODE_MIN_INTERVAL_SEC = 1.05
CENSUS_GEOCODE_URL = (
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
)
CENSUS_BENCHMARK = "Public_AR_Current"
CENSUS_MAX_WORKERS = 6
MAX_GEOCODE_PER_REQUEST = 40
# Each poll geocodes uncached addresses (Census is fast; fills cache between Socrata fetches).
DEFAULT_GEOCODE_BUDGET = 12
# Active-calls JSON cache — matches map poll interval so polls avoid Socrata.
RESPONSE_CACHE_TTL_SEC = 90

_last_geocode_at = 0.0
_nominatim_lock = Lock()


def utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def geocode_cache_path(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / "geocode_cache.json"


def response_cache_path(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / "police_active_calls_cache.json"


def load_response_cache(project_root: Path) -> Optional[dict[str, Any]]:
    path = response_cache_path(project_root)
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) and "calls" in data else None
    except Exception:
        return None


def save_response_cache(project_root: Path, payload: dict[str, Any]) -> None:
    path = response_cache_path(project_root)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def response_cache_age_sec(payload: dict[str, Any]) -> float:
    fetched = (payload.get("meta") or {}).get("fetched_at")
    if not fetched:
        return float("inf")
    try:
        ts = datetime.fromisoformat(str(fetched).replace("Z", "+00:00"))
        return max(0.0, (datetime.now(tz=UTC) - ts).total_seconds())
    except ValueError:
        return float("inf")


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


def geocode_query_variants(address: str) -> list[str]:
    """Try alternate phrasing for intersections and abbreviated streets."""
    addr = (address or "").strip()
    if not addr:
        return []
    variants = [addr]
    if " / " in addr:
        base = addr.replace(", Dallas, TX", "").strip()
        parts = [p.strip() for p in base.split(" / ") if p.strip()]
        if len(parts) == 2:
            variants.append(f"{parts[0]} & {parts[1]}, Dallas, TX")
            variants.append(f"{parts[0]} and {parts[1]}, Dallas, TX")
    seen: set[str] = set()
    out: list[str] = []
    for v in variants:
        if v and v not in seen:
            seen.add(v)
            out.append(v)
    return out


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
    try:
        from .command_center import PAGE_POLICE, record_upstream_call

        record_upstream_call(
            page=PAGE_POLICE,
            service="Dallas Open Data (Socrata)",
            endpoint=f"resource/{SOCRATA_DATASET_ID}",
            url=SOCRATA_RESOURCE_URL,
        )
    except Exception:
        pass
    resp.raise_for_status()
    data = resp.json()
    if not isinstance(data, list):
        return []
    return data


def fetch_dataset_meta() -> dict[str, Any]:
    """Optional upstream ``rowsUpdatedAt`` for staleness hints in the UI."""
    try:
        resp = requests.get(SOCRATA_VIEW_META_URL, headers=_socrata_headers(), timeout=20)
        try:
            from .command_center import PAGE_POLICE, record_upstream_call

            record_upstream_call(
                page=PAGE_POLICE,
                service="Dallas Open Data (Socrata)",
                endpoint=f"views/{SOCRATA_DATASET_ID} metadata",
                url=SOCRATA_VIEW_META_URL,
            )
        except Exception:
            pass
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


def geocode_address_census(address: str) -> tuple[Optional[float], Optional[float], bool]:
    """US Census geocoder — fast, no 1 req/s throttle. Returns (lat, lon, matched)."""
    try:
        resp = requests.get(
            CENSUS_GEOCODE_URL,
            params={
                "address": address,
                "benchmark": CENSUS_BENCHMARK,
                "format": "json",
            },
            headers={
                "User-Agent": "SivicScraper/1.0 (local dashboard; police map)",
                "Accept": "application/json",
            },
            timeout=12,
        )
        try:
            from .command_center import PAGE_POLICE, record_upstream_call

            record_upstream_call(
                page=PAGE_POLICE,
                service="US Census Geocoder",
                endpoint="locations/onelineaddress",
                url=CENSUS_GEOCODE_URL,
            )
        except Exception:
            pass
        resp.raise_for_status()
        matches = resp.json().get("result", {}).get("addressMatches") or []
        if not matches:
            return None, None, False
        coords = matches[0].get("coordinates") or {}
        lat = float(coords["y"])
        lon = float(coords["x"])
        if not in_dallas_bbox(lat, lon):
            return None, None, False
        return lat, lon, True
    except Exception:
        return None, None, False


def geocode_address_nominatim(address: str) -> tuple[Optional[float], Optional[float], bool]:
    """Fallback for intersections / addresses Census misses."""
    global _last_geocode_at

    with _nominatim_lock:
        elapsed = time.monotonic() - _last_geocode_at
        if elapsed < GEOCODE_MIN_INTERVAL_SEC:
            time.sleep(GEOCODE_MIN_INTERVAL_SEC - elapsed)

    try:
        nominatim_url = "https://nominatim.openstreetmap.org/search"
        resp = requests.get(
            nominatim_url,
            params={"q": address, "format": "json", "limit": 1},
            headers={
                "User-Agent": "SivicScraper/1.0 (local dashboard; police map)",
                "Accept": "application/json",
            },
            timeout=25,
        )
        try:
            from .command_center import PAGE_POLICE, record_upstream_call

            record_upstream_call(
                page=PAGE_POLICE,
                service="Nominatim (OpenStreetMap)",
                endpoint="search",
                url=nominatim_url,
            )
        except Exception:
            pass
        with _nominatim_lock:
            _last_geocode_at = time.monotonic()
        resp.raise_for_status()
        results = resp.json()
        if not results:
            return None, None, False
        lat = float(results[0]["lat"])
        lon = float(results[0]["lon"])
        if not in_dallas_bbox(lat, lon):
            return None, None, False
        return lat, lon, True
    except Exception:
        return None, None, False


def _resolve_address_coords(address: str) -> tuple[Optional[float], Optional[float], str, str]:
    """Census first (parallel-safe), then Nominatim. Returns lat, lon, status, matched_query."""
    for query in geocode_query_variants(address):
        lat, lon, ok = geocode_address_census(query)
        if ok:
            return lat, lon, "ok", query
    for query in geocode_query_variants(address):
        lat, lon, ok = geocode_address_nominatim(query)
        if ok:
            return lat, lon, "ok", query
    return None, None, "fail", address


def geocode_address(
    address: str,
    cache: dict[str, Any],
    *,
    cache_key: str,
    budget: list[int],
) -> tuple[Optional[float], Optional[float], str]:
    """
    Resolve lat/lon with JSON cache. Returns (lat, lon, status).
    status: ``ok`` | ``pending`` | ``fail`` | ``skipped``
    """
    if not address:
        return None, None, "skipped"

    if cache_key in cache:
        hit = cache[cache_key]
        if hit.get("status") == "ok":
            return hit.get("lat"), hit.get("lon"), "ok"
        return None, None, str(hit.get("status", "fail"))

    if budget[0] <= 0:
        return None, None, "pending"

    lat, lon, status, matched = _resolve_address_coords(address)
    budget[0] -= 1
    if status == "ok" and lat is not None and lon is not None:
        cache[cache_key] = {
            "status": "ok",
            "lat": lat,
            "lon": lon,
            "address": matched,
            "provider": "census_or_nominatim",
        }
        return lat, lon, "ok"
    cache[cache_key] = {"status": "fail", "address": address}
    return None, None, "fail"


def combine_dispatch_datetime(date_str: str, time_str: str) -> str:
    """
    Merge Socrata ``date`` + ``time`` into one ISO timestamp.

    ``date`` is often ``YYYY-MM-DDTHH:MM:SS.sss`` with midnight; actual clock time
    is in ``time`` (``HH:MM:SS``).
    """
    d = str(date_str or "").strip()
    t = str(time_str or "00:00:00").strip()
    if not d and not t:
        return utc_now_iso()
    date_part = d[:10] if len(d) >= 10 else d
    time_part = t.split("T")[-1] if "T" in t else t
    if len(time_part) == 5:
        time_part = f"{time_part}:00"
    try:
        # Dallas Open Data times are local civil time (no offset in source).
        dt = datetime.fromisoformat(f"{date_part}T{time_part}")
        return dt.isoformat()
    except ValueError:
        return utc_now_iso()


def _dispatch_sort_key(row: dict[str, Any]) -> str:
    return str(row.get("dispatched_at") or combine_dispatch_datetime(
        str(row.get("date") or ""), str(row.get("time") or "")
    ))


def normalize_row(raw: dict[str, Any]) -> dict[str, Any]:
    block = str(raw.get("block") or "")
    location = str(raw.get("location") or "")
    address = build_address(block, location)
    nature = str(raw.get("nature_of_call") or "")
    date_s = str(raw.get("date") or "")
    time_s = str(raw.get("time") or "")
    return {
        "id": str(raw.get("incident_number") or ""),
        "incident_number": str(raw.get("incident_number") or ""),
        "division": str(raw.get("division") or ""),
        "nature_of_call": nature,
        "nature_of_call_description": describe_call_type(nature),
        "priority": str(raw.get("priority") or ""),
        "date": date_s,
        "time": time_s,
        "dispatched_at": combine_dispatch_datetime(date_s, time_s),
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

        # Keep latest dispatch time for display.
        if _dispatch_sort_key(row) > _dispatch_sort_key(group):
            group["time"] = row["time"]
            group["date"] = row["date"]
            group["dispatched_at"] = row.get("dispatched_at")

    aggregated: list[dict[str, Any]] = []
    for inc, group in groups.items():
        units = sorted(u for u in group["units"] if u)
        group["units"] = units
        group["unit_count"] = len(units)
        group["unit_number"] = ", ".join(units)
        group["id"] = inc
        aggregated.append(group)

    aggregated.sort(key=_dispatch_sort_key, reverse=True)
    return aggregated


def apply_geocodes_from_cache_only(
    calls: list[dict[str, Any]], project_root: Path
) -> list[dict[str, Any]]:
    """Apply persisted lat/lon only — no Nominatim on the request critical path."""
    cache = load_geocode_cache(project_root)
    for call in calls:
        key = geocode_key(call.get("block", ""), call.get("location", ""))
        if not key or key == "|":
            call["geocode_status"] = "skipped"
            continue
        hit = cache.get(key)
        if hit and hit.get("status") == "ok":
            call["lat"] = hit.get("lat")
            call["lon"] = hit.get("lon")
            call["geocode_status"] = "ok"
        elif hit:
            call["geocode_status"] = str(hit.get("status", "fail"))
        else:
            call["geocode_status"] = "pending"
    return calls


def _calls_needing_geocode(
    calls: list[dict[str, Any]], cache: dict[str, Any]
) -> list[dict[str, Any]]:
    pending: list[dict[str, Any]] = []
    for call in calls:
        key = geocode_key(call.get("block", ""), call.get("location", ""))
        if not key or key == "|" or not call.get("address"):
            continue
        hit = cache.get(key)
        if hit and hit.get("status") in ("ok", "fail"):
            continue
        pending.append(call)
    pending.sort(key=lambda c: _priority_rank(c.get("priority", "")))
    return pending


def enrich_with_geocodes(
    calls: list[dict[str, Any]],
    project_root: Path,
    *,
    max_budget: int = MAX_GEOCODE_PER_REQUEST,
) -> list[dict[str, Any]]:
    cache = load_geocode_cache(project_root)
    budget = [max(0, min(max_budget, MAX_GEOCODE_PER_REQUEST))]
    pending = _calls_needing_geocode(calls, cache)[: budget[0]]

    def _geocode_call(call: dict[str, Any]) -> tuple[str, Optional[float], Optional[float], str]:
        key = geocode_key(call.get("block", ""), call.get("location", ""))
        lat, lon, status, matched = _resolve_address_coords(call["address"])
        if status == "ok" and lat is not None and lon is not None:
            cache[key] = {
                "status": "ok",
                "lat": lat,
                "lon": lon,
                "address": matched,
                "provider": "census_or_nominatim",
            }
        else:
            cache[key] = {"status": "fail", "address": call["address"]}
        return key, lat, lon, status

    if pending:
        workers = min(CENSUS_MAX_WORKERS, len(pending))
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = [pool.submit(_geocode_call, c) for c in pending]
            for fut in as_completed(futures):
                try:
                    fut.result()
                except Exception:
                    pass
        budget[0] = max(0, budget[0] - len(pending))

    for call in calls:
        key = geocode_key(call.get("block", ""), call.get("location", ""))
        if not key or key == "|":
            call["geocode_status"] = "skipped"
            continue
        hit = cache.get(key)
        if hit and hit.get("status") == "ok":
            call["lat"] = hit.get("lat")
            call["lon"] = hit.get("lon")
            call["geocode_status"] = "ok"
        elif hit:
            call["geocode_status"] = str(hit.get("status", "fail"))
        else:
            call["geocode_status"] = "pending"

    save_geocode_cache(project_root, cache)
    return calls


def _build_payload_meta(
    calls: list[dict[str, Any]],
    *,
    unit_rows: int,
    from_cache: bool,
    response_cache_age: Optional[float] = None,
    include_dataset_meta: bool = True,
) -> dict[str, Any]:
    mapped = sum(
        1 for c in calls if c.get("lat") is not None and c.get("lon") is not None
    )
    meta: dict[str, Any] = {
        "fetched_at": utc_now_iso(),
        "total": len(calls),
        "unit_rows": unit_rows,
        "mapped": mapped,
        "unmapped": len(calls) - mapped,
        "source_url": SOURCE_PORTAL_URL,
        "socrata_resource": SOCRATA_RESOURCE_URL,
        "from_response_cache": from_cache,
        "response_cache_ttl_sec": RESPONSE_CACHE_TTL_SEC,
    }
    if response_cache_age is not None:
        meta["response_cache_age_sec"] = round(response_cache_age, 1)
    if include_dataset_meta:
        meta.update(fetch_dataset_meta())
    return meta


def get_active_calls_payload(
    project_root: Path,
    *,
    limit: int = 500,
    force_refresh: bool = False,
    geocode_budget: int = DEFAULT_GEOCODE_BUDGET,
) -> dict[str, Any]:
    """Full API payload for ``GET /api/police/active-calls``."""
    from_cache = False
    unit_rows = 0
    calls: list[dict[str, Any]] = []
    cached_meta: dict[str, Any] = {}
    cache_age_sec: Optional[float] = None
    cached_payload: Optional[dict[str, Any]] = None

    if not force_refresh:
        cached_payload = load_response_cache(project_root)
        if cached_payload is not None:
            cache_age_sec = response_cache_age_sec(cached_payload)
            if cache_age_sec < RESPONSE_CACHE_TTL_SEC:
                from_cache = True
                calls = list(cached_payload.get("calls") or [])
                cached_meta = dict(cached_payload.get("meta") or {})
                unit_rows = int(cached_meta.get("unit_rows") or 0)

    if not from_cache:
        raw_rows = fetch_active_calls(limit=limit)
        unit_rows = len([r for r in raw_rows if r.get("incident_number")])
        rows = [normalize_row(r) for r in raw_rows if r.get("incident_number")]
        calls = aggregate_by_incident(rows)

    calls = apply_geocodes_from_cache_only(calls, project_root)
    if geocode_budget > 0:
        calls = enrich_with_geocodes(calls, project_root, max_budget=geocode_budget)

    if from_cache:
        meta = dict(cached_meta)
        meta.update(
            _build_payload_meta(
                calls,
                unit_rows=unit_rows,
                from_cache=True,
                response_cache_age=cache_age_sec,
                include_dataset_meta=False,
            )
        )
        meta["from_response_cache"] = True
        if cache_age_sec is not None:
            meta["response_cache_age_sec"] = round(cache_age_sec, 1)
    else:
        meta = _build_payload_meta(
            calls,
            unit_rows=unit_rows,
            from_cache=False,
            include_dataset_meta=True,
        )

    payload = {"calls": calls, "meta": meta}
    save_response_cache(project_root, payload)
    return payload

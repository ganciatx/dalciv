"""
Dallas City Budget (Socrata revenue + operating): fetch, cache, aggregate for dashboard APIs.
"""
from __future__ import annotations

import json
import os
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal, Optional
from urllib.parse import urlencode

import requests

DatasetKind = Literal["revenue", "operating", "vendor"]

REVENUE_DATASET_ID = "rtn4-pmj9"
OPERATING_DATASET_ID = "e2fs-y4nb"
VENDOR_PAYMENTS_DATASET_ID = "x5ih-idh7"

REVENUE_RESOURCE_URL = (
    f"https://www.dallasopendata.com/resource/{REVENUE_DATASET_ID}.json"
)
OPERATING_RESOURCE_URL = (
    f"https://www.dallasopendata.com/resource/{OPERATING_DATASET_ID}.json"
)
REVENUE_VIEW_META_URL = (
    f"https://www.dallasopendata.com/api/views/{REVENUE_DATASET_ID}.json"
)
OPERATING_VIEW_META_URL = (
    f"https://www.dallasopendata.com/api/views/{OPERATING_DATASET_ID}.json"
)
REVENUE_PORTAL_URL = (
    "https://www.dallasopendata.com/Economy/Revenue-Budget/rtn4-pmj9/about_data"
)
OPERATING_PORTAL_URL = (
    "https://www.dallasopendata.com/Economy/Operating-Budget/e2fs-y4nb/about_data"
)
VENDOR_RESOURCE_URL = (
    f"https://www.dallasopendata.com/resource/{VENDOR_PAYMENTS_DATASET_ID}.json"
)
VENDOR_VIEW_META_URL = (
    f"https://www.dallasopendata.com/api/views/{VENDOR_PAYMENTS_DATASET_ID}.json"
)
VENDOR_PORTAL_URL = (
    "https://www.dallasopendata.com/Economy/"
    "Vendor-Payments-for-Fiscal-Year-2019-Present/x5ih-idh7/about_data"
)

CACHE_TTL_SEC = 86400  # ~24h; adopted budget updates on fiscal cycles.
SOCRATA_PAGE_SIZE = 50000  # Socrata max per request
BULK_ROWS_LIMIT = 10000  # UI full-FY load (Excel Data sheets: ~626 rev + ~779 op rows/FY)
VENDOR_PAGE_SIZE = 10000

_REVSOURCE_TYPE_MAP: Optional[dict[str, str]] = None


def utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def revenue_cache_path(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / "revenue_budget_cache.json"


def operating_cache_path(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / "operating_budget_cache.json"


def vendor_cache_path(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / "vendor_payments_cache.json"


def _socrata_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/json",
        "User-Agent": "SivicScraper/1.0 (local dashboard; city budget)",
    }
    token = os.environ.get("SOCRATA_APP_TOKEN", "").strip()
    if token:
        headers["X-App-Token"] = token
    return headers


def _record_upstream(dataset_id: str, resource_url: str, *, meta: bool = False) -> None:
    try:
        from .command_center import PAGE_BUDGET, record_upstream_call

        record_upstream_call(
            page=PAGE_BUDGET,
            service="Dallas Open Data (Socrata)",
            endpoint=f"views/{dataset_id} metadata" if meta else f"resource/{dataset_id}",
            url=resource_url,
        )
    except Exception:
        pass


def parse_amount(raw: Any) -> Optional[float]:
    if raw is None or raw == "":
        return None
    try:
        return float(str(raw).replace(",", "").strip())
    except ValueError:
        return None


def _load_revsource_type_map(project_root: Path) -> dict[str, str]:
    """Plain-language / account revsource → REVTYPE (from Revenue_Budget spreadsheet)."""
    global _REVSOURCE_TYPE_MAP
    if _REVSOURCE_TYPE_MAP is not None:
        return _REVSOURCE_TYPE_MAP
    path = (
        project_root
        / "dashboard"
        / "static"
        / "dallas-budget"
        / "revsource-type-map.json"
    )
    if path.is_file():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                _REVSOURCE_TYPE_MAP = {
                    str(k).strip(): str(v).strip()
                    for k, v in data.items()
                    if k and v
                }
                return _REVSOURCE_TYPE_MAP
        except Exception:
            pass
    _REVSOURCE_TYPE_MAP = {}
    return _REVSOURCE_TYPE_MAP


def _infer_revtype(revsource: str) -> str:
    s = revsource.lower()
    if any(x in s for x in ("property", "tax rate", "ad valorem", "prop.tax")):
        return "Property Taxes"
    if any(x in s for x in ("water", "wastewater", "stormwater", "utility", "sanitation")):
        return "Utility Revenue"
    if any(x in s for x in ("sales tax", "hotel", "occupancy")):
        return "Taxes"
    if "franchise" in s:
        return "Franchise & Licensing Revenue"
    if any(x in s for x in ("permit", "license")):
        return "Permits & Licenses"
    if any(x in s for x in ("fine", "penalt", "ticket")):
        return "Fines & Penalties"
    if any(x in s for x in ("grant", "intergovernmental", "federal", "state")):
        return "Intergovernmental Revenue"
    if any(x in s for x in ("interest", "investment")):
        return "Investment & Interest Income"
    if any(x in s for x in ("rent", "lease")):
        return "Rents & Leases"
    if any(x in s for x in ("fee", "charge", "service", "chgs serv")):
        return "Service Fees"
    if any(x in s for x in ("transfer", "interfund", "internal")):
        return "Internal/Interfund Revenue"
    return "Other Revenue"


def fetch_dataset_rows(resource_url: str, dataset_id: str) -> list[dict[str, Any]]:
    """Paginate until all rows are loaded (matches full Excel Data export)."""
    all_rows: list[dict[str, Any]] = []
    offset = 0
    while True:
        params = {
            "$limit": SOCRATA_PAGE_SIZE,
            "$offset": offset,
            "$order": "bfy DESC",
        }
        url = f"{resource_url}?{urlencode(params)}"
        resp = requests.get(url, headers=_socrata_headers(), timeout=180)
        _record_upstream(dataset_id, resource_url)
        resp.raise_for_status()
        batch = resp.json()
        if not isinstance(batch, list) or not batch:
            break
        all_rows.extend(batch)
        if len(batch) < SOCRATA_PAGE_SIZE:
            break
        offset += SOCRATA_PAGE_SIZE
    return all_rows


def fetch_dataset_meta(view_meta_url: str, dataset_id: str) -> dict[str, Any]:
    try:
        resp = requests.get(view_meta_url, headers=_socrata_headers(), timeout=20)
        _record_upstream(dataset_id, view_meta_url, meta=True)
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


def fetch_revenue_budget() -> list[dict[str, Any]]:
    return fetch_dataset_rows(REVENUE_RESOURCE_URL, REVENUE_DATASET_ID)


def fetch_operating_budget() -> list[dict[str, Any]]:
    return fetch_dataset_rows(OPERATING_RESOURCE_URL, OPERATING_DATASET_ID)


def fetch_vendor_payments_for_fy(fy: str) -> list[dict[str, Any]]:
    """Paginate vendor payment rows for one fiscal year (~50k+ rows)."""
    fy_clean = str(fy or "").strip()
    if not fy_clean:
        return []
    all_rows: list[dict[str, Any]] = []
    offset = 0
    while True:
        params: dict[str, Any] = {
            "$limit": VENDOR_PAGE_SIZE,
            "$offset": offset,
            "$order": "chksubtot DESC",
            "$where": f"fy='{fy_clean}'",
        }
        url = f"{VENDOR_RESOURCE_URL}?{urlencode(params)}"
        resp = requests.get(url, headers=_socrata_headers(), timeout=180)
        _record_upstream(VENDOR_PAYMENTS_DATASET_ID, VENDOR_RESOURCE_URL)
        resp.raise_for_status()
        batch = resp.json()
        if not isinstance(batch, list) or not batch:
            break
        all_rows.extend(batch)
        if len(batch) < VENDOR_PAGE_SIZE:
            break
        offset += VENDOR_PAGE_SIZE
    return all_rows


def normalize_revenue_row(
    raw: dict[str, Any],
    *,
    revtype_map: Optional[dict[str, str]] = None,
) -> dict[str, Any]:
    budcurr = parse_amount(raw.get("budcurr"))
    revbfy = parse_amount(raw.get("revbfy"))
    revsource = str(raw.get("revsource") or "").strip()
    revsource_pl = str(raw.get("revsource_pl") or raw.get("revsourcepl") or "").strip()
    revtype_raw = str(raw.get("revtype") or "").strip()
    type_map = revtype_map or {}
    revtype = (
        revtype_raw
        or type_map.get(revsource)
        or type_map.get(revsource_pl)
        or _infer_revtype(revsource or revsource_pl)
    )
    return {
        "dataset": "revenue",
        "bfy": str(raw.get("bfy") or "").strip(),
        "ftyp": str(raw.get("ftyp") or "").strip(),
        "fundtype": str(raw.get("fundtype") or "").strip(),
        "department": str(raw.get("department") or "").strip(),
        "rsrc": str(raw.get("rsrc") or "").strip(),
        "revsource": revsource,
        "revsource_pl": revsource_pl,
        "revtype": revtype,
        "amount_budget": budcurr,
        "amount_revenue_fy": revbfy,
        "budcurr_raw": str(raw.get("budcurr") or ""),
        "revbfy_raw": str(raw.get("revbfy") or ""),
    }


def normalize_operating_row(raw: dict[str, Any]) -> dict[str, Any]:
    # Excel "DEPARTMENT" column = Socrata appropriation name (e.g. Police Department GF).
    dept = str(raw.get("appropriation") or raw.get("department") or "").strip()
    return {
        "dataset": "operating",
        "bfy": str(raw.get("bfy") or "").strip(),
        "ftyp": str(raw.get("ftyp") or "").strip(),
        "fundtype": str(raw.get("fundtype") or "").strip(),
        "appr": str(raw.get("appr") or "").strip(),
        "appropriation": dept,
        "department": dept,
        "svc": str(raw.get("svc") or "").strip(),
        "service": str(raw.get("service") or "").strip(),
        "objectgroup": str(raw.get("objectgroup") or "").strip(),
        "amount_budget": parse_amount(raw.get("budcurr")),
        "amount_encumbered": parse_amount(raw.get("encbfy")),
        "amount_expenditure": parse_amount(raw.get("expbfy")),
        "amount_enc_exp": parse_amount(raw.get("encexp")),
        "budcurr_raw": str(raw.get("budcurr") or ""),
        "encbfy_raw": str(raw.get("encbfy") or ""),
        "expbfy_raw": str(raw.get("expbfy") or ""),
        "encexp_raw": str(raw.get("encexp") or ""),
    }


def normalize_vendor_row(raw: dict[str, Any]) -> dict[str, Any]:
    fy = str(raw.get("fy") or "").strip()
    return {
        "dataset": "vendor",
        "bfy": fy,
        "fy": fy,
        "fm": str(raw.get("fm") or "").strip(),
        "docid": str(raw.get("docid") or "").strip(),
        "vendor": str(raw.get("vendor") or "").strip(),
        "vcode": str(raw.get("vcode") or "").strip(),
        "amount_payment": parse_amount(raw.get("chksubtot")),
        "fundtype": str(raw.get("fundtype") or "").strip(),
        "ftyp": str(raw.get("ftyp") or "").strip(),
        "department": str(raw.get("department") or "").strip(),
        "dpt": str(raw.get("dpt") or "").strip(),
        "activity": str(raw.get("activity") or "").strip(),
        "objectgroup": str(raw.get("objectgroup") or "").strip(),
        "object": str(raw.get("object") or "").strip(),
        "commoditydscr": str(raw.get("commoditydscr") or "").strip(),
        "chksubtot_raw": str(raw.get("chksubtot") or ""),
    }


def load_cache(path: Path) -> Optional[dict[str, Any]]:
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def save_cache(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def cache_is_stale(cached: dict[str, Any]) -> bool:
    fetched = cached.get("fetched_at")
    if not fetched:
        return True
    try:
        ts = datetime.fromisoformat(str(fetched).replace("Z", "+00:00"))
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=UTC)
        age = (datetime.now(tz=UTC) - ts).total_seconds()
        return age >= CACHE_TTL_SEC
    except Exception:
        return True


def refresh_revenue_cache(project_root: Path) -> dict[str, Any]:
    raw_rows = fetch_revenue_budget()
    type_map = _load_revsource_type_map(project_root)
    rows = [normalize_revenue_row(r, revtype_map=type_map) for r in raw_rows]
    payload = {
        "fetched_at": utc_now_iso(),
        "row_count": len(rows),
        "rows": rows,
        "meta": {
            "source_url": REVENUE_PORTAL_URL,
            "socrata_resource": REVENUE_RESOURCE_URL,
            "dataset": "revenue",
            **fetch_dataset_meta(REVENUE_VIEW_META_URL, REVENUE_DATASET_ID),
        },
    }
    save_cache(revenue_cache_path(project_root), payload)
    return payload


def _rank_vendor_totals(
    totals: dict[str, float],
    counts: dict[str, int],
    *,
    limit: int,
) -> list[dict[str, Any]]:
    ranked = sorted(totals.items(), key=lambda x: x[1], reverse=True)[:limit]
    return [
        {
            "vendor": name,
            "amount": round(amount, 2),
            "payments": counts.get(name, 0),
        }
        for name, amount in ranked
    ]


def _top_groups_from_amount_map(
    totals: dict[str, float],
    *,
    limit: int = 12,
) -> list[dict[str, Any]]:
    ranked = sorted(totals.items(), key=lambda x: abs(x[1]), reverse=True)[:limit]
    return [{"label": name, "total": round(total, 2)} for name, total in ranked]


def build_vendor_aggregates(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Summarize check-level vendor payments for dashboard (avoid shipping 50k+ rows)."""
    by_vendor: dict[str, float] = defaultdict(float)
    vendor_counts: dict[str, int] = defaultdict(int)
    by_objectgroup: dict[str, float] = defaultdict(float)
    by_department_vendor: dict[str, dict[str, float]] = defaultdict(
        lambda: defaultdict(float)
    )
    dept_payment_count: dict[str, int] = defaultdict(int)
    total_paid = 0.0

    for row in rows:
        amt = row.get("amount_payment")
        if amt is None:
            continue
        amount = float(amt)
        total_paid += amount
        vendor = str(row.get("vendor") or "Unknown").strip() or "Unknown"
        dept = str(row.get("department") or "Unknown").strip() or "Unknown"
        og = str(row.get("objectgroup") or "Unknown").strip() or "Unknown"
        by_vendor[vendor] += amount
        vendor_counts[vendor] += 1
        by_objectgroup[og] += amount
        by_department_vendor[dept][vendor] += amount
        dept_payment_count[dept] += 1

    by_department: dict[str, Any] = {}
    for dept, vendor_totals in by_department_vendor.items():
        v_counts = {
            v: sum(
                1
                for r in rows
                if r.get("department") == dept
                and str(r.get("vendor") or "Unknown").strip() == v
            )
            for v in vendor_totals
        }
        by_department[dept] = {
            "total": round(sum(vendor_totals.values()), 2),
            "payments": dept_payment_count.get(dept, 0),
            "top_vendors": _rank_vendor_totals(vendor_totals, v_counts, limit=8),
        }

    return {
        "total_paid": round(total_paid, 2),
        "payment_count": len(rows),
        "top_vendors": _rank_vendor_totals(by_vendor, vendor_counts, limit=20),
        "by_objectgroup": _top_groups_from_amount_map(by_objectgroup, limit=12),
        "by_department": by_department,
    }


def link_services_to_vendor_departments(
    service_names: list[str],
    vendor_by_department: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    """Map operating-budget service labels to vendor-payment department aggregates."""
    links: dict[str, dict[str, Any]] = {}
    dept_keys = list(vendor_by_department.keys())

    def score_match(service: str, vendor_dept: str) -> int:
        slow = service.lower()
        vlow = vendor_dept.lower()
        if slow in vlow or vlow in slow:
            return 100 + min(len(slow), len(vlow))
        svc_tokens = {t for t in slow.replace("&", " ").split() if len(t) > 2}
        v_tokens = {t for t in vlow.replace("&", " ").split() if len(t) > 2}
        overlap = len(svc_tokens & v_tokens)
        return overlap * 15

    for svc in service_names:
        best_key: Optional[str] = None
        best_score = 14
        for vdept in dept_keys:
            s = score_match(svc, vdept)
            if s > best_score:
                best_score = s
                best_key = vdept
        if best_key:
            links[svc] = {
                "vendor_department": best_key,
                **vendor_by_department[best_key],
            }
    return links


def refresh_vendor_cache(project_root: Path, fy: str) -> dict[str, Any]:
    raw_rows = fetch_vendor_payments_for_fy(fy)
    rows = [normalize_vendor_row(r) for r in raw_rows]
    aggregates = build_vendor_aggregates(rows)
    payload = {
        "fetched_at": utc_now_iso(),
        "fy": str(fy).strip(),
        "row_count": len(rows),
        "rows": rows,
        "aggregates": aggregates,
        "meta": {
            "source_url": VENDOR_PORTAL_URL,
            "socrata_resource": VENDOR_RESOURCE_URL,
            "dataset": "vendor",
            **fetch_dataset_meta(VENDOR_VIEW_META_URL, VENDOR_PAYMENTS_DATASET_ID),
        },
    }
    save_cache(vendor_cache_path(project_root), payload)
    return payload


def get_vendor_cached(
    project_root: Path,
    fy: str,
    *,
    force_refresh: bool = False,
) -> dict[str, Any]:
    path = vendor_cache_path(project_root)
    fy_clean = str(fy or "").strip()

    def _has_vendor(c: dict[str, Any]) -> bool:
        return bool(c.get("aggregates")) and str(c.get("fy") or "") == fy_clean

    if force_refresh:
        return refresh_vendor_cache(project_root, fy_clean)

    cached = load_cache(path)
    if cached and _has_vendor(cached):
        stale = cache_is_stale(cached)
        from .data_sync import JOB_BUDGET, attach_cache_meta, maybe_schedule_stale

        maybe_schedule_stale(project_root, JOB_BUDGET, cached, cache_is_stale)
        return attach_cache_meta(cached, job_id=JOB_BUDGET, stale=stale)

    from .data_sync import JOB_BUDGET, schedule_refresh, warming_rows_document

    schedule_refresh(project_root, JOB_BUDGET, force=True)
    doc = warming_rows_document("vendor")
    doc["fy"] = fy_clean
    return doc


def refresh_operating_cache(project_root: Path) -> dict[str, Any]:
    raw_rows = fetch_operating_budget()
    rows = [normalize_operating_row(r) for r in raw_rows]
    payload = {
        "fetched_at": utc_now_iso(),
        "row_count": len(rows),
        "rows": rows,
        "meta": {
            "source_url": OPERATING_PORTAL_URL,
            "socrata_resource": OPERATING_RESOURCE_URL,
            "dataset": "operating",
            **fetch_dataset_meta(OPERATING_VIEW_META_URL, OPERATING_DATASET_ID),
        },
    }
    save_cache(operating_cache_path(project_root), payload)
    return payload


def _serve_budget_cache(
    project_root: Path,
    path: Path,
    dataset: str,
    *,
    force_refresh: bool,
    refresh_fn: Any,
    has_rows: Any,
) -> dict[str, Any]:
    if force_refresh:
        return refresh_fn(project_root)

    cached = load_cache(path)
    if cached and has_rows(cached):
        stale = cache_is_stale(cached)
        from .data_sync import JOB_BUDGET, attach_cache_meta, maybe_schedule_stale

        maybe_schedule_stale(project_root, JOB_BUDGET, cached, cache_is_stale)
        return attach_cache_meta(cached, job_id=JOB_BUDGET, stale=stale)

    from .data_sync import JOB_BUDGET, schedule_refresh, warming_rows_document

    schedule_refresh(project_root, JOB_BUDGET, force=True)
    doc = warming_rows_document(dataset)
    doc["meta"]["dataset"] = dataset
    return doc


def get_revenue_cached(
    project_root: Path, *, force_refresh: bool = False
) -> dict[str, Any]:
    return _serve_budget_cache(
        project_root,
        revenue_cache_path(project_root),
        "revenue",
        force_refresh=force_refresh,
        refresh_fn=refresh_revenue_cache,
        has_rows=lambda c: bool(c.get("rows")),
    )


def get_operating_cached(
    project_root: Path, *, force_refresh: bool = False
) -> dict[str, Any]:
    return _serve_budget_cache(
        project_root,
        operating_cache_path(project_root),
        "operating",
        force_refresh=force_refresh,
        refresh_fn=refresh_operating_cache,
        has_rows=lambda c: bool(c.get("rows")),
    )


def refresh_all_budget_caches(project_root: Path) -> dict[str, Any]:
    """Background job: refresh revenue, operating, and vendor for default FY."""
    rev = refresh_revenue_cache(project_root)
    op = refresh_operating_cache(project_root)
    revenue_rows: list[dict[str, Any]] = rev.get("rows") or []
    operating_rows: list[dict[str, Any]] = op.get("rows") or []
    bfy = _default_bfy(revenue_rows, operating_rows, None) or str(
        datetime.now(tz=UTC).year
    )
    vendor = refresh_vendor_cache(project_root, bfy)
    return {
        "row_count": len(revenue_rows) + len(operating_rows) + len(vendor.get("rows") or []),
        "bfy": bfy,
    }


def _sum_amount(rows: list[dict[str, Any]], field: str = "amount_budget") -> float:
    total = 0.0
    for row in rows:
        amt = row.get(field)
        if amt is not None:
            total += float(amt)
    return round(total, 2)


def build_fund_totals(rows: list[dict[str, Any]]) -> dict[str, float]:
    """Sum ``amount_budget`` by ``fundtype`` (matches Open Data pivot on BFY + fundtype)."""
    totals: dict[str, float] = defaultdict(float)
    for row in rows:
        label = str(row.get("fundtype") or "Unknown").strip() or "Unknown"
        amt = row.get("amount_budget")
        if amt is not None:
            totals[label] += float(amt)
    return {name: round(total, 2) for name, total in totals.items()}


def available_bfys(
    revenue_rows: list[dict[str, Any]],
    operating_rows: list[dict[str, Any]],
) -> list[str]:
    years: set[str] = set()
    for row in revenue_rows + operating_rows:
        bfy = str(row.get("bfy") or "").strip()
        if bfy:
            years.add(bfy)
    return sorted(years, reverse=True)


def available_fundtypes(rows: list[dict[str, Any]]) -> list[str]:
    types = sorted({str(r.get("fundtype") or "").strip() for r in rows if r.get("fundtype")})
    return types


def apply_budget_filters(
    rows: list[dict[str, Any]],
    *,
    bfy: Optional[str] = None,
    ftyp: Optional[str] = None,
    fundtype: Optional[str] = None,
    department: Optional[str] = None,
    service: Optional[str] = None,
) -> list[dict[str, Any]]:
    out = rows
    if bfy:
        y = bfy.strip()
        out = [r for r in out if r.get("bfy") == y]
    if ftyp:
        t = ftyp.strip()
        out = [r for r in out if r.get("ftyp") == t]
    if fundtype:
        ft = fundtype.strip()
        out = [r for r in out if r.get("fundtype") == ft]
    if department:
        d = department.strip()
        out = [r for r in out if r.get("department") == d]
    if service:
        s = service.strip()
        out = [r for r in out if r.get("service") == s]
    return out


def search_rows(
    rows: list[dict[str, Any]],
    q: Optional[str],
    *,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    filtered = rows
    if q:
        needle = q.strip().lower()
        if needle:

            def matches(row: dict[str, Any]) -> bool:
                hay = " ".join(str(row.get(k) or "") for k in row).lower()
                return needle in hay

            filtered = [r for r in filtered if matches(r)]
    total = len(filtered)
    page = filtered[offset : offset + limit]
    return page, total


def _top_groups(
    rows: list[dict[str, Any]],
    key: str,
    *,
    limit: int = 12,
) -> list[dict[str, Any]]:
    totals: dict[str, float] = defaultdict(float)
    for row in rows:
        label = str(row.get(key) or "Unknown").strip() or "Unknown"
        amt = row.get("amount_budget")
        if amt is None:
            continue
        totals[label] += float(amt)
    ranked = sorted(totals.items(), key=lambda x: abs(x[1]), reverse=True)[:limit]
    return [{"label": name, "total": round(total, 2)} for name, total in ranked]


def build_fund_comparison(
    revenue_rows: list[dict[str, Any]],
    operating_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    rev_by_fund: dict[str, float] = defaultdict(float)
    op_by_fund: dict[str, float] = defaultdict(float)
    for row in revenue_rows:
        ft = row.get("fundtype") or "Unknown"
        amt = row.get("amount_budget")
        if amt is not None:
            rev_by_fund[ft] += float(amt)
    for row in operating_rows:
        ft = row.get("fundtype") or "Unknown"
        amt = row.get("amount_budget")
        if amt is not None:
            op_by_fund[ft] += float(amt)
    funds = sorted(set(rev_by_fund) | set(op_by_fund))
    out: list[dict[str, Any]] = []
    for ft in funds:
        out.append(
            {
                "fundtype": ft,
                "revenue_budget": round(rev_by_fund.get(ft, 0.0), 2),
                "operating_budget": round(op_by_fund.get(ft, 0.0), 2),
            }
        )
    out.sort(key=lambda x: max(x["revenue_budget"], x["operating_budget"]), reverse=True)
    return out


def build_overview(
    revenue_rows: list[dict[str, Any]],
    operating_rows: list[dict[str, Any]],
    *,
    bfy: Optional[str] = None,
    ftyp: Optional[str] = None,
    fundtype: Optional[str] = None,
) -> dict[str, Any]:
    rev = apply_budget_filters(
        revenue_rows, bfy=bfy, ftyp=ftyp, fundtype=fundtype
    )
    op = apply_budget_filters(
        operating_rows, bfy=bfy, ftyp=ftyp, fundtype=fundtype
    )
    fund_rev = build_fund_totals(rev)
    fund_op = build_fund_totals(op)
    return {
        "kpis": {
            "total_revenue_budget": _sum_amount(rev),
            "total_operating_budget": _sum_amount(op),
            "general_fund_revenue_budget": fund_rev.get("General Fund", 0.0),
            "general_fund_operating_budget": fund_op.get("General Fund", 0.0),
            "revenue_row_count": len(rev),
            "operating_row_count": len(op),
            "bfy": bfy,
        },
        "charts": {
            "fund_comparison": build_fund_comparison(rev, op),
            "revenue_by_fundtype": _top_groups(rev, "fundtype", limit=10),
            "operating_by_fundtype": _top_groups(op, "fundtype", limit=10),
        },
        "fund_totals": {
            "revenue": build_fund_totals(rev),
            "operating": build_fund_totals(op),
        },
    }


def build_revenue_charts(rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "by_fundtype": _top_groups(rows, "fundtype", limit=12),
        "by_department": _top_groups(rows, "department", limit=12),
        "by_revsource": _top_groups(rows, "revsource", limit=12),
    }


def build_operating_charts(rows: list[dict[str, Any]]) -> dict[str, Any]:
    by_service = _top_groups(rows, "service", limit=12)
    by_object = _top_groups(rows, "objectgroup", limit=10)
    enc_total = round(
        sum(float(r.get("amount_encumbered") or 0) for r in rows),
        2,
    )
    exp_total = round(
        sum(float(r.get("amount_expenditure") or 0) for r in rows),
        2,
    )
    return {
        "by_fundtype": _top_groups(rows, "fundtype", limit=12),
        "by_service": by_service,
        "by_objectgroup": by_object,
        "encumbrance_total": enc_total,
        "expenditure_total": exp_total,
    }


def _default_bfy(
    revenue_rows: list[dict[str, Any]],
    operating_rows: list[dict[str, Any]],
    requested: Optional[str],
) -> Optional[str]:
    if requested and requested.strip():
        return requested.strip()
    years = available_bfys(revenue_rows, operating_rows)
    return years[0] if years else None


def _filter_options(
    revenue_rows: list[dict[str, Any]],
    operating_rows: list[dict[str, Any]],
    *,
    bfy: Optional[str],
) -> dict[str, Any]:
    rev_f = apply_budget_filters(revenue_rows, bfy=bfy) if bfy else revenue_rows
    op_f = apply_budget_filters(operating_rows, bfy=bfy) if bfy else operating_rows
    return {
        "bfys": available_bfys(revenue_rows, operating_rows),
        "fundtypes": sorted(
            set(available_fundtypes(rev_f)) | set(available_fundtypes(op_f))
        ),
        "ftypes": sorted(
            {
                str(r.get("ftyp") or "").strip()
                for r in rev_f + op_f
                if r.get("ftyp")
            }
        ),
        "departments": sorted(
            {str(r.get("department") or "").strip() for r in rev_f if r.get("department")}
        ),
        "services": sorted(
            {str(r.get("service") or "").strip() for r in op_f if r.get("service")}
        ),
    }


def get_summary_payload(
    project_root: Path,
    *,
    force_refresh: bool = False,
    refresh_revenue: bool = False,
    refresh_operating: bool = False,
    bfy: Optional[str] = None,
    ftyp: Optional[str] = None,
    fundtype: Optional[str] = None,
) -> dict[str, Any]:
    rev_cached = get_revenue_cached(
        project_root, force_refresh=force_refresh or refresh_revenue
    )
    op_cached = get_operating_cached(
        project_root, force_refresh=force_refresh or refresh_operating
    )
    revenue_rows: list[dict[str, Any]] = rev_cached.get("rows") or []
    operating_rows: list[dict[str, Any]] = op_cached.get("rows") or []
    selected_bfy = _default_bfy(revenue_rows, operating_rows, bfy)

    overview = build_overview(
        revenue_rows,
        operating_rows,
        bfy=selected_bfy,
        ftyp=ftyp,
        fundtype=fundtype,
    )

    return {
        "overview": overview,
        "filters": _filter_options(revenue_rows, operating_rows, bfy=selected_bfy),
        "selected": {
            "bfy": selected_bfy,
            "ftyp": ftyp,
            "fundtype": fundtype,
        },
        "revenue_meta": {
            "fetched_at": rev_cached.get("fetched_at"),
            "row_count": rev_cached.get("row_count"),
            **(rev_cached.get("meta") or {}),
        },
        "operating_meta": {
            "fetched_at": op_cached.get("fetched_at"),
            "row_count": op_cached.get("row_count"),
            **(op_cached.get("meta") or {}),
        },
    }


def get_revenue_payload(
    project_root: Path,
    *,
    force_refresh: bool = False,
    bfy: Optional[str] = None,
    ftyp: Optional[str] = None,
    fundtype: Optional[str] = None,
) -> dict[str, Any]:
    cached = get_revenue_cached(project_root, force_refresh=force_refresh)
    all_rows: list[dict[str, Any]] = cached.get("rows") or []
    selected_bfy = _default_bfy(all_rows, [], bfy)
    filtered = apply_budget_filters(
        all_rows,
        bfy=selected_bfy,
        ftyp=ftyp,
        fundtype=fundtype,
    )
    return {
        "charts": build_revenue_charts(filtered),
        "filters": _filter_options(all_rows, [], bfy=selected_bfy),
        "selected": {"bfy": selected_bfy, "ftyp": ftyp, "fundtype": fundtype},
        "meta": {
            "fetched_at": cached.get("fetched_at"),
            "row_count": cached.get("row_count"),
            "filtered_count": len(filtered),
            **(cached.get("meta") or {}),
        },
    }


def get_operating_payload(
    project_root: Path,
    *,
    force_refresh: bool = False,
    bfy: Optional[str] = None,
    ftyp: Optional[str] = None,
    fundtype: Optional[str] = None,
) -> dict[str, Any]:
    cached = get_operating_cached(project_root, force_refresh=force_refresh)
    all_rows: list[dict[str, Any]] = cached.get("rows") or []
    selected_bfy = _default_bfy([], all_rows, bfy)
    filtered = apply_budget_filters(
        all_rows,
        bfy=selected_bfy,
        ftyp=ftyp,
        fundtype=fundtype,
    )
    return {
        "charts": build_operating_charts(filtered),
        "filters": _filter_options([], all_rows, bfy=selected_bfy),
        "selected": {"bfy": selected_bfy, "ftyp": ftyp, "fundtype": fundtype},
        "meta": {
            "fetched_at": cached.get("fetched_at"),
            "row_count": cached.get("row_count"),
            "filtered_count": len(filtered),
            **(cached.get("meta") or {}),
        },
    }


def get_rows_payload(
    project_root: Path,
    dataset: DatasetKind,
    *,
    force_refresh: bool = False,
    bfy: Optional[str] = None,
    ftyp: Optional[str] = None,
    fundtype: Optional[str] = None,
    department: Optional[str] = None,
    service: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    if dataset == "revenue":
        cached = get_revenue_cached(project_root, force_refresh=force_refresh)
        all_rows = cached.get("rows") or []
        selected_bfy = _default_bfy(all_rows, [], bfy)
        filtered = apply_budget_filters(
            all_rows,
            bfy=selected_bfy,
            ftyp=ftyp,
            fundtype=fundtype,
            department=department,
        )
    elif dataset == "operating":
        cached = get_operating_cached(project_root, force_refresh=force_refresh)
        all_rows = cached.get("rows") or []
        selected_bfy = _default_bfy([], all_rows, bfy)
        filtered = apply_budget_filters(
            all_rows,
            bfy=selected_bfy,
            ftyp=ftyp,
            fundtype=fundtype,
            service=service,
        )
    else:
        rev_cached = get_revenue_cached(project_root)
        op_cached = get_operating_cached(project_root)
        revenue_rows: list[dict[str, Any]] = rev_cached.get("rows") or []
        operating_rows: list[dict[str, Any]] = op_cached.get("rows") or []
        selected_bfy = _default_bfy(revenue_rows, operating_rows, bfy)
        if not selected_bfy:
            selected_bfy = str(datetime.now(tz=UTC).year)
        cached = get_vendor_cached(
            project_root, selected_bfy, force_refresh=force_refresh
        )
        all_rows = cached.get("rows") or []
        if not all_rows and force_refresh:
            raw = fetch_vendor_payments_for_fy(selected_bfy)
            all_rows = [normalize_vendor_row(r) for r in raw]
        filtered = apply_budget_filters(
            all_rows,
            bfy=selected_bfy,
            ftyp=ftyp,
            fundtype=fundtype,
            department=department,
        )

    page, total = search_rows(filtered, q, limit=limit, offset=offset)
    return {
        "dataset": dataset,
        "rows": page,
        "total": total,
        "limit": limit,
        "offset": offset,
        "selected": {
            "bfy": selected_bfy,
            "ftyp": ftyp,
            "fundtype": fundtype,
            "department": department,
            "service": service,
            "q": q,
        },
        "meta": {
            "fetched_at": cached.get("fetched_at"),
            "row_count": cached.get("row_count"),
            **(cached.get("meta") or {}),
        },
    }


def get_vendor_payload(
    project_root: Path,
    *,
    force_refresh: bool = False,
    refresh_vendor: bool = False,
    bfy: Optional[str] = None,
    service_names: Optional[list[str]] = None,
) -> dict[str, Any]:
    rev_cached = get_revenue_cached(project_root)
    op_cached = get_operating_cached(project_root)
    revenue_rows: list[dict[str, Any]] = rev_cached.get("rows") or []
    operating_rows: list[dict[str, Any]] = op_cached.get("rows") or []
    selected_bfy = _default_bfy(revenue_rows, operating_rows, bfy)
    if not selected_bfy:
        selected_bfy = str(datetime.now(tz=UTC).year)

    cached = get_vendor_cached(
        project_root,
        selected_bfy,
        force_refresh=force_refresh or refresh_vendor,
    )
    aggregates = cached.get("aggregates") or {}
    by_department = aggregates.get("by_department") or {}

    if service_names is None:
        op_filtered = apply_budget_filters(operating_rows, bfy=selected_bfy)
        service_names = sorted(
            {str(r.get("service") or "").strip() for r in op_filtered if r.get("service")}
        )

    department_links = link_services_to_vendor_departments(
        service_names, by_department
    )

    return {
        "fy": selected_bfy,
        "aggregates": aggregates,
        "department_links": department_links,
        "selected": {"bfy": selected_bfy},
        "meta": {
            "fetched_at": cached.get("fetched_at"),
            "row_count": cached.get("row_count"),
            "portal_url": VENDOR_PORTAL_URL,
            **(cached.get("meta") or {}),
        },
    }


def get_bootstrap_payload(
    project_root: Path,
    *,
    force_refresh: bool = False,
    bfy: Optional[str] = None,
) -> dict[str, Any]:
    """
    Single response for the city-budget UI: summary + full FY revenue/operating rows.
    """
    summary = get_summary_payload(project_root, force_refresh=force_refresh, bfy=bfy)
    selected_bfy = str(
        summary.get("selected", {}).get("bfy")
        or summary.get("overview", {}).get("kpis", {}).get("bfy")
        or ""
    ).strip()
    if not selected_bfy:
        selected_bfy = str(datetime.now(tz=UTC).year)

    rev_cached = get_revenue_cached(project_root, force_refresh=force_refresh)
    op_cached = get_operating_cached(project_root, force_refresh=force_refresh)
    revenue_rows: list[dict[str, Any]] = rev_cached.get("rows") or []
    operating_rows: list[dict[str, Any]] = op_cached.get("rows") or []

    rev_fy = apply_budget_filters(revenue_rows, bfy=selected_bfy)
    op_fy = apply_budget_filters(operating_rows, bfy=selected_bfy)

    bfys = (summary.get("filters") or {}).get("bfys") or available_bfys(
        revenue_rows, operating_rows
    )
    prior = None
    for y in sorted((str(b) for b in bfys), reverse=True):
        try:
            if int(y) < int(selected_bfy):
                prior = y
                break
        except ValueError:
            continue

    rev_prev: list[dict[str, Any]] = []
    op_prev: list[dict[str, Any]] = []
    if prior:
        rev_prev = apply_budget_filters(revenue_rows, bfy=prior)
        op_prev = apply_budget_filters(operating_rows, bfy=prior)

    warming = bool(
        (rev_cached.get("meta") or {}).get("cache_warming")
        or (op_cached.get("meta") or {}).get("cache_warming")
    )

    return {
        "summary": summary,
        "selected_bfy": selected_bfy,
        "prior_bfy": prior,
        "revenue_rows": rev_fy,
        "operating_rows": op_fy,
        "revenue_rows_prior": rev_prev,
        "operating_rows_prior": op_prev,
        "revenue_total": len(rev_fy),
        "operating_total": len(op_fy),
        "meta": {
            "cache_warming": warming,
            "revenue_fetched_at": rev_cached.get("fetched_at"),
            "operating_fetched_at": op_cached.get("fetched_at"),
        },
    }

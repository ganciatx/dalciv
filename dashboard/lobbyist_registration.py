"""
Dallas lobbyist registration (Socrata ffkm-63hd): fetch, cache, aggregate.

Portal: https://www.dallasopendata.com/Services/Lobbyist-Registration/ffkm-63hd/about_data
"""
from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlencode

import requests

SOCRATA_DATASET_ID = "ffkm-63hd"
SOCRATA_RESOURCE_URL = (
    f"https://www.dallasopendata.com/resource/{SOCRATA_DATASET_ID}.json"
)
SOCRATA_VIEW_META_URL = (
    f"https://www.dallasopendata.com/api/views/{SOCRATA_DATASET_ID}.json"
)
SOURCE_PORTAL_URL = (
    "https://www.dallasopendata.com/Services/"
    "Lobbyist-Registration/ffkm-63hd/about_data"
)

CACHE_TTL_SEC = 86400  # registrations change infrequently
PAGE_SIZE = 10000


def utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def cache_path(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / "lobbyist_registration_cache.json"


def _socrata_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/json",
        "User-Agent": "SivicScraper/1.0 (local dashboard; lobbyist registration)",
    }
    token = os.environ.get("SOCRATA_APP_TOKEN", "").strip()
    if token:
        headers["X-App-Token"] = token
    return headers


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def entity_match_key(name: str) -> str:
    """Loose key for matching lobby clients to campaign-finance counterparties."""
    s = normalize_whitespace(name).lower()
    s = re.sub(r"[^\w\s&]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    for suffix in (
        " llc",
        " inc",
        " corp",
        " corporation",
        " llp",
        " lp",
        " co",
        " company",
        " ltd",
    ):
        if s.endswith(suffix):
            s = s[: -len(suffix)].strip()
    return s


def _report_link(raw: Any) -> str:
    if isinstance(raw, dict):
        return str(raw.get("url") or "").strip().replace("\\", "/")
    return str(raw or "").strip()


def normalize_row(raw: dict[str, Any]) -> dict[str, Any]:
    sworn = str(raw.get("sworndate") or "").strip()
    return {
        "search_id": str(raw.get("searchid") or "").strip(),
        "report_id": str(raw.get("reportid") or "").strip(),
        "lobbyist_name": normalize_whitespace(str(raw.get("lobbyistname") or "")),
        "client_name": normalize_whitespace(str(raw.get("clientname") or "")),
        "lobbyist_type": normalize_whitespace(str(raw.get("lobbyisttype") or "")),
        "report_description": normalize_whitespace(str(raw.get("reportdescription") or "")),
        "sworn_date": sworn,
        "sworn_year": sworn[:4] if len(sworn) >= 4 else "",
        "report_link": _report_link(raw.get("reportlink")),
        "client_key": entity_match_key(str(raw.get("clientname") or "")),
    }


def fetch_lobbyist_registrations() -> list[dict[str, Any]]:
    """Fetch all lobbyist registration rows (dataset is ~3.4k rows)."""
    all_rows: list[dict[str, Any]] = []
    offset = 0
    while True:
        params = {
            "$limit": PAGE_SIZE,
            "$offset": offset,
            "$order": "sworndate DESC",
        }
        url = f"{SOCRATA_RESOURCE_URL}?{urlencode(params)}"
        resp = requests.get(url, headers=_socrata_headers(), timeout=120)
        try:
            from .command_center import PAGE_COUNCIL, record_upstream_call

            record_upstream_call(
                page=PAGE_COUNCIL,
                service="Dallas Open Data (Socrata)",
                endpoint=f"resource/{SOCRATA_DATASET_ID}",
                url=SOCRATA_RESOURCE_URL,
            )
        except Exception:
            pass
        resp.raise_for_status()
        batch = resp.json()
        if not isinstance(batch, list) or not batch:
            break
        all_rows.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return all_rows


def fetch_dataset_meta() -> dict[str, Any]:
    try:
        resp = requests.get(SOCRATA_VIEW_META_URL, headers=_socrata_headers(), timeout=30)
        resp.raise_for_status()
        meta = resp.json()
        return {
            "dataset_name": meta.get("name"),
            "updated_at": meta.get("rowsUpdatedAt"),
            "row_count_upstream": meta.get("rowsUpdatedAt"),
        }
    except Exception:
        return {}


def dedupe_registrations(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """One card per report_id (Socrata has multiple file rows per registration)."""
    by_report: dict[str, dict[str, Any]] = {}
    for row in rows:
        rid = row.get("report_id") or row.get("search_id")
        if not rid:
            continue
        prev = by_report.get(rid)
        if not prev:
            by_report[rid] = row
            continue
        link = row.get("report_link") or ""
        prev_link = prev.get("report_link") or ""
        if "FinalReports" in link and "FinalReports" not in prev_link:
            by_report[rid] = row
        elif (row.get("sworn_date") or "") > (prev.get("sworn_date") or ""):
            by_report[rid] = row
    return list(by_report.values())


def load_cache(project_root: Path) -> Optional[dict[str, Any]]:
    path = cache_path(project_root)
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def save_cache(project_root: Path, payload: dict[str, Any]) -> None:
    path = cache_path(project_root)
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


def refresh_cache(project_root: Path) -> dict[str, Any]:
    raw_rows = fetch_lobbyist_registrations()
    rows = dedupe_registrations([normalize_row(r) for r in raw_rows if r.get("reportid")])
    payload = {
        "fetched_at": utc_now_iso(),
        "row_count": len(rows),
        "rows": rows,
        "meta": {
            "source_url": SOURCE_PORTAL_URL,
            "socrata_resource": SOCRATA_RESOURCE_URL,
            **fetch_dataset_meta(),
        },
    }
    save_cache(project_root, payload)
    return payload


def get_cached_rows(project_root: Path, *, force_refresh: bool = False) -> dict[str, Any]:
    if force_refresh:
        return refresh_cache(project_root)

    cached = load_cache(project_root)
    if cached and cached.get("rows") is not None:
        stale = cache_is_stale(cached)
        from .data_sync import JOB_LOBBYIST, attach_cache_meta, maybe_schedule_stale

        maybe_schedule_stale(project_root, JOB_LOBBYIST, cached, cache_is_stale)
        return attach_cache_meta(cached, job_id=JOB_LOBBYIST, stale=stale)

    from .data_sync import JOB_LOBBYIST, schedule_refresh, warming_rows_document

    schedule_refresh(project_root, JOB_LOBBYIST, force=True)
    return warming_rows_document("lobbyist_registration")


def top_clients_from_rows(
    rows: list[dict[str, Any]],
    *,
    limit: int = 12,
) -> list[dict[str, Any]]:
    client_counts: dict[str, int] = defaultdict(int)
    for r in rows:
        c = r.get("client_name") or "Unknown"
        client_counts[c] += 1
    return [
        {"client": name, "registrations": count}
        for name, count in sorted(client_counts.items(), key=lambda x: -x[1])[:limit]
    ]


def filter_registrations_for_member(
    rows: list[dict[str, Any]],
    member_overlap: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Keep lobby registrations for clients tied to a councilmember's campaign."""
    if not member_overlap:
        return []
    keys = {
        o.get("match_key") or entity_match_key(o.get("entity") or "")
        for o in member_overlap
    }
    keys.discard("")
    if not keys:
        return []
    return [
        r
        for r in rows
        if (r.get("client_key") or entity_match_key(r.get("client_name") or ""))
        in keys
    ]


def member_scoped_summary(
    base: dict[str, Any],
    *,
    member_overlap: list[dict[str, Any]],
    member_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    """Replace global overlap KPIs with member-specific counts."""
    contributor_overlaps = [
        o
        for o in member_overlap
        if o.get("campaign_role") in ("contributor", "both")
        or (o.get("campaign_contributed") or 0) > 0
    ]
    vendor_only_overlaps = [
        o
        for o in member_overlap
        if o.get("campaign_role") == "recipient"
        or (
            (o.get("campaign_contributed") or 0) <= 0
            and (o.get("campaign_received") or 0) > 0
        )
    ]
    lobbyists = {r["lobbyist_name"] for r in member_rows if r.get("lobbyist_name")}
    clients = {r["client_name"] for r in member_rows if r.get("client_name")}
    return {
        **base,
        "influence_overlap": member_overlap,
        "overlap_count": len(member_overlap),
        "overlap_contributor_count": len(contributor_overlaps),
        "overlap_vendor_count": len(vendor_only_overlaps),
        "registration_count": len(member_rows),
        "lobbyist_firm_count": len(lobbyists),
        "client_count": len(clients),
        "top_clients": top_clients_from_rows(member_rows),
        "recent_registrations": sorted(
            member_rows, key=lambda r: r.get("sworn_date") or "", reverse=True
        )[:15],
    }


def search_registrations(
    rows: list[dict[str, Any]],
    q: Optional[str],
    *,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    needle = (q or "").strip().lower()
    if needle:
        filtered = [
            r
            for r in rows
            if needle in (r.get("lobbyist_name") or "").lower()
            or needle in (r.get("client_name") or "").lower()
            or needle in (r.get("report_description") or "").lower()
        ]
    else:
        filtered = rows
    filtered = sorted(
        filtered,
        key=lambda r: r.get("sworn_date") or "",
        reverse=True,
    )
    total = len(filtered)
    page = filtered[offset : offset + limit]
    return page, total


def build_finance_entity_index(
    finance_rows: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    """entity_match_key → aggregated campaign-finance activity."""
    from .campaign_finance import row_counterparty

    index: dict[str, dict[str, Any]] = {}
    for row in finance_rows:
        cp = row_counterparty(row)
        if not cp:
            continue
        key = entity_match_key(cp)
        if not key:
            continue
        entry = index.setdefault(
            key,
            {
                "display_name": cp,
                "contributed": 0.0,
                "received": 0.0,
                "transaction_count": 0,
                "candidates": set(),
                "contribution_candidates": set(),
                "expenditure_candidates": set(),
            },
        )
        amt = row.get("amount_num")
        if amt is None:
            continue
        amt = float(amt)
        if amt <= 0:
            continue
        cand = row.get("candidate_name") or "Unknown"
        entry["candidates"].add(cand)
        entry["transaction_count"] += 1
        if row.get("kind") == "contribution":
            entry["contributed"] += amt
            entry["contribution_candidates"].add(cand)
        elif row.get("kind") == "expenditure":
            entry["received"] += amt
            entry["expenditure_candidates"].add(cand)

    for entry in index.values():
        entry["candidates"] = sorted(entry["candidates"])
        entry["contribution_candidates"] = sorted(entry["contribution_candidates"])
        entry["expenditure_candidates"] = sorted(entry["expenditure_candidates"])
    return index


def build_lobby_client_index(
    rows: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    by_client: dict[str, dict[str, Any]] = {}
    for row in rows:
        key = row.get("client_key") or entity_match_key(row.get("client_name") or "")
        if not key:
            continue
        entry = by_client.setdefault(
            key,
            {
                "client_name": row.get("client_name") or "",
                "registration_count": 0,
                "lobbyists": set(),
                "latest_sworn": "",
                "report_ids": set(),
            },
        )
        entry["registration_count"] += 1
        if row.get("lobbyist_name"):
            entry["lobbyists"].add(row["lobbyist_name"])
        rid = row.get("report_id")
        if rid:
            entry["report_ids"].add(rid)
        sworn = row.get("sworn_date") or ""
        if sworn > (entry.get("latest_sworn") or ""):
            entry["latest_sworn"] = sworn
    for entry in by_client.values():
        entry["lobbyists"] = sorted(entry["lobbyists"])
        entry["report_ids"] = sorted(entry["report_ids"])
    return by_client


def build_influence_overlap(
    lobby_rows: list[dict[str, Any]],
    finance_rows: list[dict[str, Any]],
    *,
    limit: int = 25,
) -> list[dict[str, Any]]:
    """Entities that both lobby City Hall and appear in campaign finance."""
    lobby_index = build_lobby_client_index(lobby_rows)
    finance_index = build_finance_entity_index(finance_rows)
    overlaps: list[dict[str, Any]] = []
    for key, lobby in lobby_index.items():
        fin = finance_index.get(key)
        if not fin:
            continue
        contributed = round(float(fin["contributed"]), 2)
        received = round(float(fin["received"]), 2)
        if contributed > 0 and received > 0:
            campaign_role = "both"
        elif contributed > 0:
            campaign_role = "contributor"
        else:
            campaign_role = "recipient"
        overlaps.append(
            {
                "entity": lobby["client_name"] or fin["display_name"],
                "match_key": key,
                "lobby_registrations": len(lobby.get("report_ids") or []),
                "lobbyists": lobby.get("lobbyists") or [],
                "latest_lobby_sworn": lobby.get("latest_sworn") or "",
                "campaign_contributed": contributed,
                "campaign_received": received,
                "campaign_role": campaign_role,
                "campaign_transactions": fin["transaction_count"],
                "candidates": fin["candidates"],
                "contribution_candidates": fin.get("contribution_candidates") or [],
                "expenditure_candidates": fin.get("expenditure_candidates") or [],
                "influence_score": contributed + received + len(lobby.get("report_ids") or []) * 500,
            }
        )
    overlaps.sort(
        key=lambda x: (
            1 if (x.get("campaign_contributed") or 0) > 0 else 0,
            x.get("campaign_contributed") or 0,
            x.get("campaign_received") or 0,
            x.get("influence_score") or 0,
        ),
        reverse=True,
    )
    return overlaps[:limit]


def member_lobby_overlap(
    lobby_rows: list[dict[str, Any]],
    finance_rows: list[dict[str, Any]],
    candidate_name: str,
    *,
    limit: int = 12,
) -> list[dict[str, Any]]:
    """Donors/payees tied to one councilmember's campaign that also lobby the city."""
    from .campaign_finance import apply_filters, row_counterparty

    cand_rows = apply_filters(finance_rows, candidate=candidate_name)
    lobby_index = build_lobby_client_index(lobby_rows)
    hits: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in cand_rows:
        cp = row_counterparty(row)
        if not cp:
            continue
        key = entity_match_key(cp)
        if not key or key in seen:
            continue
        lobby = lobby_index.get(key)
        if not lobby:
            continue
        seen.add(key)
        amt = float(row.get("amount_num") or 0)
        hits.append(
            {
                "entity": cp,
                "lobby_registrations": len(lobby.get("report_ids") or []),
                "lobbyists": lobby.get("lobbyists") or [],
                "latest_lobby_sworn": lobby.get("latest_sworn") or "",
                "campaign_amount": round(amt, 2),
                "campaign_kind": row.get("kind"),
                "campaign_role": "contributor"
                if row.get("kind") == "contribution"
                else "recipient"
                if row.get("kind") == "expenditure"
                else "other",
                "campaign_date": (row.get("transaction_date") or "")[:10],
            }
        )
    hits.sort(
        key=lambda x: (
            1 if x.get("campaign_role") == "contributor" else 0,
            x.get("campaign_amount") or 0,
        ),
        reverse=True,
    )
    return hits[:limit]


def build_summary(
    rows: list[dict[str, Any]],
    finance_rows: Optional[list[dict[str, Any]]] = None,
) -> dict[str, Any]:
    lobbyists = {r["lobbyist_name"] for r in rows if r.get("lobbyist_name")}
    clients = {r["client_name"] for r in rows if r.get("client_name")}
    by_year: dict[str, int] = defaultdict(int)
    for r in rows:
        y = r.get("sworn_year") or "Unknown"
        by_year[y] += 1

    client_counts: dict[str, int] = defaultdict(int)
    for r in rows:
        c = r.get("client_name") or "Unknown"
        client_counts[c] += 1
    top_clients = [
        {"client": name, "registrations": count}
        for name, count in sorted(client_counts.items(), key=lambda x: -x[1])[:12]
    ]

    recent = sorted(rows, key=lambda r: r.get("sworn_date") or "", reverse=True)[:15]

    overlap: list[dict[str, Any]] = []
    if finance_rows:
        overlap = build_influence_overlap(rows, finance_rows, limit=20)

    contributor_overlaps = [
        o for o in overlap if (o.get("campaign_contributed") or 0) > 0
    ]
    vendor_only_overlaps = [
        o
        for o in overlap
        if (o.get("campaign_contributed") or 0) <= 0
        and (o.get("campaign_received") or 0) > 0
    ]

    now = datetime.now(tz=UTC)
    recent_30d = 0
    for r in rows:
        sworn = r.get("sworn_date") or ""
        try:
            dt = datetime.fromisoformat(sworn.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=UTC)
            if (now - dt).days <= 30:
                recent_30d += 1
        except Exception:
            continue

    return {
        "registration_count": len(rows),
        "lobbyist_firm_count": len(lobbyists),
        "client_count": len(clients),
        "registrations_last_30d": recent_30d,
        "by_year": [
            {"year": y, "count": c}
            for y, c in sorted(by_year.items(), reverse=True)
            if y != "Unknown"
        ],
        "top_clients": top_clients,
        "recent_registrations": recent,
        "influence_overlap": overlap,
        "overlap_count": len(overlap),
        "overlap_contributor_count": len(contributor_overlaps),
        "overlap_vendor_count": len(vendor_only_overlaps),
    }


def get_summary_payload(
    project_root: Path,
    *,
    force_refresh: bool = False,
    member_id: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    lightweight: bool = False,
) -> dict[str, Any]:
    from .campaign_finance import get_cached_rows as get_finance_cached
    from .council_accountability import finance_candidate_for_member_id, get_directory_payload

    cached = get_cached_rows(project_root, force_refresh=force_refresh)
    rows: list[dict[str, Any]] = cached.get("rows") or []

    fin_cached = get_finance_cached(project_root)
    finance_rows: Optional[list[dict[str, Any]]] = None
    if fin_cached:
        finance_rows = fin_cached.get("rows") or []

    summary = build_summary(rows, finance_rows)
    if lightweight:
        summary["influence_overlap"] = []
        summary["overlap_count"] = None
        summary["recent_registrations"] = []
        # Keep overlap_contributor_count / overlap_vendor_count for overview KPIs.

    member_overlap: list[dict[str, Any]] = []
    member_label: Optional[str] = None
    member_rows: list[dict[str, Any]] = []
    if member_id and finance_rows:
        directory = get_directory_payload(project_root).get("members") or []
        fc = finance_candidate_for_member_id(member_id, directory)
        if fc:
            member_label = fc
            member_overlap = member_lobby_overlap(rows, finance_rows, fc)
            member_rows = filter_registrations_for_member(rows, member_overlap)
            summary = member_scoped_summary(
                summary,
                member_overlap=member_overlap,
                member_rows=member_rows,
            )
            if lightweight:
                summary["influence_overlap"] = []
                summary["overlap_count"] = None
                summary["recent_registrations"] = []

    reg_source = member_rows if member_id and member_label else rows
    page, total = search_registrations(reg_source, q, limit=limit, offset=offset)

    finance_fetched_at = (fin_cached or {}).get("fetched_at") if fin_cached else None

    return {
        "meta": {
            "fetched_at": cached.get("fetched_at"),
            "row_count": cached.get("row_count"),
            "portal_url": SOURCE_PORTAL_URL,
            "finance_fetched_at": finance_fetched_at,
            **(cached.get("meta") or {}),
        },
        "summary": summary,
        "registrations": page,
        "registrations_total": total,
        "member_overlap": member_overlap,
        "member_finance_name": member_label,
    }

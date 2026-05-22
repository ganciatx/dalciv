"""
Dallas City Council voting record (Socrata ts5d-gdq6): fetch, cache, aggregate.
"""
from __future__ import annotations

import json
import os
import re
import time
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal, Optional
from urllib.parse import urlencode

import requests

VoteCategory = Literal["cast_yes", "cast_no", "abstain", "absent", "other"]

# API/UI ``vote`` filter tokens → ``vote_category`` or exact ``vote`` code.
VOTE_FILTER_OPTIONS: list[dict[str, str]] = [
    {"value": "", "label": "All votes"},
    {"value": "yes", "label": "Yes"},
    {"value": "no", "label": "No"},
    {"value": "abstain", "label": "Abstain"},
    {"value": "absent", "label": "Absent (any)"},
    {"value": "ABSNT", "label": "Absent — personal"},
    {"value": "ABSNT_CB", "label": "Absent — city business"},
    {"value": "AWVT", "label": "Absent when vote taken"},
    {"value": "N/A", "label": "N/A"},
    {"value": "other", "label": "Other"},
]

_VOTE_FILTER_TO_CATEGORY: dict[str, VoteCategory] = {
    "yes": "cast_yes",
    "no": "cast_no",
    "abstain": "abstain",
    "abstained": "abstain",
    "absent": "absent",
    "other": "other",
}

SOCRATA_DATASET_ID = "ts5d-gdq6"
SOCRATA_RESOURCE_URL = (
    f"https://www.dallasopendata.com/resource/{SOCRATA_DATASET_ID}.json"
)
SOCRATA_VIEW_META_URL = (
    f"https://www.dallasopendata.com/api/views/{SOCRATA_DATASET_ID}.json"
)
SOURCE_PORTAL_URL = (
    "https://www.dallasopendata.com/Services/"
    "Dallas-City-Council-Voting-Record/ts5d-gdq6/data_preview"
)

CACHE_TTL_SEC = 86400  # 24h — updates after council meetings
PAGE_SIZE = 50000  # Socrata max per request

# Known variants between finance ``candidate_name`` and voting ``voter_name``.
MEMBER_ALIASES: dict[str, str] = {
    "gay willis": "Gay Donnell Willis",
    "gay donnel willis": "Gay Donnell Willis",
    "jennifer gates": "Jennifer S. Gates",
    "jennifer s gates": "Jennifer S. Gates",
    "carolyn arnold": "Carolyn King Arnold",
    "carolyn king arnold": "Carolyn King Arnold",
    "casey thomas ii": "Casey Thomas, II",
    "casey thomas, ii": "Casey Thomas, II",
    "casey  thomas, ii": "Casey Thomas, II",
    "b adam mcgough": "B. Adam McGough",
    "b adam  mcgough": "B. Adam McGough",
    "adam mcgough": "B. Adam McGough",
    "jaynie shultz": "Jaynie Schultz",
    "eric johnson": "Eric Johnson",
    # Socrata / filings typo vs council roster (headshot: Jesse Moreno, D2).
    "jesus moreno": "Jesse Moreno",
}


def utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def cache_path(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / "council_voting_cache.json"


def summary_sidecar_path(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / "council_voting_summary_cache.json"


def _socrata_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/json",
        "User-Agent": "SivicScraper/1.0 (local dashboard; council voting)",
    }
    token = os.environ.get("SOCRATA_APP_TOKEN", "").strip()
    if token:
        headers["X-App-Token"] = token
    return headers


def normalize_whitespace(name: str) -> str:
    return re.sub(r"\s+", " ", (name or "").strip())


def name_lookup_key(name: str) -> str:
    return normalize_whitespace(name).lower()


def canonical_display_name(name: str) -> str:
    """Single display label for a member (aliases → preferred form)."""
    raw = normalize_whitespace(name)
    if not raw:
        return ""
    key = name_lookup_key(raw)
    return MEMBER_ALIASES.get(key, raw)


def member_id_from_name(name: str) -> str:
    """URL-safe id shared across finance + voting."""
    canon = canonical_display_name(name)
    slug = re.sub(r"[^a-z0-9]+", "-", name_lookup_key(canon)).strip("-")
    return slug or "unknown"


def classify_vote(raw: str) -> tuple[str, VoteCategory]:
    v = (raw or "").strip().upper()
    if v == "YES":
        return v, "cast_yes"
    if v == "NO":
        return v, "cast_no"
    if v in ("ABST",):
        return v, "abstain"
    if v in ("ABSNT", "ABSNT_CB", "AWVT"):
        return v, "absent"
    return v or "—", "other"


def normalize_vote_row(raw: dict[str, Any]) -> dict[str, Any]:
    voter = normalize_whitespace(str(raw.get("voter_name") or ""))
    vote_raw, vote_cat = classify_vote(str(raw.get("vote") or ""))
    canon = canonical_display_name(voter)
    return {
        "vote_id": str(raw.get("vote_id") or raw.get(":id") or "").strip(),
        "date": str(raw.get("date") or "").strip(),
        "member_name": voter,
        "member_canonical": canon,
        "member_id": member_id_from_name(voter),
        "district": str(raw.get("district") or "").strip(),
        "title": str(raw.get("title") or "").strip(),
        "vote": vote_raw,
        "vote_category": vote_cat,
        "agenda_id": str(raw.get("agenda_id") or "").strip(),
        "agenda_item_number": str(raw.get("agenda_item_number") or "").strip(),
        "item_type": str(raw.get("item_type") or "").strip(),
        "final_action_taken": str(raw.get("final_action_taken") or "").strip(),
        "description": str(raw.get("agenda_item_description") or "").strip(),
    }


def fetch_voting_page(*, limit: int, offset: int) -> list[dict[str, Any]]:
    params = {
        "$limit": max(1, min(limit, PAGE_SIZE)),
        "$offset": max(0, offset),
        "$order": "date DESC",
    }
    url = f"{SOCRATA_RESOURCE_URL}?{urlencode(params)}"
    resp = requests.get(url, headers=_socrata_headers(), timeout=180)
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
    data = resp.json()
    return data if isinstance(data, list) else []


def fetch_voting_records() -> list[dict[str, Any]]:
    """Paginate until Socrata returns fewer than ``PAGE_SIZE`` rows."""
    all_rows: list[dict[str, Any]] = []
    offset = 0
    while True:
        page = fetch_voting_page(limit=PAGE_SIZE, offset=offset)
        if not page:
            break
        all_rows.extend(page)
        if len(page) < PAGE_SIZE:
            break
        offset += len(page)
        time.sleep(0.25)  # polite pause between pages
    return all_rows


def fetch_dataset_meta() -> dict[str, Any]:
    try:
        resp = requests.get(SOCRATA_VIEW_META_URL, headers=_socrata_headers(), timeout=20)
        try:
            from .command_center import PAGE_COUNCIL, record_upstream_call

            record_upstream_call(
                page=PAGE_COUNCIL,
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


def load_cache(project_root: Path) -> Optional[dict[str, Any]]:
    path = cache_path(project_root)
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def save_cache(project_root: Path, payload: dict[str, Any]) -> None:
    path = cache_path(project_root)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


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
    raw_rows = fetch_voting_records()
    rows = [normalize_vote_row(r) for r in raw_rows if r.get("vote_id") or r.get("member_name")]
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
        doc = refresh_cache(project_root)
        refresh_voting_summary_sidecar(project_root)
        return doc

    cached = load_cache(project_root)
    if cached and cached.get("rows") is not None:
        stale = cache_is_stale(cached)
        from .data_sync import JOB_VOTING, attach_cache_meta, maybe_schedule_stale

        maybe_schedule_stale(project_root, JOB_VOTING, cached, cache_is_stale)
        return attach_cache_meta(cached, job_id=JOB_VOTING, stale=stale)

    from .data_sync import JOB_VOTING, schedule_refresh, warming_rows_document

    schedule_refresh(project_root, JOB_VOTING, force=True)
    return warming_rows_document("council_voting")


def load_summary_sidecar(project_root: Path) -> Optional[dict[str, Any]]:
    path = summary_sidecar_path(project_root)
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def save_summary_sidecar(project_root: Path, payload: dict[str, Any]) -> None:
    path = summary_sidecar_path(project_root)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def summary_sidecar_matches_cache(
    sidecar: dict[str, Any], cached: dict[str, Any]
) -> bool:
    return str(sidecar.get("source_fetched_at") or "") == str(
        cached.get("fetched_at") or ""
    )


def refresh_voting_summary_sidecar(project_root: Path) -> None:
    """Persist lightweight overview KPIs so Overview avoids scanning all rows."""
    cached = load_cache(project_root)
    rows: list[dict[str, Any]] = (cached or {}).get("rows") or []
    if not rows:
        return
    dr = default_date_range(rows)
    f = dr.get("from")
    t = dr.get("to")
    payload = {
        "source_fetched_at": cached.get("fetched_at"),
        "built_at": utc_now_iso(),
        "meta": {
            "fetched_at": cached.get("fetched_at"),
            "row_count": len(rows),
            "cache_ttl_sec": CACHE_TTL_SEC,
            "from_cache": True,
            "lightweight": True,
            "from_summary_sidecar": True,
            **((cached or {}).get("meta") or {}),
        },
        "date_range_defaults": dr,
        "filters": {"from": f or "", "to": t or ""},
        "vote_filter_options": VOTE_FILTER_OPTIONS,
        "global_kpis": global_voting_kpis(
            filter_vote_rows(rows, from_date=f, to_date=t)
        ),
    }
    save_summary_sidecar(project_root, payload)


def _parse_date(iso: str) -> Optional[datetime]:
    if not iso:
        return None
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return None


def _in_date_range(row_date: str, from_date: Optional[str], to_date: Optional[str]) -> bool:
    if not from_date and not to_date:
        return True
    d = _parse_date(row_date)
    if not d:
        return True
    day = d.date().isoformat()
    if from_date and day < from_date[:10]:
        return False
    if to_date and day > to_date[:10]:
        return False
    return True


def row_matches_vote_filter(row: dict[str, Any], vote_filter: Optional[str]) -> bool:
    """Match API ``vote`` param: category alias (yes/no/absent) or raw code (ABSNT_CB)."""
    if not vote_filter or vote_filter.strip().lower() in ("", "all"):
        return True
    token = vote_filter.strip()
    key = token.lower()
    cat = row.get("vote_category")
    if key in _VOTE_FILTER_TO_CATEGORY:
        return cat == _VOTE_FILTER_TO_CATEGORY[key]
    # Exact Dallas Open Data code (YES, ABSNT, …)
    raw = str(row.get("vote") or "").strip().upper()
    return raw == token.upper()


def filter_vote_rows(
    rows: list[dict[str, Any]],
    *,
    member_id: Optional[str] = None,
    member_canonical: Optional[str] = None,
    q: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    vote: Optional[str] = None,
) -> list[dict[str, Any]]:
    out = rows
    if member_id:
        mid = member_id.strip().lower()
        out = [r for r in out if r.get("member_id", "").lower() == mid]
    elif member_canonical:
        canon = canonical_display_name(member_canonical)
        out = [r for r in out if r.get("member_canonical") == canon]
    if from_date or to_date:
        out = [r for r in out if _in_date_range(r.get("date", ""), from_date, to_date)]
    if q:
        needle = q.strip().lower()
        if needle:

            def matches(row: dict[str, Any]) -> bool:
                hay = " ".join(
                    str(row.get(k) or "")
                    for k in (
                        "member_name",
                        "member_canonical",
                        "description",
                        "vote",
                        "agenda_id",
                        "final_action_taken",
                        "district",
                    )
                ).lower()
                return needle in hay

            out = [r for r in out if matches(r)]
    if vote:
        out = [r for r in out if row_matches_vote_filter(r, vote)]
    return out


def build_member_voting_stats(
    rows: list[dict[str, Any]],
    *,
    member_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> dict[str, Any]:
    scoped = filter_vote_rows(
        rows, member_id=member_id, from_date=from_date, to_date=to_date
    )
    if member_id and not scoped:
        return {"found": False, "member_id": member_id}

    yes_n = no_n = abstain_n = absent_n = other_n = 0
    by_year: dict[str, dict[str, int]] = defaultdict(
        lambda: {"yes": 0, "no": 0, "cast": 0, "total": 0}
    )
    districts: set[str] = set()
    display_name = ""
    mid = member_id or ""

    for row in scoped:
        if not display_name:
            display_name = row.get("member_canonical") or row.get("member_name") or ""
            mid = row.get("member_id") or mid
        if row.get("district"):
            districts.add(str(row["district"]))

        cat = row.get("vote_category")
        if cat == "cast_yes":
            yes_n += 1
        elif cat == "cast_no":
            no_n += 1
        elif cat == "abstain":
            abstain_n += 1
        elif cat == "absent":
            absent_n += 1
        else:
            other_n += 1

        yr = (row.get("date") or "")[:4]
        if yr.isdigit():
            by_year[yr]["total"] += 1
            if cat in ("cast_yes", "cast_no"):
                by_year[yr]["cast"] += 1
            if cat == "cast_yes":
                by_year[yr]["yes"] += 1
            elif cat == "cast_no":
                by_year[yr]["no"] += 1

    total = len(scoped)
    cast = yes_n + no_n
    participation = (cast / total) if total else None
    yes_rate = (yes_n / cast) if cast else None

    year_series = []
    for yr in sorted(by_year.keys()):
        y = by_year[yr]
        c = y["yes"] + y["no"]
        year_series.append(
            {
                "year": yr,
                "yes": y["yes"],
                "no": y["no"],
                "cast": c,
                "total": y["total"],
                "yes_rate": round(y["yes"] / c, 3) if c else None,
            }
        )

    return {
        "found": bool(scoped) if member_id else True,
        "member_id": mid,
        "display_name": display_name,
        "districts": sorted(districts, key=lambda x: (len(x), x)),
        "totals": {
            "records": total,
            "yes": yes_n,
            "no": no_n,
            "abstain": abstain_n,
            "absent": absent_n,
            "other": other_n,
            "cast_votes": cast,
            "participation_rate": round(participation, 3) if participation is not None else None,
            "yes_rate": round(yes_rate, 3) if yes_rate is not None else None,
        },
        "by_year": year_series,
        "date_range": {"from": from_date or "", "to": to_date or ""},
    }


def recent_votes(
    rows: list[dict[str, Any]],
    *,
    member_id: str,
    limit: int = 15,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> list[dict[str, Any]]:
    scoped = filter_vote_rows(
        rows, member_id=member_id, from_date=from_date, to_date=to_date
    )
    scoped.sort(key=lambda r: r.get("date") or "", reverse=True)
    return scoped[: max(1, min(limit, 100))]


def member_index(
    rows: list[dict[str, Any]],
    *,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    limit: int = 80,
) -> list[dict[str, Any]]:
    """Compact stats per member for browse cards / picker."""
    scoped = filter_vote_rows(rows, from_date=from_date, to_date=to_date)
    buckets: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in scoped:
        mid = row.get("member_id")
        if mid:
            buckets[mid].append(row)

    index: list[dict[str, Any]] = []
    for mid, member_rows in buckets.items():
        stats = build_member_voting_stats(member_rows, member_id=mid)
        t = stats.get("totals") or {}
        index.append(
            {
                "member_id": mid,
                "display_name": stats.get("display_name") or mid,
                "districts": stats.get("districts") or [],
                "yes_rate": t.get("yes_rate"),
                "participation_rate": t.get("participation_rate"),
                "records": t.get("records", 0),
            }
        )

    index.sort(key=lambda x: x.get("records", 0), reverse=True)
    return index[:limit]


def global_voting_kpis(rows: list[dict[str, Any]]) -> dict[str, Any]:
    members = {r.get("member_id") for r in rows if r.get("member_id")}
    yes_n = sum(1 for r in rows if r.get("vote_category") == "cast_yes")
    no_n = sum(1 for r in rows if r.get("vote_category") == "cast_no")
    cast = yes_n + no_n
    return {
        "total_records": len(rows),
        "unique_members": len(members),
        "yes_votes": yes_n,
        "no_votes": no_n,
        "yes_rate": round(yes_n / cast, 3) if cast else None,
    }


def default_date_range(rows: list[dict[str, Any]]) -> dict[str, str]:
    """Suggest last ~2 years for voting filters."""
    dates = sorted(r.get("date") or "" for r in rows if r.get("date"))
    if not dates:
        return {"from": "", "to": ""}
    latest = dates[-1][:10]
    try:
        end = datetime.fromisoformat(latest)
        start = end.replace(year=end.year - 2)
        return {"from": start.date().isoformat(), "to": latest}
    except ValueError:
        return {"from": dates[0][:10], "to": latest}


def get_summary_payload(
    project_root: Path,
    *,
    force_refresh: bool = False,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    lightweight: bool = False,
) -> dict[str, Any]:
    if (
        lightweight
        and not force_refresh
        and not from_date
        and not to_date
    ):
        sidecar = load_summary_sidecar(project_root)
        cached_disk = load_cache(project_root)
        if (
            sidecar
            and cached_disk
            and cached_disk.get("rows")
            and summary_sidecar_matches_cache(sidecar, cached_disk)
        ):
            out = dict(sidecar)
            out.pop("source_fetched_at", None)
            out.pop("built_at", None)
            meta = out.setdefault("meta", {})
            if isinstance(meta, dict):
                meta["cache_stale"] = cache_is_stale(cached_disk)
            return out

    cached = get_cached_rows(project_root, force_refresh=force_refresh)
    all_rows: list[dict[str, Any]] = cached.get("rows") or []
    if (cached.get("meta") or {}).get("cache_warming") and not all_rows:
        return {
            "meta": {
                "cache_warming": True,
                "lightweight": lightweight,
                "row_count": 0,
            },
            "date_range_defaults": {"from": "", "to": ""},
            "filters": {"from": "", "to": ""},
            "vote_filter_options": VOTE_FILTER_OPTIONS,
            "global_kpis": global_voting_kpis([]),
            **({} if lightweight else {"members": []}),
        }
    dr = default_date_range(all_rows)
    f = from_date or dr.get("from")
    t = to_date or dr.get("to")

    payload: dict[str, Any] = {
        "meta": {
            "fetched_at": cached.get("fetched_at"),
            "row_count": len(all_rows),
            "cache_ttl_sec": CACHE_TTL_SEC,
            "from_cache": not force_refresh,
            "lightweight": lightweight,
            **(cached.get("meta") or {}),
        },
        "date_range_defaults": dr,
        "filters": {"from": f or "", "to": t or ""},
        "vote_filter_options": VOTE_FILTER_OPTIONS,
        "global_kpis": global_voting_kpis(
            filter_vote_rows(all_rows, from_date=f, to_date=t)
        ),
    }
    if not lightweight:
        payload["members"] = member_index(all_rows, from_date=f, to_date=t)
    return payload


def get_votes_payload(
    project_root: Path,
    *,
    force_refresh: bool = False,
    member_id: Optional[str] = None,
    q: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    vote: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    cached = get_cached_rows(project_root, force_refresh=force_refresh)
    all_rows: list[dict[str, Any]] = cached.get("rows") or []
    filtered = filter_vote_rows(
        all_rows,
        member_id=member_id,
        q=q,
        from_date=from_date,
        to_date=to_date,
        vote=vote,
    )
    filtered.sort(key=lambda r: r.get("date") or "", reverse=True)
    cap = max(1, min(limit, 200))
    start = max(0, offset)
    page = filtered[start : start + cap]

    return {
        "meta": {
            "fetched_at": cached.get("fetched_at"),
            "total": len(filtered),
            "limit": cap,
            "offset": start,
            "vote": vote or "",
        },
        "vote_filter_options": VOTE_FILTER_OPTIONS,
        "votes": page,
    }


# In-memory roll-call index keyed by (project_root, cache fetched_at, version).
_ROLL_CALL_INDEX_VERSION = 2  # bump when roll_call_key logic changes
_ROLL_CALL_INDEX: dict[tuple[str, ...], list[dict[str, Any]]] = {}


def roll_call_key(row: dict[str, Any]) -> str:
    """
    Stable id for one agenda item / roll call (all councilmember rows share this).

    Dallas Open Data ``vote_id`` is unique **per member vote**, not per roll call —
    grouping on ``vote_id`` duplicates the same agenda item once per councilmember.
    """
    aid = str(row.get("agenda_id") or "").strip()
    num = str(row.get("agenda_item_number") or "").strip()
    date = str(row.get("date") or "")[:10]
    if aid or num:
        return f"ag:{aid}|{num}|{date}"
    desc = normalize_whitespace(str(row.get("description") or ""))[:240]
    return f"desc:{date}|{desc}"


def _dedupe_member_votes(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """One row per councilmember within a roll call (defensive)."""
    by_member: dict[str, dict[str, Any]] = {}
    for r in rows:
        mid = str(r.get("member_id") or r.get("member_name") or "").strip().lower()
        if not mid:
            mid = f"_{len(by_member)}"
        if mid not in by_member:
            by_member[mid] = r
    return list(by_member.values())


def tally_vote_categories(rows: list[dict[str, Any]]) -> dict[str, int]:
    tallies = {"yes": 0, "no": 0, "abstain": 0, "absent": 0, "other": 0}
    for r in rows:
        cat = r.get("vote_category") or "other"
        if cat == "cast_yes":
            tallies["yes"] += 1
        elif cat == "cast_no":
            tallies["no"] += 1
        elif cat == "abstain":
            tallies["abstain"] += 1
        elif cat == "absent":
            tallies["absent"] += 1
        else:
            tallies["other"] += 1
    tallies["total"] = len(rows)
    return tallies


def build_roll_call_index(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """One summary dict per agenda item / roll call."""
    groups: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        key = roll_call_key(row)
        groups.setdefault(key, []).append(row)

    index: list[dict[str, Any]] = []
    for rc_id, raw_rows in groups.items():
        member_rows = _dedupe_member_votes(raw_rows)
        member_rows.sort(key=lambda r: (r.get("district") or "", r.get("member_name") or ""))
        first = member_rows[0]
        tallies = tally_vote_categories(member_rows)
        desc = max(
            (str(r.get("description") or "").strip() for r in member_rows),
            key=len,
            default="",
        )
        index.append(
            {
                "roll_call_id": rc_id,
                "vote_id": str(first.get("vote_id") or "").strip() or None,
                "agenda_id": str(first.get("agenda_id") or "").strip(),
                "agenda_item_number": str(first.get("agenda_item_number") or "").strip(),
                "date": str(first.get("date") or "").strip(),
                "item_type": str(first.get("item_type") or "").strip(),
                "description": desc,
                "description_snippet": (desc[:160] + "…") if len(desc) > 160 else desc,
                "final_action_taken": str(first.get("final_action_taken") or "").strip(),
                "tallies": tallies,
                "outcome_label": _outcome_label(first, tallies),
            }
        )

    index.sort(key=lambda x: x.get("date") or "", reverse=True)
    return index


def _outcome_label(first: dict[str, Any], tallies: dict[str, int]) -> str:
    fa = str(first.get("final_action_taken") or "").strip()
    if fa:
        return fa
    yes_n, no_n = tallies.get("yes", 0), tallies.get("no", 0)
    if yes_n > no_n:
        return "Passed (vote tally)"
    if no_n > yes_n:
        return "Failed (vote tally)"
    if yes_n or no_n:
        return "Tied or mixed"
    return "—"


def _roll_call_index_for_cache(
    project_root: Path, cached: dict[str, Any]
) -> list[dict[str, Any]]:
    cache_key = (
        str(project_root.resolve()),
        str(cached.get("fetched_at") or ""),
        str(_ROLL_CALL_INDEX_VERSION),
    )
    if cache_key in _ROLL_CALL_INDEX:
        return _ROLL_CALL_INDEX[cache_key]
    built = build_roll_call_index(cached.get("rows") or [])
    if len(_ROLL_CALL_INDEX) > 4:
        _ROLL_CALL_INDEX.pop(next(iter(_ROLL_CALL_INDEX)))
    _ROLL_CALL_INDEX[cache_key] = built
    return built


def filter_roll_call_index(
    index: list[dict[str, Any]],
    *,
    q: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> list[dict[str, Any]]:
    out = index
    if from_date or to_date:
        out = [
            item
            for item in out
            if _in_date_range(str(item.get("date") or ""), from_date, to_date)
        ]
    if q:
        needle = q.strip().lower()
        if needle:

            def matches(item: dict[str, Any]) -> bool:
                hay = " ".join(
                    str(item.get(k) or "")
                    for k in (
                        "description",
                        "agenda_id",
                        "agenda_item_number",
                        "final_action_taken",
                        "outcome_label",
                        "vote_id",
                    )
                ).lower()
                return needle in hay

            out = [item for item in out if matches(item)]
    return out


def get_agenda_items_payload(
    project_root: Path,
    *,
    force_refresh: bool = False,
    q: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    """Paginated agenda-item / roll-call index for the Voting tab."""
    cached = get_cached_rows(project_root, force_refresh=force_refresh)
    index = _roll_call_index_for_cache(project_root, cached)
    filtered = filter_roll_call_index(
        index, q=q, from_date=from_date, to_date=to_date
    )
    cap = max(1, min(limit, 100))
    start = max(0, offset)
    page = filtered[start : start + cap]

    return {
        "meta": {
            "fetched_at": cached.get("fetched_at"),
            "total": len(filtered),
            "limit": cap,
            "offset": start,
            "roll_call_count": len(index),
        },
        "items": page,
    }


def get_agenda_item_payload(
    project_root: Path,
    roll_call_id: str,
    *,
    force_refresh: bool = False,
) -> dict[str, Any]:
    """Single roll call with per-member votes."""
    cached = get_cached_rows(project_root, force_refresh=force_refresh)
    rows = cached.get("rows") or []
    rc_id = roll_call_id.strip()
    member_rows = _dedupe_member_votes(
        [r for r in rows if roll_call_key(r) == rc_id]
    )
    if not member_rows:
        return {"found": False, "roll_call_id": rc_id}

    member_rows.sort(key=lambda r: (r.get("district") or "", r.get("member_name") or ""))
    first = member_rows[0]
    tallies = tally_vote_categories(member_rows)
    desc = max(
        (str(r.get("description") or "").strip() for r in member_rows),
        key=len,
        default="",
    )

    return {
        "found": True,
        "roll_call_id": rc_id,
        "vote_id": None,  # per-member in source data; use roll_call_id for grouping
        "agenda_id": str(first.get("agenda_id") or "").strip(),
        "agenda_item_number": str(first.get("agenda_item_number") or "").strip(),
        "date": str(first.get("date") or "").strip(),
        "item_type": str(first.get("item_type") or "").strip(),
        "description": desc,
        "final_action_taken": str(first.get("final_action_taken") or "").strip(),
        "tallies": tallies,
        "outcome_label": _outcome_label(first, tallies),
        "members": [
            {
                "member_id": r.get("member_id"),
                "member_name": r.get("member_name"),
                "member_canonical": r.get("member_canonical"),
                "district": r.get("district"),
                "title": r.get("title"),
                "vote": r.get("vote"),
                "vote_category": r.get("vote_category"),
            }
            for r in member_rows
        ],
        "meta": {"fetched_at": cached.get("fetched_at")},
    }

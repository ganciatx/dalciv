"""
Council Accountability: bridge campaign finance candidates ↔ voting members.
"""
from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Optional

from . import council_voting
from .campaign_finance import (
    apply_filters,
    build_candidate_index,
    build_candidate_overview,
    get_cached_rows as get_finance_cache,
)
from .council_headshots import enrich_directory, enrich_member_portrait, active_members_by_district
from .council_voting import (
    build_member_voting_stats,
    canonical_display_name,
    member_id_from_name,
    name_lookup_key,
    recent_votes,
)


def resolve_member_id(member_id: str) -> Optional[dict[str, Any]]:
    """Map slug id → display name and finance candidate string."""
    if not member_id:
        return None
    # Reverse lookup: any alias key that slugifies to this id
    mid = member_id.strip().lower()
    for alias_key, display in council_voting.MEMBER_ALIASES.items():
        if member_id_from_name(display).lower() == mid:
            return {
                "member_id": mid,
                "display_name": display,
                "finance_candidate_name": display,
            }
    # Try treating id as slug of a display name built from words
    for display in _known_display_names():
        if member_id_from_name(display).lower() == mid:
            return {
                "member_id": mid,
                "display_name": display,
                "finance_candidate_name": _finance_name_for_display(display),
            }
    return {"member_id": mid, "display_name": member_id, "finance_candidate_name": None}


def _known_display_names() -> set[str]:
    names: set[str] = set(council_voting.MEMBER_ALIASES.values())
    names.update(council_voting.MEMBER_ALIASES.keys())
    return names


def _finance_name_for_display(display: str) -> str:
    """Best campaign-finance ``candidate_name`` for a canonical councilmember."""
    # Finance sometimes uses shorter names (e.g. Gay Willis).
    rev: dict[str, str] = {}
    for alias_key, canon in council_voting.MEMBER_ALIASES.items():
        rev[name_lookup_key(canon)] = canon
    key = name_lookup_key(display)
    for alias_key, canon in council_voting.MEMBER_ALIASES.items():
        if name_lookup_key(canon) == key:
            # Prefer shorter finance-style label when alias exists
            short = normalize_alias_to_title(alias_key)
            if short:
                return short
    return display


def normalize_alias_to_title(alias_key: str) -> str:
    return " ".join(w.capitalize() for w in alias_key.split())


def _finance_candidates(rows: list[dict[str, Any]]) -> dict[str, str]:
    """Map member_id → exact ``candidate_name`` from finance rows."""
    out: dict[str, str] = {}
    for row in rows:
        cand = row.get("candidate_name")
        if not cand:
            continue
        mid = member_id_from_name(cand)
        if mid not in out:
            out[mid] = cand
        # Prefer longer / more complete name if duplicate ids collide
        elif len(cand) > len(out[mid]):
            out[mid] = cand
    return out


def _voting_members(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Map member_id → voting metadata."""
    out: dict[str, dict[str, Any]] = {}
    for row in rows:
        mid = row.get("member_id")
        if not mid:
            continue
        if mid not in out:
            out[mid] = {
                "member_id": mid,
                "display_name": row.get("member_canonical") or row.get("member_name"),
                "voting_names": set(),
                "districts": set(),
            }
        out[mid]["voting_names"].add(row.get("member_name") or "")
        if row.get("district"):
            out[mid]["districts"].add(str(row["district"]))
    for v in out.values():
        v["voting_names"] = sorted(n for n in v["voting_names"] if n)
        v["districts"] = sorted(v["districts"], key=lambda x: (len(x), x))
    return out


def build_member_directory(
    finance_rows: list[dict[str, Any]],
    voting_rows: Optional[list[dict[str, Any]]] = None,
    *,
    voting_members: Optional[dict[str, dict[str, Any]]] = None,
) -> list[dict[str, Any]]:
    finance_map = _finance_candidates(finance_rows)
    if voting_members is not None:
        voting_map = voting_members
    elif voting_rows is not None:
        voting_map = _voting_members(voting_rows)
    else:
        voting_map = {}
    all_ids = set(finance_map) | set(voting_map)

    directory: list[dict[str, Any]] = []
    for mid in all_ids:
        fin_name = finance_map.get(mid)
        vote_meta = voting_map.get(mid) or {}
        display = (
            vote_meta.get("display_name")
            or (canonical_display_name(fin_name) if fin_name else "")
            or mid
        )
        directory.append(
            {
                "id": mid,
                "display_name": str(display or mid or "Unknown"),
                "district": (vote_meta.get("districts") or [""])[0] if vote_meta else "",
                "districts": vote_meta.get("districts") or [],
                "has_finance": bool(fin_name),
                "has_voting": mid in voting_map,
                "finance_candidate_name": fin_name,
                "voting_names": vote_meta.get("voting_names") or [],
            }
        )

    # Order applied after portrait enrich (active by district, then former).
    directory.sort(key=lambda m: str(m.get("display_name") or "").lower())
    return directory


def get_directory_payload(
    project_root: Path,
    *,
    force_refresh_finance: bool = False,
    force_refresh_voting: bool = False,
) -> dict[str, Any]:
    fin = get_finance_cache(project_root, force_refresh=force_refresh_finance)
    finance_rows = fin.get("rows") or []

    voting_rows: list[dict[str, Any]] = []
    voting_fetched_at: Optional[str] = None
    voting_row_count = 0
    date_range_defaults: dict[str, str] = {"from": "", "to": ""}
    vote_index: dict[str, dict[str, Any]] = {}
    voting_members: Optional[dict[str, dict[str, Any]]] = None

    if force_refresh_voting:
        vote = council_voting.get_cached_rows(project_root, force_refresh=True)
        voting_rows = vote.get("rows") or []
        voting_fetched_at = vote.get("fetched_at")
        voting_row_count = len(voting_rows)
        date_range_defaults = council_voting.default_date_range(voting_rows)
        directory = build_member_directory(finance_rows, voting_rows)
        vote_index = {
            m["member_id"]: m for m in council_voting.member_index(voting_rows)
        }
    else:
        sidecar = council_voting.ensure_voting_directory_sidecar(project_root)
        if sidecar:
            voting_fetched_at = str(
                (sidecar.get("meta") or {}).get("fetched_at")
                or sidecar.get("source_fetched_at")
                or ""
            )
            voting_row_count = int((sidecar.get("meta") or {}).get("row_count") or 0)
            date_range_defaults = sidecar.get("date_range_defaults") or date_range_defaults
            directory_index = sidecar.get("directory_index") or {}
            voting_members = directory_index.get("voting_members") or {}
            vote_index = {
                m["member_id"]: m
                for m in (directory_index.get("member_summaries") or [])
            }
            directory = build_member_directory(
                finance_rows, voting_members=voting_members
            )
        else:
            vote = council_voting.get_cached_rows(project_root)
            voting_rows = vote.get("rows") or []
            voting_fetched_at = vote.get("fetched_at")
            voting_row_count = len(voting_rows)
            date_range_defaults = council_voting.default_date_range(voting_rows)
            directory = build_member_directory(finance_rows, voting_rows)
            vote_index = {
                m["member_id"]: m for m in council_voting.member_index(voting_rows)
            }

    fin_index = {c["candidate"]: c for c in build_candidate_index(finance_rows)}

    for entry in directory:
        fc = entry.get("finance_candidate_name")
        if fc and fc in fin_index:
            entry["finance_summary"] = fin_index[fc]
        else:
            entry["finance_summary"] = None
        entry["voting_summary"] = vote_index.get(entry["id"])

    directory = enrich_directory(directory, project_root=project_root)

    return {
        "meta": {
            "finance_fetched_at": fin.get("fetched_at"),
            "voting_fetched_at": voting_fetched_at,
            "finance_row_count": len(finance_rows),
            "voting_row_count": voting_row_count,
            "date_range_defaults": date_range_defaults,
        },
        "members": active_members_by_district(directory),
    }


def _listable_directory_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Ensure cached bootstrap payloads only expose active members in listings."""
    directory = payload.get("directory")
    if not isinstance(directory, dict):
        return payload
    members = directory.get("members")
    if not isinstance(members, list):
        return payload
    return {
        **payload,
        "directory": {
            **directory,
            "members": active_members_by_district(members),
        },
    }


def get_bootstrap_payload(
    project_root: Path,
    *,
    force_refresh_finance: bool = False,
    force_refresh_voting: bool = False,
) -> dict[str, Any]:
    """
    One round-trip for Overview: directory + lightweight finance/voting/lobby summaries.
  Uses a precomputed on-disk cache when source datasets are unchanged.
    """
    if force_refresh_finance or force_refresh_voting:
        payload = _build_bootstrap_payload(
            project_root,
            force_refresh_finance=force_refresh_finance,
            force_refresh_voting=force_refresh_voting,
        )
        _save_bootstrap_cache(project_root, payload)
        return _listable_directory_payload(payload)

    cached = _load_bootstrap_cache(project_root)
    if cached is not None:
        return _listable_directory_payload(cached)

    payload = _build_bootstrap_payload(project_root)
    _save_bootstrap_cache(project_root, payload)
    return _listable_directory_payload(payload)


def get_bootstrap_payload_cached(project_root: Path) -> dict[str, Any]:
    """Fast path for HTML shell embed — avoids rebuilding on every page view."""
    cached = _load_bootstrap_cache(project_root)
    if cached is not None:
        return _listable_directory_payload(cached)
    return get_bootstrap_payload(project_root)


def refresh_bootstrap_cache(project_root: Path) -> dict[str, Any]:
    """Rebuild bootstrap JSON after finance/voting/lobby caches update."""
    payload = _build_bootstrap_payload(project_root)
    _save_bootstrap_cache(project_root, payload)
    return _listable_directory_payload(payload)


def bootstrap_cache_path(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / "council_accountability_bootstrap_cache.json"


def _bootstrap_source_mtimes(project_root: Path) -> dict[str, float]:
    from .campaign_finance import cache_path as finance_cache_path
    from .council_voting import summary_sidecar_path
    from .lobbyist_registration import cache_path as lobby_cache_path

    out: dict[str, float] = {}
    for key, path in (
        ("finance", finance_cache_path(project_root)),
        ("voting_summary", summary_sidecar_path(project_root)),
        ("lobbyist", lobby_cache_path(project_root)),
    ):
        out[key] = path.stat().st_mtime if path.is_file() else 0.0
    return out


def _load_bootstrap_cache(project_root: Path) -> Optional[dict[str, Any]]:
    path = bootstrap_cache_path(project_root)
    if not path.is_file():
        return None
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None
    if not isinstance(doc, dict):
        return None
    if doc.get("source_mtimes") != _bootstrap_source_mtimes(project_root):
        return None
    payload = doc.get("payload")
    return payload if isinstance(payload, dict) else None


def _save_bootstrap_cache(project_root: Path, payload: dict[str, Any]) -> None:
    path = bootstrap_cache_path(project_root)
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = {
        "built_at": datetime.now(tz=UTC).isoformat(),
        "source_mtimes": _bootstrap_source_mtimes(project_root),
        "payload": payload,
    }
    path.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")


def _build_bootstrap_payload(
    project_root: Path,
    *,
    force_refresh_finance: bool = False,
    force_refresh_voting: bool = False,
) -> dict[str, Any]:
    from .campaign_finance import get_summary_payload as get_finance_summary
    from .lobbyist_registration import get_summary_payload as get_lobby_summary

    directory = get_directory_payload(
        project_root,
        force_refresh_finance=force_refresh_finance,
        force_refresh_voting=force_refresh_voting,
    )
    voting = council_voting.get_summary_payload(
        project_root,
        force_refresh=force_refresh_voting,
        lightweight=True,
    )
    finance = get_finance_summary(
        project_root,
        force_refresh=force_refresh_finance,
        lightweight=True,
    )
    lobby = get_lobby_summary(
        project_root,
        force_refresh=force_refresh_finance or force_refresh_voting,
        lightweight=True,
        limit=0,
        offset=0,
    )
    return {
        "directory": directory,
        "voting": voting,
        "finance": finance,
        "lobbyist": lobby,
    }


def get_member_profile_payload(
    project_root: Path,
    member_id: str,
    *,
    force_refresh_finance: bool = False,
    force_refresh_voting: bool = False,
    record_type: Optional[str] = None,
    q: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    recent_limit: int = 15,
) -> dict[str, Any]:
    fin = get_finance_cache(project_root, force_refresh=force_refresh_finance)
    vote = council_voting.get_cached_rows(
        project_root, force_refresh=force_refresh_voting
    )
    finance_rows: list[dict[str, Any]] = fin.get("rows") or []
    voting_rows: list[dict[str, Any]] = vote.get("rows") or []

    directory = build_member_directory(finance_rows, voting_rows)
    entry = next((m for m in directory if m["id"] == member_id.strip().lower()), None)
    if not entry:
        return {"found": False, "member_id": member_id}

    enrich_member_portrait(entry, project_root=project_root)

    finance_overview = None
    fc = entry.get("finance_candidate_name")
    if fc:
        overview_rows = apply_filters(
            finance_rows,
            candidate=fc,
            record_type=record_type,
            q=q,
        )
        finance_overview = build_candidate_overview(overview_rows, fc)

    voting_stats = None
    recent: list[dict[str, Any]] = []
    if entry.get("has_voting"):
        voting_stats = build_member_voting_stats(
            voting_rows,
            member_id=member_id,
            from_date=from_date,
            to_date=to_date,
        )
        recent = recent_votes(
            voting_rows,
            member_id=member_id,
            limit=recent_limit,
            from_date=from_date,
            to_date=to_date,
        )

    lobbyist_overlap: list[dict[str, Any]] = []
    try:
        from .lobbyist_registration import get_cached_rows as get_lobby_cached
        from .lobbyist_registration import member_lobby_overlap

        lobby_rows = (get_lobby_cached(project_root).get("rows")) or []
        fc = entry.get("finance_candidate_name")
        if fc and lobby_rows:
            lobbyist_overlap = member_lobby_overlap(lobby_rows, finance_rows, fc)
    except Exception:
        lobbyist_overlap = []

    return {
        "found": True,
        "member": entry,
        "finance_overview": finance_overview,
        "voting_stats": voting_stats,
        "recent_votes": recent,
        "lobbyist_overlap": lobbyist_overlap,
    }


def finance_candidate_for_member_id(
    member_id: str,
    directory: list[dict[str, Any]],
) -> Optional[str]:
    entry = next((m for m in directory if m["id"] == member_id.strip().lower()), None)
    if entry:
        return entry.get("finance_candidate_name")
    return None

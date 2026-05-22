"""
Dallas Campaign Finance (Socrata ndxz-gccx): fetch, cache, aggregate, filter for dashboard APIs.
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

RowKind = Literal["contribution", "expenditure", "filing", "other"]

SOCRATA_DATASET_ID = "ndxz-gccx"
SOCRATA_RESOURCE_URL = (
    f"https://www.dallasopendata.com/resource/{SOCRATA_DATASET_ID}.json"
)
SOCRATA_VIEW_META_URL = (
    f"https://www.dallasopendata.com/api/views/{SOCRATA_DATASET_ID}.json"
)
SOURCE_PORTAL_URL = (
    "https://www.dallasopendata.com/Services/Campaign-Finance/ndxz-gccx/data_preview"
)

CACHE_TTL_SEC = 3600  # ~1 hour; filings update infrequently vs police calls.

# schedule_type buckets (City of Dallas TEC-style labels from Open Data).
CONTRIBUTION_SCHEDULES = frozenset(
    {
        "Political Contributions Other Than Pledges Or Loans",
        "Pledged Contributions",
        "Loans",
    }
)
EXPENDITURE_SCHEDULES = frozenset(
    {
        "Political Expenditures",
        "Political Expenditures Made From Personal Funds",
        "Non-Political Expenditures Made From Political Contributions",
        "Credits",
    }
)
FILING_SCHEDULES = frozenset(
    {
        "Report",
        "Report Itself",
        "Notice From Political Committees",
    }
)


def utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def cache_path(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / "campaign_finance_cache.json"


def _socrata_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/json",
        "User-Agent": "SivicScraper/1.0 (local dashboard; campaign finance)",
    }
    token = os.environ.get("SOCRATA_APP_TOKEN", "").strip()
    if token:
        headers["X-App-Token"] = token
    return headers


def fetch_campaign_finance(limit: int = 10000) -> list[dict[str, Any]]:
    """Pull all campaign finance rows from Dallas Open Data (SODA 2.x)."""
    params = {
        "$limit": max(1, min(limit, 10000)),
        "$order": "transaction_date DESC",
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
    data = resp.json()
    return data if isinstance(data, list) else []


def fetch_dataset_meta() -> dict[str, Any]:
    """Optional upstream ``rowsUpdatedAt`` for UI staleness hints."""
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


def parse_amount(raw: Any) -> Optional[float]:
    if raw is None or raw == "":
        return None
    try:
        return float(str(raw).replace(",", "").strip())
    except ValueError:
        return None


def parse_file_url(raw: dict[str, Any]) -> str:
    link = raw.get("file_link")
    if isinstance(link, dict):
        return str(link.get("url") or "").strip()
    return ""


def counterparty_name(raw: dict[str, Any]) -> str:
    """
    The other party in the transaction: donor (contribution) or vendor (expenditure).

    Prefer ``business_name`` when present (e.g. Mailchimp, NGP VAN); otherwise person name.
    """
    biz = str(raw.get("business_name") or "").strip()
    if biz:
        return biz
    first = str(raw.get("first_name") or "").strip()
    last = str(raw.get("last_name") or "").strip()
    return f"{first} {last}".strip()


def payee_name(raw: dict[str, Any]) -> str:
    """Alias kept for table sort keys; same as ``counterparty_name``."""
    return counterparty_name(raw)


def party_key(name: str) -> str:
    """Normalized name for overlap / duplicate detection."""
    s = re.sub(r"[^\w\s]", "", (name or "").lower())
    return " ".join(s.split())


def row_counterparty(row: dict[str, Any]) -> str:
    """Counterparty from a normalized row (supports older cache without the field)."""
    return (
        str(row.get("counterparty_name") or row.get("payee_name") or "").strip()
    )


def classify_row(schedule_type: str) -> RowKind:
    st = (schedule_type or "").strip()
    if st in CONTRIBUTION_SCHEDULES:
        return "contribution"
    if st in EXPENDITURE_SCHEDULES:
        return "expenditure"
    if st in FILING_SCHEDULES:
        return "filing"
    return "other"


def normalize_row(raw: dict[str, Any]) -> dict[str, Any]:
    """Map Socrata row to a stable JSON schema for APIs and UI."""
    schedule_type = str(raw.get("schedule_type") or "")
    amount_raw = raw.get("amount")
    amount_num = parse_amount(amount_raw)
    tx_date = str(raw.get("transaction_date") or "")
    election_date = str(raw.get("election_date") or "") or None
    cp = counterparty_name(raw)
    biz = str(raw.get("business_name") or "").strip()

    return {
        "id": str(raw.get("id") or ""),
        "record_id": str(raw.get("record_id") or ""),
        "report_id": str(raw.get("report_id") or ""),
        "candidate_name": str(raw.get("candidate_name") or "").strip(),
        "counterparty_name": cp,
        "business_name": biz,
        "payee_name": cp,
        "contact_type": str(raw.get("contact_type") or ""),
        "schedule_type": schedule_type,
        "record_type": str(raw.get("record_type") or ""),
        "kind": classify_row(schedule_type),
        "amount": str(amount_raw) if amount_raw is not None else "",
        "amount_num": amount_num,
        "transaction_date": tx_date,
        "election_date": election_date,
        "file_url": parse_file_url(raw),
        "street": str(raw.get("street") or ""),
        "city": str(raw.get("city") or ""),
        "state": str(raw.get("state") or ""),
        "zipcode": str(raw.get("zipcode") or ""),
    }


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
    """Fetch upstream, normalize, persist disk cache."""
    raw_rows = fetch_campaign_finance()
    rows = [normalize_row(r) for r in raw_rows if r.get("id")]
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
    """
    Return cache document with ``rows`` list.

    Serves disk first; refreshes synchronously only when ``force_refresh``.
    Stale or missing caches trigger background sync when enabled.
    """
    if force_refresh:
        return refresh_cache(project_root)

    cached = load_cache(project_root)
    if cached and cached.get("rows") is not None:
        stale = cache_is_stale(cached)
        from .data_sync import JOB_FINANCE, attach_cache_meta, maybe_schedule_stale

        maybe_schedule_stale(project_root, JOB_FINANCE, cached, cache_is_stale)
        return attach_cache_meta(cached, job_id=JOB_FINANCE, stale=stale)

    from .data_sync import JOB_FINANCE, schedule_refresh, warming_rows_document

    schedule_refresh(project_root, JOB_FINANCE, force=True)
    return warming_rows_document("campaign_finance")


def _parse_tx_month(tx_date: str) -> Optional[str]:
    """``transaction_date`` → ``YYYY-MM`` for monthly charts."""
    if not tx_date:
        return None
    try:
        # Socrata ISO: 2025-05-15T00:00:00.000
        dt = datetime.fromisoformat(tx_date.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m")
    except ValueError:
        return tx_date[:7] if len(tx_date) >= 7 else None


def apply_filters(
    rows: list[dict[str, Any]],
    *,
    candidate: Optional[str] = None,
    kind: Optional[str] = None,
    record_type: Optional[str] = None,
    q: Optional[str] = None,
) -> list[dict[str, Any]]:
    """Filter normalized rows (case-insensitive search on key text fields)."""
    out = rows
    if candidate:
        cand = candidate.strip().lower()
        out = [r for r in out if r.get("candidate_name", "").lower() == cand]
    if kind and kind != "all":
        out = [r for r in out if r.get("kind") == kind]
    if record_type:
        rt = record_type.strip()
        out = [r for r in out if r.get("record_type") == rt]
    if q:
        needle = q.strip().lower()
        if needle:

            def matches(row: dict[str, Any]) -> bool:
                hay = " ".join(
                    str(row.get(k) or "")
                    for k in (
                        "candidate_name",
                        "counterparty_name",
                        "payee_name",
                        "business_name",
                        "schedule_type",
                        "contact_type",
                        "record_type",
                        "id",
                    )
                ).lower()
                return needle in hay

            out = [r for r in out if matches(r)]
    return out


def top_candidates(
    rows: list[dict[str, Any]],
    kind: RowKind,
    *,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Sum ``amount_num`` by ``candidate_name`` for one ``kind``."""
    totals: dict[str, float] = defaultdict(float)
    for row in rows:
        if row.get("kind") != kind:
            continue
        amt = row.get("amount_num")
        if amt is None or amt <= 0:
            continue
        name = row.get("candidate_name") or "Unknown"
        totals[name] += float(amt)

    ranked = sorted(totals.items(), key=lambda x: x[1], reverse=True)[:limit]
    return [{"candidate": name, "total": round(total, 2)} for name, total in ranked]


def by_month(
    rows: list[dict[str, Any]],
    *,
    months: int = 24,
) -> list[dict[str, Any]]:
    """Contributions vs expenditures per calendar month (most recent N months)."""
    contrib: dict[str, float] = defaultdict(float)
    expend: dict[str, float] = defaultdict(float)

    for row in rows:
        month = _parse_tx_month(str(row.get("transaction_date") or ""))
        if not month:
            continue
        amt = row.get("amount_num")
        if amt is None or amt <= 0:
            continue
        if row.get("kind") == "contribution":
            contrib[month] += float(amt)
        elif row.get("kind") == "expenditure":
            expend[month] += float(amt)

    all_months = sorted(set(contrib) | set(expend))
    if len(all_months) > months:
        all_months = all_months[-months:]

    return [
        {
            "month": m,
            "contributions": round(contrib.get(m, 0.0), 2),
            "expenditures": round(expend.get(m, 0.0), 2),
        }
        for m in all_months
    ]


def schedule_breakdown(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Count rows per ``schedule_type``."""
    counts: dict[str, int] = defaultdict(int)
    for row in rows:
        st = row.get("schedule_type") or "Unknown"
        counts[st] += 1
    ranked = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    return [{"schedule_type": k, "count": v} for k, v in ranked[:15]]


def build_kpis(rows: list[dict[str, Any]]) -> dict[str, Any]:
    total_contrib = 0.0
    total_expend = 0.0
    contrib_count = 0
    expend_count = 0
    filing_count = 0
    candidates: set[str] = set()
    latest_tx: Optional[str] = None

    for row in rows:
        cand = row.get("candidate_name")
        if cand:
            candidates.add(cand)
        tx = row.get("transaction_date") or ""
        if tx and (latest_tx is None or tx > latest_tx):
            latest_tx = tx

        kind = row.get("kind")
        amt = row.get("amount_num")
        if kind == "filing":
            filing_count += 1
            continue
        if amt is None or amt <= 0:
            continue
        if kind == "contribution":
            total_contrib += float(amt)
            contrib_count += 1
        elif kind == "expenditure":
            total_expend += float(amt)
            expend_count += 1

    return {
        "total_contributions": round(total_contrib, 2),
        "total_expenditures": round(total_expend, 2),
        "net": round(total_contrib - total_expend, 2),
        "contribution_transactions": contrib_count,
        "expenditure_transactions": expend_count,
        "filing_count": filing_count,
        "unique_candidates": len(candidates),
        "latest_transaction_date": latest_tx,
    }


def distinct_values(rows: list[dict[str, Any]]) -> dict[str, list[str]]:
    candidates = sorted({r["candidate_name"] for r in rows if r.get("candidate_name")})
    record_types = sorted({r["record_type"] for r in rows if r.get("record_type")})
    return {"candidates": candidates, "record_types": record_types}


def spending_breakdown(
    rows: list[dict[str, Any]],
    *,
    limit: int = 25,
) -> list[dict[str, Any]]:
    """Candidate → vendor → dollars (who spent how much on what)."""
    totals: dict[tuple[str, str], float] = defaultdict(float)
    for row in rows:
        if row.get("kind") != "expenditure":
            continue
        amt = row.get("amount_num")
        if amt is None or amt <= 0:
            continue
        cand = row.get("candidate_name") or "Unknown"
        vendor = row_counterparty(row) or "Unknown"
        totals[(cand, vendor)] += float(amt)

    ranked = sorted(totals.items(), key=lambda x: x[1], reverse=True)[:limit]
    return [
        {
            "candidate": cand,
            "vendor": vendor,
            "total": round(total, 2),
        }
        for (cand, vendor), total in ranked
    ]


def top_vendors(
    rows: list[dict[str, Any]],
    *,
    limit: int = 15,
) -> list[dict[str, Any]]:
    """Top payees across all campaigns, with which candidates paid them."""
    by_vendor: dict[str, float] = defaultdict(float)
    vendor_candidates: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

    for row in rows:
        if row.get("kind") != "expenditure":
            continue
        amt = row.get("amount_num")
        if amt is None or amt <= 0:
            continue
        vendor = row_counterparty(row) or "Unknown"
        cand = row.get("candidate_name") or "Unknown"
        by_vendor[vendor] += float(amt)
        vendor_candidates[vendor][cand] += float(amt)

    ranked = sorted(by_vendor.items(), key=lambda x: x[1], reverse=True)[:limit]
    out: list[dict[str, Any]] = []
    for vendor, total in ranked:
        spenders = sorted(
            vendor_candidates[vendor].items(), key=lambda x: x[1], reverse=True
        )
        out.append(
            {
                "vendor": vendor,
                "total": round(total, 2),
                "candidates": [
                    {"candidate": c, "total": round(a, 2)} for c, a in spenders[:8]
                ],
            }
        )
    return out


def donor_bankroll(
    rows: list[dict[str, Any]],
    *,
    limit: int = 20,
) -> list[dict[str, Any]]:
    """Donor → total given → list of candidates supported (bankrolling view)."""
    by_donor: dict[str, float] = defaultdict(float)
    donor_candidates: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

    for row in rows:
        if row.get("kind") != "contribution":
            continue
        amt = row.get("amount_num")
        if amt is None or amt <= 0:
            continue
        donor = row_counterparty(row)
        if not donor:
            continue
        cand = row.get("candidate_name") or "Unknown"
        by_donor[donor] += float(amt)
        donor_candidates[donor][cand] += float(amt)

    ranked = sorted(by_donor.items(), key=lambda x: x[1], reverse=True)[:limit]
    out: list[dict[str, Any]] = []
    for donor, total in ranked:
        beneficiaries = sorted(
            donor_candidates[donor].items(), key=lambda x: x[1], reverse=True
        )
        out.append(
            {
                "donor": donor,
                "total": round(total, 2),
                "candidate_count": len(beneficiaries),
                "candidates": [
                    {"candidate": c, "total": round(a, 2)} for c, a in beneficiaries
                ],
            }
        )
    return out


def build_watch_list(
    rows: list[dict[str, Any]],
    *,
    multi_candidate_min_total: float = 1000.0,
    concentration_pct: float = 0.25,
    concentration_min: float = 2500.0,
    limit: int = 30,
) -> list[dict[str, Any]]:
    """
    Heuristic flags for manual review — not legal findings.

    - Multi-candidate donor: same donor gives meaningful amounts to 2+ candidates.
    - Donor–vendor overlap: entity both contributes and receives campaign payments.
    - High concentration: one donor supplies a large share of a candidate's fundraising.
    - Self-contribution: donor name matches candidate name.
    """
    signals: list[dict[str, Any]] = []

    donor_to_cands: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    contrib_by_key: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    expend_by_key: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    cand_contrib_totals: dict[str, float] = defaultdict(float)
    cand_donor_totals: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    seen_self: set[str] = set()

    for row in rows:
        kind = row.get("kind")
        amt = row.get("amount_num")
        if amt is None or amt <= 0:
            continue
        cand = row.get("candidate_name") or ""
        cp = row_counterparty(row)
        if not cp:
            continue
        key = party_key(cp)
        if not key:
            continue

        if kind == "contribution":
            donor_to_cands[key][cand] += float(amt)
            contrib_by_key[key][cand] += float(amt)
            cand_contrib_totals[cand] += float(amt)
            cand_donor_totals[cand][cp] += float(amt)
            if party_key(cand) == key and cand not in seen_self and float(amt) >= 500:
                seen_self.add(cand)
                signals.append(
                    {
                        "type": "self_contribution",
                        "severity": "low",
                        "title": f"{cand} — self-contribution",
                        "detail": f"${float(amt):,.0f} recorded under the candidate's own name.",
                        "candidate": cand,
                        "counterparty": cp,
                        "amount": round(float(amt), 2),
                    }
                )
        elif kind == "expenditure":
            expend_by_key[key][cand] += float(amt)

    seen_multi: set[str] = set()
    for key, cands in donor_to_cands.items():
        if len(cands) < 2:
            continue
        total = sum(cands.values())
        if total < multi_candidate_min_total:
            continue
        display_name = cp_display_name(rows, key)
        if key in seen_multi:
            continue
        seen_multi.add(key)
        cand_list = [
            {"candidate": c, "total": round(a, 2)}
            for c, a in sorted(cands.items(), key=lambda x: x[1], reverse=True)
        ]
        signals.append(
            {
                "type": "multi_candidate_donor",
                "severity": "medium",
                "title": f"{display_name} — gave to {len(cands)} candidates",
                "detail": (
                    f"${total:,.0f} total across campaigns. Review whether this donor "
                    "has business before multiple officeholders."
                ),
                "counterparty": display_name,
                "total": round(total, 2),
                "candidates": cand_list,
            }
        )

    for key in set(contrib_by_key) & set(expend_by_key):
        gave = contrib_by_key[key]
        paid = expend_by_key[key]
        total_gave = sum(gave.values())
        total_paid = sum(paid.values())
        if total_gave < 1000 and total_paid < 1000:
            continue
        display_name = cp_display_name(rows, key)
        signals.append(
            {
                "type": "donor_vendor_overlap",
                "severity": "high",
                "title": f"{display_name} — both donor and payee",
                "detail": (
                    f"Contributed ${total_gave:,.0f} to campaign(s) while campaigns spent "
                    f"${total_paid:,.0f} to this entity. Worth a closer look."
                ),
                "counterparty": display_name,
                "contributed": round(total_gave, 2),
                "received": round(total_paid, 2),
                "gave_to": [
                    {"candidate": c, "total": round(a, 2)}
                    for c, a in sorted(gave.items(), key=lambda x: x[1], reverse=True)
                ],
                "paid_by": [
                    {"candidate": c, "total": round(a, 2)}
                    for c, a in sorted(paid.items(), key=lambda x: x[1], reverse=True)
                ],
            }
        )

    for cand, total in cand_contrib_totals.items():
        if total <= 0:
            continue
        for donor, amt in cand_donor_totals[cand].items():
            if amt < concentration_min:
                continue
            share = amt / total
            if share >= concentration_pct:
                signals.append(
                    {
                        "type": "concentrated_funding",
                        "severity": "medium",
                        "title": f"{donor} — {share * 100:.0f}% of {cand}'s contributions",
                        "detail": (
                            f"${amt:,.0f} of ${total:,.0f} raised in this filtered set. "
                            "Heavy reliance on a single source."
                        ),
                        "candidate": cand,
                        "counterparty": donor,
                        "amount": round(amt, 2),
                        "share": round(share, 3),
                    }
                )

    severity_order = {"high": 0, "medium": 1, "low": 2}
    signals.sort(key=lambda s: (severity_order.get(s.get("severity", "low"), 9), s.get("title", "")))
    return signals[:limit]


def cp_display_name(rows: list[dict[str, Any]], key: str) -> str:
    """Pick a human-readable label for a normalized ``party_key``."""
    for row in rows:
        cp = row_counterparty(row)
        if cp and party_key(cp) == key:
            return cp
    return key


def _top_counterparties_for_candidate(
    rows: list[dict[str, Any]],
    kind: RowKind,
    *,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Sum amounts by counterparty for one ``kind`` within a candidate's rows."""
    totals: dict[str, float] = defaultdict(float)
    for row in rows:
        if row.get("kind") != kind:
            continue
        amt = row.get("amount_num")
        if amt is None or amt <= 0:
            continue
        cp = row_counterparty(row) or "Unknown"
        totals[cp] += float(amt)

    grand = sum(totals.values()) or 1.0
    ranked = sorted(totals.items(), key=lambda x: x[1], reverse=True)[:limit]
    return [
        {
            "name": name,
            "total": round(total, 2),
            "share": round(total / grand, 3),
        }
        for name, total in ranked
    ]


def _fiscal_responsibility(
    *,
    raised: float,
    spent: float,
    top_donor_share: float,
    self_funding_share: float,
) -> dict[str, Any]:
    """
    Plain-language fiscal health summary from reported totals (heuristic, not audit).
    """
    net = raised - spent
    burn_rate = (spent / raised) if raised > 0 else (999.0 if spent > 0 else 0.0)
    reserve_pct = (net / raised) if raised > 0 else 0.0

    if raised <= 0 and spent > 0:
        status = "deficit"
        label = "Spending without reported raises"
        summary = (
            "Filings show expenditures but no contributions in this dataset slice — "
            "may be incomplete or funded outside reported schedules."
        )
    elif burn_rate > 1.2:
        status = "deficit"
        label = "Cash deficit"
        summary = (
            f"Spent {burn_rate * 100:.0f}% of reported fundraising — "
            "spending materially exceeds money raised."
        )
    elif burn_rate > 0.95:
        status = "tight"
        label = "Tight budget"
        summary = "Spending nearly matches fundraising — little reported cash cushion."
    elif reserve_pct >= 0.25:
        status = "surplus"
        label = "Strong surplus"
        summary = (
            f"About {reserve_pct * 100:.0f}% of raised funds unspent in reported filings — "
            "healthy reserve on paper."
        )
    else:
        status = "balanced"
        label = "Balanced"
        summary = "Fundraising and spending are in a typical balance for municipal campaigns."

    flags: list[str] = []
    if top_donor_share >= 0.35:
        flags.append(
            f"Top donor supplies {top_donor_share * 100:.0f}% of contributions — concentrated funding risk."
        )
    if self_funding_share >= 0.15:
        flags.append(
            f"Self-funding is {self_funding_share * 100:.0f}% of raised total — high personal investment."
        )
    if burn_rate < 0.5 and raised > 5000:
        flags.append("Low spend rate vs. fundraising — large war chest or slow deployment.")

    return {
        "status": status,
        "label": label,
        "summary": summary,
        "flags": flags,
        "burn_rate": round(burn_rate, 3) if burn_rate < 100 else None,
        "reserve_pct": round(reserve_pct, 3),
        "net_cash": round(net, 2),
    }


def build_candidate_overview(
    rows: list[dict[str, Any]],
    candidate: str,
) -> dict[str, Any]:
    """
    Full campaign finance profile for one candidate (all transaction kinds).

    ``rows`` should already be scoped to this candidate (optionally filing period / search).
    """
    cand_rows = [r for r in rows if r.get("candidate_name") == candidate]
    if not cand_rows:
        return {"candidate": candidate, "found": False}

    raised = 0.0
    spent = 0.0
    self_funding = 0.0
    contrib_count = 0
    expend_count = 0
    filing_count = 0
    record_types: set[str] = set()
    latest_tx: Optional[str] = None
    election_dates: set[str] = set()

    for row in cand_rows:
        rt = row.get("record_type")
        if rt:
            record_types.add(rt)
        tx = row.get("transaction_date") or ""
        if tx and (latest_tx is None or tx > latest_tx):
            latest_tx = tx
        if row.get("election_date"):
            election_dates.add(str(row["election_date"]))

        kind = row.get("kind")
        amt = row.get("amount_num")
        if kind == "filing":
            filing_count += 1
            continue
        if amt is None or amt <= 0:
            continue

        cp = row_counterparty(row)
        cand_key = party_key(candidate)

        if kind == "contribution":
            raised += float(amt)
            contrib_count += 1
            if cp and party_key(cp) == cand_key:
                self_funding += float(amt)
        elif kind == "expenditure":
            spent += float(amt)
            expend_count += 1

    top_donors = _top_counterparties_for_candidate(cand_rows, "contribution")
    top_vendors_list = _top_counterparties_for_candidate(cand_rows, "expenditure")
    top_donor_share = top_donors[0]["share"] if top_donors else 0.0
    self_share = (self_funding / raised) if raised > 0 else 0.0

    fiscal = _fiscal_responsibility(
        raised=raised,
        spent=spent,
        top_donor_share=top_donor_share,
        self_funding_share=self_share,
    )

    return {
        "found": True,
        "candidate": candidate,
        "financials": {
            "total_raised": round(raised, 2),
            "total_spent": round(spent, 2),
            "net_cash": round(raised - spent, 2),
            "contribution_count": contrib_count,
            "expenditure_count": expend_count,
            "filing_count": filing_count,
            "latest_transaction_date": latest_tx,
            "record_types": sorted(record_types),
            "election_dates": sorted(election_dates),
        },
        "major_donors": top_donors,
        "major_expenditures": top_vendors_list,
        "fiscal_responsibility": fiscal,
        "monthly": by_month(cand_rows),
        "watch_list": build_watch_list(cand_rows, limit=8),
        "schedule_breakdown": schedule_breakdown(cand_rows),
    }


def build_candidate_index(
    rows: list[dict[str, Any]],
    *,
    limit: int = 60,
) -> list[dict[str, Any]]:
    """Compact card data for every candidate (browse grid)."""
    stats: dict[str, dict[str, float]] = defaultdict(
        lambda: {"raised": 0.0, "spent": 0.0, "contrib_n": 0, "expend_n": 0}
    )

    for row in rows:
        cand = row.get("candidate_name")
        if not cand:
            continue
        kind = row.get("kind")
        amt = row.get("amount_num")
        if amt is None or amt <= 0:
            continue
        if kind == "contribution":
            stats[cand]["raised"] += float(amt)
            stats[cand]["contrib_n"] += 1
        elif kind == "expenditure":
            stats[cand]["spent"] += float(amt)
            stats[cand]["expend_n"] += 1

    index: list[dict[str, Any]] = []
    for cand, s in stats.items():
        raised = s["raised"]
        spent = s["spent"]
        index.append(
            {
                "candidate": cand,
                "total_raised": round(raised, 2),
                "total_spent": round(spent, 2),
                "net_cash": round(raised - spent, 2),
                "burn_rate": round(spent / raised, 3) if raised > 0 else None,
            }
        )

    index.sort(key=lambda x: x["total_raised"], reverse=True)
    return index[:limit]


def build_insights(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Spending, donor, and watch-list analytics for the reporting UI."""
    return {
        "spending_breakdown": spending_breakdown(rows),
        "top_vendors": top_vendors(rows),
        "donor_bankroll": donor_bankroll(rows),
        "watch_list": build_watch_list(rows),
    }


def build_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Chart series + KPI block + insights for a row set (full or filtered)."""
    return {
        "kpis": build_kpis(rows),
        "charts": {
            "top_contributions": top_candidates(rows, "contribution"),
            "top_expenditures": top_candidates(rows, "expenditure"),
            "by_month": by_month(rows),
            "schedule_breakdown": schedule_breakdown(rows),
        },
        "insights": build_insights(rows),
    }


def get_summary_payload(
    project_root: Path,
    *,
    force_refresh: bool = False,
    candidate: Optional[str] = None,
    kind: Optional[str] = None,
    record_type: Optional[str] = None,
    q: Optional[str] = None,
) -> dict[str, Any]:
    """API payload for ``GET /api/campaign-finance/summary``."""
    cached = get_cached_rows(project_root, force_refresh=force_refresh)
    all_rows: list[dict[str, Any]] = cached.get("rows") or []
    filtered = apply_filters(
        all_rows,
        candidate=candidate,
        kind=kind,
        record_type=record_type,
        q=q,
    )

    # Overview uses candidate (+ period/search) but ignores transaction-kind filter.
    overview_rows = apply_filters(
        all_rows,
        candidate=candidate,
        record_type=record_type,
        q=q,
    )
    candidate_overview: Optional[dict[str, Any]] = None
    if candidate:
        candidate_overview = build_candidate_overview(overview_rows, candidate)

    payload = {
        "meta": {
            "fetched_at": cached.get("fetched_at"),
            "row_count": len(all_rows),
            "filtered_count": len(filtered),
            "cache_ttl_sec": CACHE_TTL_SEC,
            "from_cache": not force_refresh,
            **(cached.get("meta") or {}),
        },
        "filters": {
            "candidate": candidate or "",
            "kind": kind or "all",
            "record_type": record_type or "",
            "q": q or "",
        },
        "options": distinct_values(all_rows),
        **build_summary(filtered),
        "candidate_overview": candidate_overview,
        "candidate_index": build_candidate_index(all_rows) if not candidate else [],
    }
    return payload


def get_transactions_payload(
    project_root: Path,
    *,
    force_refresh: bool = False,
    candidate: Optional[str] = None,
    kind: Optional[str] = None,
    record_type: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    """API payload for ``GET /api/campaign-finance/transactions``."""
    cached = get_cached_rows(project_root, force_refresh=force_refresh)
    all_rows: list[dict[str, Any]] = cached.get("rows") or []
    filtered = apply_filters(
        all_rows,
        candidate=candidate,
        kind=kind,
        record_type=record_type,
        q=q,
    )
    cap = max(1, min(limit, 200))
    start = max(0, offset)
    page = filtered[start : start + cap]

    return {
        "meta": {
            "fetched_at": cached.get("fetched_at"),
            "total": len(filtered),
            "limit": cap,
            "offset": start,
        },
        "transactions": page,
    }

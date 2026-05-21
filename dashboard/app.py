"""
FastAPI UI for supervising the Dallas Legistar scraper.

Local dev binds ``127.0.0.1``; production (Hostinger VPS Docker) uses ``0.0.0.0``.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Optional
from urllib.parse import unquote

import requests
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .campaign_finance import get_summary_payload, get_transactions_payload
from .council_accountability import (
    get_directory_payload,
    get_member_profile_payload,
)
from .council_voting import get_agenda_item_payload
from .council_voting import get_agenda_items_payload
from .council_voting import get_summary_payload as get_voting_summary_payload
from .council_voting import get_votes_payload
from .command_center import ApiUsageTracker, build_command_payload
from .city_budget import (
    BULK_ROWS_LIMIT,
    get_operating_payload,
    get_revenue_payload,
    get_rows_payload,
    get_summary_payload as get_city_budget_summary_payload,
    get_vendor_payload,
)
from .police_calls import get_active_calls_payload
from .summaries import SummaryJob, join_manifest_summaries
from .supervisor import (
    ScraperSupervisor,
    audit_entries_from_jsonl,
    summarize_files,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SUP = ScraperSupervisor(PROJECT_ROOT)
SUMMARY_JOB = SummaryJob(PROJECT_ROOT)

# Public deploy: disable Playwright scrape controls unless explicitly enabled.
SCRAPER_ENABLED = os.environ.get("SCRAPER_ENABLED", "1").strip().lower() in (
    "1",
    "true",
    "yes",
    "on",
)

app = FastAPI(title="Legistar Scraper Dashboard", docs_url=None, redoc_url=None)
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))
API_USAGE = ApiUsageTracker()
_static_dir = Path(__file__).parent / "static"
if _static_dir.is_dir():
    app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")

_council_images = PROJECT_ROOT / "images"
if _council_images.is_dir():
    app.mount(
        "/council-images",
        StaticFiles(directory=str(_council_images)),
        name="council-images",
    )


@app.middleware("http")
async def api_usage_middleware(request: Request, call_next):
    """Count HTTP hits for the ops portal (excludes /static and /api/command)."""
    response = await call_next(request)
    API_USAGE.record(request.method, request.url.path)
    return response


@app.get("/council-accountability", response_class=HTMLResponse)
async def council_accountability_page(request: Request) -> HTMLResponse:
    """Council Accountability: campaign finance + city council voting (Socrata)."""
    return templates.TemplateResponse(
        request=request,
        name="campaign_finance.html",
        context={},
    )


@app.get("/campaign-finance", include_in_schema=False)
async def campaign_finance_redirect() -> RedirectResponse:
    """Legacy path → canonical Council Accountability URL."""
    return RedirectResponse(url="/council-accountability", status_code=308)


@app.get("/api/campaign-finance/summary")
async def api_campaign_finance_summary(
    refresh: bool = False,
    candidate: Optional[str] = None,
    kind: Optional[str] = None,
    record_type: Optional[str] = None,
    q: Optional[str] = None,
) -> dict[str, Any]:
    """KPIs, chart series, and filter options (optional filters narrow charts)."""
    try:
        return get_summary_payload(
            PROJECT_ROOT,
            force_refresh=refresh,
            candidate=candidate,
            kind=kind,
            record_type=record_type,
            q=q,
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/campaign-finance/transactions")
async def api_campaign_finance_transactions(
    refresh: bool = False,
    candidate: Optional[str] = None,
    kind: Optional[str] = None,
    record_type: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    """Paginated transaction rows for the dashboard table."""
    try:
        return get_transactions_payload(
            PROJECT_ROOT,
            force_refresh=refresh,
            candidate=candidate,
            kind=kind,
            record_type=record_type,
            q=q,
            limit=max(1, min(limit, 200)),
            offset=max(0, offset),
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/council-voting/summary")
async def api_council_voting_summary(
    refresh: bool = False,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    lightweight: bool = False,
) -> dict[str, Any]:
    """Voting cache meta, member index, and global roll-call KPIs."""
    try:
        return get_voting_summary_payload(
            PROJECT_ROOT,
            force_refresh=refresh,
            from_date=from_date,
            to_date=to_date,
            lightweight=lightweight,
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/council-voting/votes")
async def api_council_voting_votes(
    refresh: bool = False,
    member: Optional[str] = None,
    vote: Optional[str] = None,
    q: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    """Paginated council vote rows."""
    try:
        return get_votes_payload(
            PROJECT_ROOT,
            force_refresh=refresh,
            member_id=member,
            vote=vote,
            q=q,
            from_date=from_date,
            to_date=to_date,
            limit=max(1, min(limit, 200)),
            offset=max(0, offset),
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/council-voting/agenda-items")
async def api_council_voting_agenda_items(
    refresh: bool = False,
    q: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    """Paginated roll calls grouped by agenda item (vote-centric view)."""
    try:
        return get_agenda_items_payload(
            PROJECT_ROOT,
            force_refresh=refresh,
            q=q,
            from_date=from_date,
            to_date=to_date,
            limit=max(1, min(limit, 100)),
            offset=max(0, offset),
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/council-voting/agenda-item")
async def api_council_voting_agenda_item(
    roll_call_id: str = Query(..., description="Roll call id from agenda-items list"),
    refresh: bool = False,
) -> dict[str, Any]:
    """One agenda item with full description and councilmember roll call."""
    if not roll_call_id.strip():
        raise HTTPException(status_code=400, detail="roll_call_id is required")
    try:
        payload = get_agenda_item_payload(
            PROJECT_ROOT,
            roll_call_id.strip(),
            force_refresh=refresh,
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if not payload.get("found"):
        raise HTTPException(status_code=404, detail="Roll call not found")
    return payload


@app.get("/api/council-accountability/directory")
async def api_council_accountability_directory(
    refresh_finance: bool = False,
    refresh_voting: bool = False,
) -> dict[str, Any]:
    """Merged councilmember list (finance + voting)."""
    try:
        return get_directory_payload(
            PROJECT_ROOT,
            force_refresh_finance=refresh_finance,
            force_refresh_voting=refresh_voting,
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/council-accountability/member")
async def api_council_accountability_member(
    member: str,
    refresh_finance: bool = False,
    refresh_voting: bool = False,
    record_type: Optional[str] = None,
    q: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> dict[str, Any]:
    """Combined finance overview + voting stats for one member."""
    if not member.strip():
        raise HTTPException(status_code=400, detail="member is required")
    try:
        return get_member_profile_payload(
            PROJECT_ROOT,
            member.strip(),
            force_refresh_finance=refresh_finance,
            force_refresh_voting=refresh_voting,
            record_type=record_type,
            q=q,
            from_date=from_date,
            to_date=to_date,
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/city-budget", response_class=HTMLResponse)
async def city_budget_page(request: Request) -> HTMLResponse:
    """City Budget: revenue + operating budget dashboards (Socrata)."""
    return templates.TemplateResponse(
        request=request,
        name="city_budget.html",
        context={},
    )


@app.get("/api/city-budget/summary")
async def api_city_budget_summary(
    refresh: bool = False,
    refresh_revenue: bool = False,
    refresh_operating: bool = False,
    bfy: Optional[str] = None,
    ftyp: Optional[str] = None,
    fundtype: Optional[str] = None,
) -> dict[str, Any]:
    try:
        return get_city_budget_summary_payload(
            PROJECT_ROOT,
            force_refresh=refresh,
            refresh_revenue=refresh_revenue,
            refresh_operating=refresh_operating,
            bfy=bfy,
            ftyp=ftyp,
            fundtype=fundtype,
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/city-budget/revenue")
async def api_city_budget_revenue(
    refresh: bool = False,
    bfy: Optional[str] = None,
    ftyp: Optional[str] = None,
    fundtype: Optional[str] = None,
) -> dict[str, Any]:
    try:
        return get_revenue_payload(
            PROJECT_ROOT,
            force_refresh=refresh,
            bfy=bfy,
            ftyp=ftyp,
            fundtype=fundtype,
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/city-budget/operating")
async def api_city_budget_operating(
    refresh: bool = False,
    bfy: Optional[str] = None,
    ftyp: Optional[str] = None,
    fundtype: Optional[str] = None,
) -> dict[str, Any]:
    try:
        return get_operating_payload(
            PROJECT_ROOT,
            force_refresh=refresh,
            bfy=bfy,
            ftyp=ftyp,
            fundtype=fundtype,
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/city-budget/vendors")
async def api_city_budget_vendors(
    refresh: bool = False,
    refresh_vendor: bool = False,
    bfy: Optional[str] = None,
) -> dict[str, Any]:
    """Vendor payment aggregates + department links for the budget UI."""
    try:
        return get_vendor_payload(
            PROJECT_ROOT,
            force_refresh=refresh,
            refresh_vendor=refresh_vendor,
            bfy=bfy,
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/city-budget/rows")
async def api_city_budget_rows(
    dataset: str = Query(..., pattern="^(revenue|operating|vendor)$"),
    refresh: bool = False,
    bfy: Optional[str] = None,
    ftyp: Optional[str] = None,
    fundtype: Optional[str] = None,
    department: Optional[str] = None,
    service: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    try:
        return get_rows_payload(
            PROJECT_ROOT,
            dataset,  # type: ignore[arg-type]
            force_refresh=refresh,
            bfy=bfy,
            ftyp=ftyp,
            fundtype=fundtype,
            department=department,
            service=service,
            q=q,
            limit=max(1, min(limit, BULK_ROWS_LIMIT)),
            offset=max(0, offset),
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/police", response_class=HTMLResponse)
async def police_map(request: Request) -> HTMLResponse:
    """Map view of Dallas Police active calls (Socrata + geocoded markers)."""
    return templates.TemplateResponse(
        request=request,
        name="police_map.html",
        context={},
    )


@app.get("/api/police/active-calls")
async def api_police_active_calls(
    limit: int = 500,
    refresh: bool = False,
    geocode_budget: int = 0,
) -> dict[str, Any]:
    """Proxy Dallas Open Data active calls with geocoding for map display."""
    try:
        return get_active_calls_payload(
            PROJECT_ROOT,
            limit=max(1, min(limit, 1000)),
            force_refresh=refresh,
            geocode_budget=max(0, min(geocode_budget, 40)),
        )
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream Socrata error: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/", response_class=HTMLResponse)
async def home(request: Request) -> HTMLResponse:
    """App portal — links to council meetings, police, council accountability."""
    return templates.TemplateResponse(
        request=request,
        name="home.html",
        context={},
    )


@app.get("/council-meetings", response_class=HTMLResponse)
async def council_meetings(request: Request) -> HTMLResponse:
    """Legistar scrape supervisor UI (client polls JSON APIs)."""
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={},
    )


@app.get("/api/state")
async def api_state() -> dict[str, Any]:
    """Current supervisor state (derived from subprocess handle + PID file)."""
    st = SUP.state()
    return {
        "running": st.running,
        "run_id": st.run_id,
        "pid": st.pid,
        "started_at": st.started_at,
        "scraper_enabled": SCRAPER_ENABLED,
    }


@app.post("/api/start")
async def api_start() -> dict[str, Any]:
    """Kick off ``dallas_legistar_scraper.py`` subprocess."""
    if not SCRAPER_ENABLED:
        raise HTTPException(
            status_code=403,
            detail="Legistar scraper is disabled on this deployment (SCRAPER_ENABLED=0).",
        )
    try:
        payload = SUP.start()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except RuntimeError as exc:
        if str(exc) == "already_running":
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return payload


@app.post("/api/stop")
async def api_stop() -> dict[str, Any]:
    """Send SIGTERM to the scrape child PID (SIGKILL after timeout)."""
    if not SCRAPER_ENABLED:
        raise HTTPException(
            status_code=403,
            detail="Legistar scraper is disabled on this deployment (SCRAPER_ENABLED=0).",
        )
    try:
        return SUP.stop()
    except RuntimeError as exc:
        if str(exc) == "not_running":
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/audit")
async def api_audit(
    limit: int = 100,
    status: Optional[str] = None,
) -> dict[str, Any]:
    """
    Latest ``finished`` audit rows (newest-first). Optionally filter ``status``.
    statuses: ``completed`` | ``stopped`` | ``failed``
    """
    rows = audit_entries_from_jsonl(SUP.audit_path, limit_finished=max(1, min(limit, 500)))
    allowed = {"completed", "stopped", "failed"}
    if status:
        norm = status.lower()
        if norm not in allowed:
            raise HTTPException(status_code=400, detail=f"Unsupported status '{status}'.")
        rows = [r for r in rows if str(r.get("status")) == norm]
    return {"audit": rows}


@app.get("/api/files")
async def api_files(limit: int = 500) -> dict[str, Any]:
    """Manifest-derived table plus filesystem existence checks."""
    cap = max(1, min(limit, 3000))
    rows, stats = summarize_files(PROJECT_ROOT)
    truncated = len(rows) > cap
    if truncated:
        rows = rows[:cap]
    return {"rows": rows, "stats": stats, "truncated": truncated}


@app.get("/api/summaries")
async def api_summaries(
    meeting_title: Optional[str] = Query(None, description="Case-insensitive substring filter"),
) -> dict[str, Any]:
    """Manifest + summary store joined and grouped by meeting display name."""
    return join_manifest_summaries(
        PROJECT_ROOT,
        meeting_title_filter=meeting_title,
    )


@app.get("/api/summarize/status")
async def api_summarize_status() -> dict[str, Any]:
    """Background batch job progress."""
    return SUMMARY_JOB.status()


@app.post("/api/summarize")
async def api_summarize(force: bool = False) -> dict[str, Any]:
    """Queue summarization for manifest files on disk without a stored summary."""
    try:
        return SUMMARY_JOB.summarize_pending(force=force)
    except RuntimeError as exc:
        if str(exc) == "summarize_already_running":
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/summarize/one")
async def api_summarize_one(
    saved_to: str = Query(..., description="Manifest ``saved_to`` path"),
    force: bool = False,
) -> dict[str, Any]:
    """Summarize a single manifest row by ``saved_to``."""
    try:
        record = SUMMARY_JOB.summarize_one(unquote(saved_to), force=force)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"ok": True, "record": record}


@app.get("/command", response_class=HTMLResponse)
async def command_portal(request: Request) -> HTMLResponse:
    """Unlisted ops portal (no auth in v1). Not linked from public UI."""
    return templates.TemplateResponse(
        request=request,
        name="command.html",
        context={},
    )


@app.get("/api/command")
async def api_command() -> dict[str, Any]:
    """JSON ops snapshot: caches, supervisor, API usage, redacted env."""
    return build_command_payload(
        PROJECT_ROOT,
        SUP,
        app=app,
        api_usage=API_USAGE,
        scraper_enabled=SCRAPER_ENABLED,
        summarize_job_status=SUMMARY_JOB.status(),
    )


@app.get("/api/overview")
async def api_overview(limit_audit: int = 80, file_limit: int = 600) -> dict[str, Any]:
    """Polling convenience bundle for dashboard refresh."""
    st = SUP.state()
    audits = audit_entries_from_jsonl(
        SUP.audit_path,
        limit_finished=max(1, min(limit_audit, 500)),
    )
    manifest_rows, stats = summarize_files(PROJECT_ROOT)
    fcap = max(1, min(file_limit, 3000))
    truncated = len(manifest_rows) > fcap
    if truncated:
        manifest_rows = manifest_rows[:fcap]

    summaries = join_manifest_summaries(PROJECT_ROOT)

    return {
        "state": {
            "running": st.running,
            "run_id": st.run_id,
            "pid": st.pid,
            "started_at": st.started_at,
        },
        "audit": audits,
        "manifest": {
            "rows": manifest_rows,
            "stats": stats,
            "truncated": truncated,
        },
        "summaries": summaries,
        "summarize_job": SUMMARY_JOB.status(),
        "paths": {
            "project_root": str(PROJECT_ROOT),
            "downloads": str(PROJECT_ROOT / "dallas_legistar_downloads"),
            "audit_log": str(SUP.audit_path),
            "summaries_store": str(PROJECT_ROOT / "scraper_dashboard_data" / "summaries.json"),
        },
    }

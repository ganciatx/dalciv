"""Civic data pages and Socrata-backed JSON APIs."""
from __future__ import annotations

from typing import Any, Optional, TYPE_CHECKING

import requests
from fastapi import HTTPException, Query, Request
from fastapi.responses import HTMLResponse

from ..campaign_finance import get_summary_payload, get_transactions_payload
from ..city_budget import (
    BULK_ROWS_LIMIT,
    get_bootstrap_payload as get_city_budget_bootstrap_payload,
    get_operating_payload,
    get_revenue_payload,
    get_rows_payload,
    get_summary_payload as get_city_budget_summary_payload,
    get_vendor_payload,
)
from ..council_accountability import (
    get_bootstrap_payload as get_council_bootstrap_payload,
    get_directory_payload,
    get_member_profile_payload,
)
from ..council_voting import get_agenda_item_payload
from ..council_voting import get_agenda_items_payload
from ..council_voting import get_summary_payload as get_voting_summary_payload
from ..council_voting import get_votes_payload
from ..lobbyist_registration import get_summary_payload as get_lobbyist_summary_payload
from ..police_calls import get_active_calls_payload
from ..registry import apps_by_type

if TYPE_CHECKING:
    from fastapi import FastAPI

    from .deps import RouteDeps


def _socrata_http_error(exc: requests.HTTPError) -> HTTPException:
    return HTTPException(
        status_code=502,
        detail=f"Upstream Socrata error: {exc}",
    )


def _register_jinja_page(
    app: FastAPI,
    deps: RouteDeps,
    entry: dict,
) -> None:
    route = str(entry["route"])
    template_name = str(entry["template"])
    slug = str(entry.get("slug", route.strip("/")))

    async def page(request: Request) -> HTMLResponse:
        return deps.templates.TemplateResponse(
            request=request,
            name=template_name,
            context={},
        )

    app.get(route, response_class=HTMLResponse, name=f"jinja:{slug}")(page)


def register(app: FastAPI, deps: RouteDeps) -> None:
    for entry in apps_by_type("jinja"):
        _register_jinja_page(app, deps, entry)
    root = deps.project_root

    @app.get("/api/campaign-finance/summary")
    async def api_campaign_finance_summary(
        refresh: bool = False,
        candidate: Optional[str] = None,
        kind: Optional[str] = None,
        record_type: Optional[str] = None,
        q: Optional[str] = None,
        lightweight: bool = False,
    ) -> dict[str, Any]:
        try:
            return get_summary_payload(
                root,
                force_refresh=refresh,
                candidate=candidate,
                kind=kind,
                record_type=record_type,
                q=q,
                lightweight=lightweight,
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
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
        try:
            return get_transactions_payload(
                root,
                force_refresh=refresh,
                candidate=candidate,
                kind=kind,
                record_type=record_type,
                q=q,
                limit=max(1, min(limit, 200)),
                offset=max(0, offset),
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.get("/api/council-voting/summary")
    async def api_council_voting_summary(
        refresh: bool = False,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        lightweight: bool = False,
    ) -> dict[str, Any]:
        try:
            return get_voting_summary_payload(
                root,
                force_refresh=refresh,
                from_date=from_date,
                to_date=to_date,
                lightweight=lightweight,
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
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
        try:
            return get_votes_payload(
                root,
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
            raise _socrata_http_error(exc) from exc
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
        try:
            return get_agenda_items_payload(
                root,
                force_refresh=refresh,
                q=q,
                from_date=from_date,
                to_date=to_date,
                limit=max(1, min(limit, 100)),
                offset=max(0, offset),
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.get("/api/council-voting/agenda-item")
    async def api_council_voting_agenda_item(
        roll_call_id: str = Query(..., description="Roll call id from agenda-items list"),
        refresh: bool = False,
    ) -> dict[str, Any]:
        if not roll_call_id.strip():
            raise HTTPException(status_code=400, detail="roll_call_id is required")
        try:
            payload = get_agenda_item_payload(
                root,
                roll_call_id.strip(),
                force_refresh=refresh,
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc
        if not payload.get("found"):
            raise HTTPException(status_code=404, detail="Roll call not found")
        return payload

    @app.get("/api/council-accountability/bootstrap")
    async def api_council_accountability_bootstrap(
        refresh_finance: bool = False,
        refresh_voting: bool = False,
    ) -> dict[str, Any]:
        try:
            return get_council_bootstrap_payload(
                root,
                force_refresh_finance=refresh_finance,
                force_refresh_voting=refresh_voting,
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.get("/api/council-accountability/directory")
    async def api_council_accountability_directory(
        refresh_finance: bool = False,
        refresh_voting: bool = False,
    ) -> dict[str, Any]:
        try:
            return get_directory_payload(
                root,
                force_refresh_finance=refresh_finance,
                force_refresh_voting=refresh_voting,
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
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
        if not member.strip():
            raise HTTPException(status_code=400, detail="member is required")
        try:
            return get_member_profile_payload(
                root,
                member.strip(),
                force_refresh_finance=refresh_finance,
                force_refresh_voting=refresh_voting,
                record_type=record_type,
                q=q,
                from_date=from_date,
                to_date=to_date,
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.get("/api/lobbyist-registration/summary")
    async def api_lobbyist_registration_summary(
        refresh: bool = False,
        member: Optional[str] = None,
        q: Optional[str] = None,
        limit: int = Query(50, ge=1, le=200),
        offset: int = Query(0, ge=0),
        lightweight: bool = False,
    ) -> dict[str, Any]:
        try:
            return get_lobbyist_summary_payload(
                root,
                force_refresh=refresh,
                member_id=member,
                q=q,
                limit=limit,
                offset=offset,
                lightweight=lightweight,
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.get("/api/city-budget/bootstrap")
    async def api_city_budget_bootstrap(
        refresh: bool = False,
        bfy: Optional[str] = None,
    ) -> dict[str, Any]:
        try:
            return get_city_budget_bootstrap_payload(
                root,
                force_refresh=refresh,
                bfy=bfy,
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

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
                root,
                force_refresh=refresh,
                refresh_revenue=refresh_revenue,
                refresh_operating=refresh_operating,
                bfy=bfy,
                ftyp=ftyp,
                fundtype=fundtype,
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
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
                root,
                force_refresh=refresh,
                bfy=bfy,
                ftyp=ftyp,
                fundtype=fundtype,
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
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
                root,
                force_refresh=refresh,
                bfy=bfy,
                ftyp=ftyp,
                fundtype=fundtype,
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.get("/api/city-budget/vendors")
    async def api_city_budget_vendors(
        refresh: bool = False,
        refresh_vendor: bool = False,
        bfy: Optional[str] = None,
    ) -> dict[str, Any]:
        try:
            return get_vendor_payload(
                root,
                force_refresh=refresh,
                refresh_vendor=refresh_vendor,
                bfy=bfy,
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
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
                root,
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
            raise _socrata_http_error(exc) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.get("/api/police/active-calls")
    async def api_police_active_calls(
        limit: int = 500,
        refresh: bool = False,
        geocode_budget: int = 0,
    ) -> dict[str, Any]:
        try:
            return get_active_calls_payload(
                root,
                limit=max(1, min(limit, 1000)),
                force_refresh=refresh,
                geocode_budget=max(0, min(geocode_budget, 40)),
            )
        except requests.HTTPError as exc:
            raise _socrata_http_error(exc) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

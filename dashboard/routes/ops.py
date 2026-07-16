"""Unlisted ops command portal."""
from __future__ import annotations

from typing import Any, TYPE_CHECKING

from fastapi import Depends, Request
from fastapi.responses import HTMLResponse

from ..command_center import build_command_payload
from ..ops_auth import (
    configured_ops_token,
    ops_token_accepted,
    require_ops_token,
)
from ..site_chrome import template_context

if TYPE_CHECKING:
    from fastapi import FastAPI

    from .deps import RouteDeps


def _command_unlock_response(
    request: Request,
    deps: RouteDeps,
    *,
    status_code: int,
    not_configured: bool,
) -> HTMLResponse:
    """HTML unlock page when GET /command is missing a valid ops token."""
    return deps.templates.TemplateResponse(
        request=request,
        name="command_unlock.html",
        context={"not_configured": not_configured},
        status_code=status_code,
    )


def register(app: FastAPI, deps: RouteDeps) -> None:
    ops_auth = Depends(require_ops_token)

    @app.get("/command", response_class=HTMLResponse)
    async def command_portal(request: Request) -> HTMLResponse:
        # Fail closed with unlock HTML instead of raw JSON 401/503.
        if not configured_ops_token():
            return _command_unlock_response(
                request, deps, status_code=503, not_configured=True
            )
        if not ops_token_accepted(request):
            return _command_unlock_response(
                request, deps, status_code=401, not_configured=False
            )
        return deps.templates.TemplateResponse(
            request=request,
            name="command.html",
            context=template_context(),
        )

    @app.get("/api/command", dependencies=[ops_auth])
    async def api_command() -> dict[str, Any]:
        return build_command_payload(
            deps.project_root,
            deps.supervisor,
            app=app,
            api_usage=deps.api_usage,
            scraper_enabled=deps.scraper_enabled,
            summarize_job_status=deps.summary_job.status(),
        )

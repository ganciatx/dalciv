"""Unlisted ops command portal."""
from __future__ import annotations

from typing import Any, TYPE_CHECKING

from fastapi import Request
from fastapi.responses import HTMLResponse

from ..command_center import build_command_payload

if TYPE_CHECKING:
    from fastapi import FastAPI

    from .deps import RouteDeps


def register(app: FastAPI, deps: RouteDeps) -> None:
    @app.get("/command", response_class=HTMLResponse)
    async def command_portal(request: Request) -> HTMLResponse:
        return deps.templates.TemplateResponse(
            request=request,
            name="command.html",
            context={},
        )

    @app.get("/api/command")
    async def api_command() -> dict[str, Any]:
        return build_command_payload(
            deps.project_root,
            deps.supervisor,
            app=app,
            api_usage=deps.api_usage,
            scraper_enabled=deps.scraper_enabled,
            summarize_job_status=deps.summary_job.status(),
        )

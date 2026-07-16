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

# Served when GET /command lacks a valid token (browser-friendly unlock).
_COMMAND_UNLOCK_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Command — unlock</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif;
      background: #0f172a; color: #e5e7eb; min-height: 100vh;
      display: grid; place-items: center; }
    form { width: min(24rem, 92vw); padding: 1.5rem; border: 1px solid #1f2937;
      border-radius: 0.5rem; background: #111827; }
    h1 { margin: 0 0 0.35rem; font-size: 1.125rem; }
    p { margin: 0 0 1rem; color: #9ca3af; font-size: 0.875rem; }
    label { display: block; font-size: 0.8125rem; margin-bottom: 0.35rem; }
    input { width: 100%; box-sizing: border-box; padding: 0.55rem 0.65rem;
      border-radius: 0.375rem; border: 1px solid #1f2937; background: #0f172a;
      color: #e5e7eb; }
    button { margin-top: 0.85rem; width: 100%; padding: 0.55rem;
      border-radius: 0.375rem; border: 0; background: #38bdf8; color: #0b1220;
      font-weight: 600; cursor: pointer; }
    .err { color: #f87171; font-size: 0.8125rem; margin-top: 0.75rem; }
  </style>
</head>
<body>
  <form id="unlock">
    <h1>Ops command</h1>
    <p>Enter the <code>OPS_API_TOKEN</code> to open the portal.</p>
    <label for="token">Ops token</label>
    <input id="token" name="token" type="password" autocomplete="current-password" required />
    <button type="submit">Unlock</button>
    <p class="err" id="err" hidden></p>
  </form>
  <script>
    const STORAGE_KEY = "sivic_ops_token";
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get("ops_token");
    if (fromUrl) sessionStorage.setItem(STORAGE_KEY, fromUrl);
    const err = document.getElementById("err");
    if (%(not_configured)s) {
      err.textContent = "Server is missing OPS_API_TOKEN — set it in the environment.";
      err.hidden = false;
    } else if (params.has("ops_token")) {
      err.textContent = "Token rejected. Check OPS_API_TOKEN and try again.";
      err.hidden = false;
    }
    document.getElementById("unlock").addEventListener("submit", (e) => {
      e.preventDefault();
      const token = document.getElementById("token").value.trim();
      sessionStorage.setItem(STORAGE_KEY, token);
      location.replace("/command?ops_token=" + encodeURIComponent(token));
    });
  </script>
</body>
</html>
"""


def register(app: FastAPI, deps: RouteDeps) -> None:
    ops_auth = Depends(require_ops_token)

    @app.get("/command", response_class=HTMLResponse)
    async def command_portal(request: Request) -> HTMLResponse:
        # Fail closed with a small unlock form instead of raw JSON 401.
        if not configured_ops_token():
            html = _COMMAND_UNLOCK_HTML % {"not_configured": "true"}
            return HTMLResponse(html, status_code=503)
        if not ops_token_accepted(request):
            html = _COMMAND_UNLOCK_HTML % {"not_configured": "false"}
            return HTMLResponse(html, status_code=401)
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

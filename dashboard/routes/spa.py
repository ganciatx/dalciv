"""Vite SPA page routes (from apps/registry.yaml)."""
from __future__ import annotations

import json
from typing import TYPE_CHECKING

from fastapi import HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse

from ..registry import spa_apps
from ..site_chrome import inject_site_chrome, template_context

if TYPE_CHECKING:
    from fastapi import FastAPI

    from .deps import RouteDeps


def _inject_bootstrap_html(html: str, bootstrap: dict) -> str:
    payload = json.dumps(bootstrap, separators=(",", ":"))
    script = f'<script id="ca-bootstrap">window.__CA_BOOTSTRAP__={payload};</script>'
    if "</head>" in html:
        return html.replace("</head>", f"{script}</head>", 1)
    return script + html


def _register_one(app: FastAPI, deps: RouteDeps, entry: dict) -> None:
    slug = str(entry["slug"])
    route = str(entry["route"])
    version = deps.spa_asset_versions.get(slug, 0)
    static_subdir = str(entry.get("static_dir", slug))

    if entry.get("serve_built_html"):
        built = deps.static_dir / static_subdir / "index.html"
        embed_bootstrap = entry.get("embed_bootstrap") is True

        if embed_bootstrap:
            from ..council_accountability import get_bootstrap_payload_cached

            async def built_page() -> HTMLResponse:
                if not built.is_file():
                    raise HTTPException(status_code=503, detail=f"{slug} frontend not built")
                html = built.read_text(encoding="utf-8")
                bootstrap = get_bootstrap_payload_cached(deps.project_root)
                html = _inject_bootstrap_html(html, bootstrap)
                if not entry.get("skip_site_chrome"):
                    html = inject_site_chrome(html)
                return HTMLResponse(
                    html,
                    headers={"Cache-Control": "no-cache"},
                )

            app.get(route, response_class=HTMLResponse, name=f"spa:{slug}")(built_page)
        else:
            async def built_page() -> HTMLResponse:
                if not built.is_file():
                    raise HTTPException(status_code=503, detail=f"{slug} frontend not built")
                html = built.read_text(encoding="utf-8")
                if not entry.get("skip_site_chrome"):
                    html = inject_site_chrome(html)
                return HTMLResponse(
                    html,
                    headers={"Cache-Control": "no-cache"},
                )

            app.get(route, response_class=HTMLResponse, name=f"spa:{slug}")(built_page)
    else:
        template_name = str(entry["template"])

        async def spa_page(request: Request) -> HTMLResponse:
            return deps.templates.TemplateResponse(
                request=request,
                name=template_name,
                context=template_context({"asset_version": version}),
            )

        app.get(route, response_class=HTMLResponse, name=f"spa:{slug}")(spa_page)

    for legacy in entry.get("legacy_routes") or []:
        async def legacy_redirect(
            _canonical: str = route,
        ) -> RedirectResponse:
            return RedirectResponse(url=_canonical, status_code=308)

        app.get(str(legacy), include_in_schema=False)(legacy_redirect)


def register(app: FastAPI, deps: RouteDeps) -> None:
    for entry in spa_apps():
        _register_one(app, deps, entry)

"""Vite SPA page routes (from apps/registry.yaml)."""
from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse

from ..registry import spa_apps

if TYPE_CHECKING:
    from fastapi import FastAPI

    from .deps import RouteDeps


def _register_one(app: FastAPI, deps: RouteDeps, entry: dict) -> None:
    slug = str(entry["slug"])
    route = str(entry["route"])
    version = deps.spa_asset_versions.get(slug, 0)
    static_subdir = str(entry.get("static_dir", slug))

    if entry.get("serve_built_html"):
        built = deps.static_dir / static_subdir / "index.html"

        async def built_page() -> FileResponse:
            if not built.is_file():
                raise HTTPException(status_code=503, detail=f"{slug} frontend not built")
            return FileResponse(
                built,
                headers={"Cache-Control": "no-cache"},
            )

        app.get(route, response_class=HTMLResponse, name=f"spa:{slug}")(built_page)
    else:
        template_name = str(entry["template"])

        async def spa_page(request: Request) -> HTMLResponse:
            return deps.templates.TemplateResponse(
                request=request,
                name=template_name,
                context={"asset_version": version},
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

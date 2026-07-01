"""Portfolio static export routes (Next.js → dashboard/static/portfolio-site/)."""
from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse

from ..portfolio_site import (
    portfolio_apps,
    portfolio_asset,
    portfolio_blog_index,
    portfolio_blog_post,
    portfolio_enabled,
    portfolio_index,
    portfolio_root_asset,
    portfolio_side_projects_redirect,
)
from ..site_chrome import template_context

if TYPE_CHECKING:
    from fastapi import FastAPI

    from .deps import RouteDeps


def register(app: FastAPI, deps: RouteDeps) -> None:
    @app.get("/", response_model=None)
    async def home(request: Request):
        if portfolio_enabled():
            return portfolio_index()
        return deps.templates.TemplateResponse(
            request=request,
            name="home.html",
            context=template_context(),
        )

    @app.get("/apps", response_class=HTMLResponse)
    async def portfolio_apps_page() -> FileResponse:
        if not portfolio_enabled():
            raise HTTPException(status_code=404, detail="Not found")
        return portfolio_apps()

    @app.get("/apps/{asset:path}", response_class=HTMLResponse)
    async def portfolio_apps_asset(asset: str) -> FileResponse:
        if not portfolio_enabled():
            raise HTTPException(status_code=404, detail="Not found")
        if asset in ("", "index.html"):
            return portfolio_apps()
        return portfolio_asset(f"apps/{asset}")

    @app.get("/side-projects", include_in_schema=False)
    async def portfolio_side_projects_alias() -> RedirectResponse:
        return portfolio_side_projects_redirect()

    @app.get("/blog", response_class=HTMLResponse)
    async def portfolio_blog_page() -> FileResponse:
        if not portfolio_enabled():
            raise HTTPException(status_code=404, detail="Not found")
        return portfolio_blog_index()

    @app.get("/blog/{slug}", response_class=HTMLResponse)
    async def portfolio_blog_article(slug: str) -> FileResponse:
        if not portfolio_enabled():
            raise HTTPException(status_code=404, detail="Not found")
        return portfolio_blog_post(slug)

    @app.get("/favicon.ico", include_in_schema=False)
    async def portfolio_favicon() -> FileResponse:
        if not portfolio_enabled():
            raise HTTPException(status_code=404, detail="Not found")
        return portfolio_asset("favicon.ico")

    # Portfolio public assets — registered last so DalCiv routes take precedence.
    @app.get("/public/{asset:path}", include_in_schema=False)
    async def portfolio_public_asset(asset: str) -> FileResponse:
        if not portfolio_enabled():
            raise HTTPException(status_code=404, detail="Not found")
        return portfolio_asset(asset)

    @app.get("/{filename}", include_in_schema=False)
    async def portfolio_root_file(filename: str) -> FileResponse:
        if not portfolio_enabled():
            raise HTTPException(status_code=404, detail="Not found")
        return portfolio_root_asset(filename)

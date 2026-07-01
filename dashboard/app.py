"""
FastAPI UI for supervising the Dallas Legistar scraper.

Local dev binds ``127.0.0.1``; production (Hostinger VPS Docker) uses ``0.0.0.0``.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles

from .portfolio_site import portfolio_enabled
from .routes.deps import RouteDeps, register_all_routes

PROJECT_ROOT = Path(__file__).resolve().parents[1]
ROUTE_DEPS = RouteDeps()


@asynccontextmanager
async def _app_lifespan(_app: FastAPI):
    from .data_sync import start_scheduler, stop_scheduler

    start_scheduler(PROJECT_ROOT)
    yield
    stop_scheduler()


app = FastAPI(
    title="Legistar Scraper Dashboard",
    docs_url=None,
    redoc_url=None,
    lifespan=_app_lifespan,
)

_static_dir = ROUTE_DEPS.static_dir
if _static_dir.is_dir():
    app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")

_portfolio_root = _static_dir / "portfolio-site"
if portfolio_enabled():
    _portfolio_next = _portfolio_root / "_next"
    if _portfolio_next.is_dir():
        app.mount(
            "/_next",
            StaticFiles(directory=str(_portfolio_next)),
            name="portfolio-next",
        )

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
    ROUTE_DEPS.api_usage.record(request.method, request.url.path)
    return response


register_all_routes(app, ROUTE_DEPS)

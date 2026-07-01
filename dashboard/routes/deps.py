"""Shared FastAPI route dependencies."""
from __future__ import annotations

import os
from pathlib import Path
from typing import TYPE_CHECKING

from fastapi.templating import Jinja2Templates

from ..command_center import ApiUsageTracker
from ..registry import spa_asset_versions
from ..summaries import SummaryJob
from ..supervisor import ScraperSupervisor

if TYPE_CHECKING:
    from fastapi import FastAPI

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DASHBOARD_DIR = Path(__file__).resolve().parents[1]
STATIC_DIR = DASHBOARD_DIR / "static"

SUP = ScraperSupervisor(PROJECT_ROOT)
SUMMARY_JOB = SummaryJob(PROJECT_ROOT)
API_USAGE = ApiUsageTracker()

SCRAPER_ENABLED = os.environ.get("SCRAPER_ENABLED", "1").strip().lower() in (
    "1",
    "true",
    "yes",
    "on",
)

templates = Jinja2Templates(directory=str(DASHBOARD_DIR / "templates"))

SPA_ASSET_VERSIONS = spa_asset_versions()


class RouteDeps:
    """Bundle passed to route registration functions."""

    __slots__ = (
        "project_root",
        "static_dir",
        "templates",
        "supervisor",
        "summary_job",
        "api_usage",
        "scraper_enabled",
        "spa_asset_versions",
    )

    def __init__(self) -> None:
        self.project_root = PROJECT_ROOT
        self.static_dir = STATIC_DIR
        self.templates = templates
        self.supervisor = SUP
        self.summary_job = SUMMARY_JOB
        self.api_usage = API_USAGE
        self.scraper_enabled = SCRAPER_ENABLED
        self.spa_asset_versions = SPA_ASSET_VERSIONS


def register_all_routes(app: FastAPI, deps: RouteDeps | None = None) -> None:
    """Attach all route modules to the FastAPI app."""
    from . import civic, ops, portfolio, scraper, spa

    deps = deps or RouteDeps()
    civic.register(app, deps)
    spa.register(app, deps)
    scraper.register(app, deps)
    ops.register(app, deps)
    portfolio.register(app, deps)  # last: catch-all portfolio assets

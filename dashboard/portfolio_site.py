"""
Serve the static Next.js portfolio export at the site root.

Build output lives in ``dashboard/static/portfolio-site/`` (produced by
``npm run build`` in ``portfolio/`` during the Docker image build).

Next.js 16 static export uses flat ``*.html`` files (e.g. ``apps.html``)
rather than per-route ``index.html`` directories.
"""
from __future__ import annotations

from pathlib import Path

from fastapi import HTTPException
from fastapi.responses import FileResponse, RedirectResponse

_PORTFOLIO_ROOT = Path(__file__).parent / "static" / "portfolio-site"


def portfolio_enabled() -> bool:
    """True when a static export is present on disk."""
    return (_PORTFOLIO_ROOT / "index.html").is_file()


def _portfolio_file(*parts: str) -> Path:
    path = _PORTFOLIO_ROOT.joinpath(*parts)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return path


def portfolio_index() -> FileResponse:
    return FileResponse(_portfolio_file("index.html"), media_type="text/html")


def portfolio_apps() -> FileResponse:
    return FileResponse(_portfolio_file("apps.html"), media_type="text/html")


def portfolio_blog_index() -> FileResponse:
    return FileResponse(_portfolio_file("blog.html"), media_type="text/html")


def portfolio_blog_post(slug: str) -> FileResponse:
    safe = slug.strip("/")
    if not safe or "/" in safe or ".." in safe:
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(
        _portfolio_file("blog", f"{safe}.html"),
        media_type="text/html",
    )


def portfolio_side_projects_redirect() -> RedirectResponse:
    return RedirectResponse(url="/apps", status_code=308)


def portfolio_asset(path: str) -> FileResponse:
    """Serve exported public files (favicon, app screenshots, etc.)."""
    safe = path.strip("/")
    if not safe or ".." in safe:
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(_portfolio_file(*safe.split("/")))


def portfolio_root_asset(filename: str) -> FileResponse:
    """Serve a single file from the export root (Next.js public/ folder)."""
    safe = filename.strip("/")
    if not safe or "/" in safe or ".." in safe or "." not in safe:
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(_portfolio_file(safe))

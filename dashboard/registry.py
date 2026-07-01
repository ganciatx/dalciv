"""Load apps/registry.yaml and resolve SPA asset versions."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

PROJECT_ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = PROJECT_ROOT / "apps" / "registry.yaml"
STATIC_DIR = Path(__file__).parent / "static"


@lru_cache(maxsize=1)
def load_registry() -> dict[str, Any]:
    if not REGISTRY_PATH.is_file():
        return {"apps": []}
    with REGISTRY_PATH.open(encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    return data if isinstance(data, dict) else {"apps": []}


def registry_apps() -> list[dict[str, Any]]:
    apps = load_registry().get("apps", [])
    return apps if isinstance(apps, list) else []


def apps_by_type(app_type: str) -> list[dict[str, Any]]:
    return [a for a in registry_apps() if a.get("type") == app_type]


def spa_apps() -> list[dict[str, Any]]:
    return apps_by_type("vite-spa")


def catalog_apps() -> list[dict[str, Any]]:
    """Apps with portfolio catalog metadata."""
    out: list[dict[str, Any]] = []
    for app in registry_apps():
        catalog = app.get("catalog")
        if not isinstance(catalog, dict):
            continue
        slug = str(app.get("slug", ""))
        route = str(app.get("route", f"/{slug}"))
        out.append(
            {
                "slug": slug,
                "name": app.get("name", slug),
                "description": catalog.get("description", ""),
                "url": route,
                "emoji": catalog.get("emoji", ""),
                "image": catalog.get("image"),
                "tags": catalog.get("tags", []),
                "featured": bool(catalog.get("featured", False)),
                **(
                    {"external": True}
                    if catalog.get("external") or app.get("type") == "external"
                    else {}
                ),
            }
        )
    return out


def docker_build_apps() -> list[dict[str, Any]]:
    """Frontend packages included in the production Docker image."""
    return [
        a
        for a in registry_apps()
        if a.get("docker") and a.get("source_dir") and a.get("build")
    ]


def spa_asset_version(static_subdir: str, *extra_rels: str) -> int:
    """Cache-bust query param from built JS mtime (+ optional data files)."""
    stamps: list[int] = []
    for rel in (
        f"{static_subdir}/assets/index.js",
        f"{static_subdir}/index.html",
    ):
        path = STATIC_DIR / rel
        if path.is_file():
            stamps.append(int(path.stat().st_mtime))
    for rel in extra_rels:
        path = STATIC_DIR / rel
        if path.is_file():
            stamps.append(int(path.stat().st_mtime))
    return max(stamps) if stamps else 0


def spa_asset_versions() -> dict[str, int]:
    versions: dict[str, int] = {}
    for app in spa_apps():
        slug = str(app.get("slug", ""))
        static_dir = str(app.get("static_dir", slug))
        extra: tuple[str, ...] = ()
        if slug == "city-budget":
            extra = (
                "city-budget/data/revsource-display-map.json",
            )
        versions[slug] = spa_asset_version(static_dir, *extra)
    return versions

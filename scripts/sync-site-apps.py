#!/usr/bin/env python3
"""Sync portfolio catalog apps from apps/registry.yaml → portfolio/content/site.yaml."""
from __future__ import annotations

from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "apps" / "registry.yaml"
SITE = ROOT / "portfolio" / "content" / "site.yaml"


def main() -> None:
    registry = yaml.safe_load(REGISTRY.read_text(encoding="utf-8"))
    site = yaml.safe_load(SITE.read_text(encoding="utf-8"))

    apps = []
    for app in registry.get("apps", []):
        # public: false keeps source in-repo but omits from the live catalog.
        if app.get("public") is False:
            continue
        catalog = app.get("catalog")
        if not isinstance(catalog, dict):
            continue
        entry = {
            "slug": app["slug"],
            "name": app["name"],
            "description": str(catalog.get("description", "")).strip(),
            "url": app["route"],
            "emoji": catalog.get("emoji", ""),
            "tags": catalog.get("tags", []),
            "featured": bool(catalog.get("featured")),
        }
        if catalog.get("image"):
            entry["image"] = catalog["image"]
        if catalog.get("external") or app.get("type") == "external":
            entry["external"] = True
        apps.append(entry)

    site["apps"] = apps
    SITE.write_text(yaml.dump(site, sort_keys=False, allow_unicode=True), encoding="utf-8")
    print(f"Synced {len(apps)} catalog apps → {SITE}")


if __name__ == "__main__":
    main()

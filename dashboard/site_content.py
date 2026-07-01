"""Load portfolio site content for shared header/footer chrome."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SITE_YAML = PROJECT_ROOT / "portfolio" / "content" / "site.yaml"


@lru_cache(maxsize=1)
def get_site_config() -> dict[str, Any]:
    """Return the ``site`` block from portfolio/content/site.yaml."""
    if not SITE_YAML.is_file():
        return _fallback_site_config()
    data = yaml.safe_load(SITE_YAML.read_text(encoding="utf-8")) or {}
    site = data.get("site")
    if not isinstance(site, dict):
        return _fallback_site_config()
    social = site.get("social") if isinstance(site.get("social"), dict) else {}
    return {
        "name": str(site.get("name") or "Jackson E."),
        "title": str(site.get("title") or ""),
        "email": str(site.get("email") or "hello@example.com"),
        "social": {
            "linkedin": social.get("linkedin") or "",
            "github": social.get("github") or "",
            "twitter": social.get("twitter") or "",
        },
    }


def site_brand_short(site: dict[str, Any] | None = None) -> str:
    """First token of site name — matches portfolio Header brand link."""
    name = (site or get_site_config()).get("name", "Jackson E.")
    return str(name).split(" ")[0]


def _fallback_site_config() -> dict[str, Any]:
    return {
        "name": "Jackson E.",
        "title": "Product Manager & Maker",
        "email": "hello@example.com",
        "social": {"linkedin": "", "github": "", "twitter": ""},
    }

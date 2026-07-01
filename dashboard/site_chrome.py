"""Render and inject portfolio-style site chrome into HTML shells."""
from __future__ import annotations

import re
from datetime import datetime, timezone
from html import escape
from typing import Any

from .site_content import get_site_config, site_brand_short

_CHROME_CSS = '<link rel="stylesheet" href="/static/site-chrome.css" />'
_CHROME_FONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com" />'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />'
    '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet" />'
)
_BODY_TAG = re.compile(r"<body([^>]*)>", re.IGNORECASE)


def template_context(extra: dict[str, Any] | None = None) -> dict[str, Any]:
    """Base Jinja context shared by every app shell."""
    ctx: dict[str, Any] = {
        "site": get_site_config(),
        "year": datetime.now(timezone.utc).year,
    }
    if extra:
        ctx.update(extra)
    return ctx


def render_site_header(site: dict[str, Any] | None = None) -> str:
    """Static HTML header matching portfolio Header.tsx."""
    cfg = site or get_site_config()
    brand = escape(site_brand_short(cfg))
    email = escape(str(cfg.get("email") or ""))
    return f"""<header class="site-header" role="banner">
  <div class="site-header__inner">
    <a class="site-header__brand" href="/">{brand}</a>
    <nav class="site-header__nav" aria-label="Site">
      <a class="site-header__link" href="/">Home</a>
      <a class="site-header__link" href="/side-projects">Side Projects</a>
      <a class="site-header__link" href="/blog">Blog</a>
      <a class="site-header__cta" href="mailto:{email}">Contact</a>
    </nav>
  </div>
</header>"""


def render_site_footer(site: dict[str, Any] | None = None, year: int | None = None) -> str:
    """Static HTML footer matching portfolio Footer.tsx."""
    cfg = site or get_site_config()
    yr = year if year is not None else datetime.now(timezone.utc).year
    name = escape(str(cfg.get("name") or ""))
    social = cfg.get("social") if isinstance(cfg.get("social"), dict) else {}
    links: list[str] = []
    for label, key in (("LinkedIn", "linkedin"), ("GitHub", "github"), ("Twitter", "twitter")):
        url = social.get(key)
        if url:
            links.append(
                f'<a class="site-footer__link" href="{escape(str(url))}" '
                f'target="_blank" rel="noopener noreferrer">{label}</a>'
            )
    links.append('<a class="site-footer__link" href="/apps">Side Projects</a>')
    links.append('<a class="site-footer__link" href="/blog">Blog</a>')
    joined = "\n      ".join(links)
    return f"""<footer class="site-footer" role="contentinfo">
  <div class="site-footer__inner">
    <p class="site-footer__copy">&copy; {yr} {name}. All rights reserved.</p>
    <div class="site-footer__links">
      {joined}
    </div>
  </div>
</footer>"""


def _ensure_body_class(html: str) -> str:
    if "site-chrome-body" in html:
        return html

    def repl(match: re.Match[str]) -> str:
        attrs = match.group(1) or ""
        if re.search(r'\bclass="', attrs, re.IGNORECASE):
            return f'<body{attrs.replace("class=\"", "class=\"site-chrome-body ", 1)}>'
        return f'<body{attrs} class="site-chrome-body">'

    return _BODY_TAG.sub(repl, html, count=1)


def inject_site_chrome(html: str, site: dict[str, Any] | None = None) -> str:
    """
    Wrap a built SPA document with global header/footer and shared CSS.

    - Adds site-chrome.css + Geist font to <head>
    - Adds ``site-chrome-body`` class on <body>
    - Inserts header after <body> and footer before </body>
    """
    if 'class="site-header"' in html:
        return html

    cfg = site or get_site_config()
    out = html
    head_assets = _CHROME_FONTS + _CHROME_CSS
    if "</head>" in out and "site-chrome.css" not in out:
        out = out.replace("</head>", f"{head_assets}</head>", 1)
    out = _ensure_body_class(out)

    header = render_site_header(cfg)
    footer = render_site_footer(cfg)
    match = _BODY_TAG.search(out)
    if not match:
        return out
    body_open_end = match.end()
    out = (
        out[:body_open_end]
        + "\n"
        + header
        + '\n<main class="site-chrome-main">\n'
        + out[body_open_end:]
    )
    if "</body>" in out:
        out = out.replace("</body>", f"</main>\n{footer}\n</body>", 1)
    return out

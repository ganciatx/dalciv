# Global Site Chrome Plan

**Overall Progress:** `100%`

## TLDR

Add portfolio-style global header and footer to every DalCiv app shell. Portfolio (Next.js) already ships its own chrome; all other apps get shared Jinja partials + CSS, with server-side injection for built SPAs (`council-accountability`).

## Tasks

- [x] 🟩 **Step 1: Site config loader** — Read `portfolio/content/site.yaml` in Python
- [x] 🟩 **Step 2: Shared assets** — `site-chrome.css`, header/footer partials, `app_shell.html` layout
- [x] 🟩 **Step 3: Template context** — Pass `site` into all Jinja `TemplateResponse` calls
- [x] 🟩 **Step 4: Vite SPA shells** — Extend `app_shell.html` (budget sim, crossword, timer, city budget)
- [x] 🟩 **Step 5: Jinja apps** — Police map, DalCiv portal, scraper, command
- [x] 🟩 **Step 6: Built SPA injection** — `spa.py` injects chrome into `council-accountability` HTML
- [x] 🟩 **Step 7: Tests** — Site config + HTML injection coverage

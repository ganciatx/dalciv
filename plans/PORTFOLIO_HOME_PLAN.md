# Portfolio Home + DalCiv Side Projects

**Overall Progress:** `100%`

## TLDR

Serve the Next.js portfolio as the site home page (`/`) via static export in FastAPI. DalCiv civic apps are cataloged as **Side Projects** on `/apps` with same-origin links. Legacy app grid moves to `/dalciv`.

## Critical Decisions

- **Static export, single container** — `portfolio` builds to `dashboard/static/portfolio-site/`; no extra Caddy service.
- **Fallback** — If export is missing, `GET /` serves legacy `home.html`.
- **Relative app URLs** — Side project cards link to `/city-budget-simulator`, `/police`, etc.; Tally stays external.
- **Legacy portal** — `GET /dalciv` keeps the old DalCiv grid for bookmarks.

## Tasks

- [x] 🟩 **Step 1: Static export** — `output: "export"` in `portfolio/next.config.ts`, sync script
- [x] 🟩 **Step 2: FastAPI routes** — `dashboard/portfolio_site.py` + routes in `app.py`
- [x] 🟩 **Step 3: DalCiv catalog** — `content.ts` with all live apps as side projects
- [x] 🟩 **Step 4: Nav + cards** — Side Projects label, internal vs external links
- [x] 🟩 **Step 5: Docker build** — Multi-stage portfolio build in `Dockerfile`
- [x] 🟩 **Step 6: Legacy `/dalciv`** — Old portal preserved off root

# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Take **Council Accountability** and **Meeting Recap** off the live Hostinger site without deleting source. Keep `council-accountability/`, `meeting-recap/`, Python modules, templates, and local static builds in the repo; stop registering public routes, drop them from the portfolio catalog, and exclude their built assets from the Docker image.

## Critical Decisions

- **Decision 1: Unpublish via registry flags, do not delete apps** — Set `docker: false` and `public: false` on both entries in `apps/registry.yaml`. Source dirs, `dashboard/*.py` modules, templates, and git-tracked static builds stay. Flip flags later to re-enable.
- **Decision 2: Exclude from image, not from git** — Remove the Dockerfile `council-accountability-build` stage; add `.dockerignore` rules for `dashboard/static/council-accountability` and `dashboard/static/meeting-recap` so `COPY dashboard` does not ship them to Hostinger. Do not `git rm` those static trees.
- **Decision 3: Page routes off; APIs left alone for now** — Skip SPA route registration (and `/campaign-finance` redirect) when `public: false`. Leave `/api/council-accountability/*` and `/api/meeting-recap/*` in `civic.py` unless a follow-up asks to gate them — they will be unlinked from the UI/catalog.
- **Decision 4: Catalog + hard links** — Drop catalog blocks (or skip when `public: false`) and re-sync `portfolio/content/site.yaml`. Remove hardcoded cards/links in `home.html` and `index.html`.

## Tasks:

- [x] 🟩 **Step 1: Mark apps unpublished in registry**
  - [x] 🟩 Set `docker: false` and `public: false` on `meeting-recap` and `council-accountability` in `apps/registry.yaml`
  - [x] 🟩 Teach `catalog_apps()` / `scripts/sync-site-apps.py` to skip `public: false` (or remove their `catalog:` blocks)
  - [x] 🟩 Teach `spa_apps()` (or `spa.py`) to skip route registration when `public: false`
  - [x] 🟩 Re-sync `portfolio/content/site.yaml` so both apps disappear from the portfolio catalog

- [x] 🟩 **Step 2: Keep them out of the Hostinger image**
  - [x] 🟩 Remove `council-accountability-build` stage and its `COPY --from=...` from `Dockerfile`
  - [x] 🟩 Add `.dockerignore` entries for `dashboard/static/meeting-recap` and `dashboard/static/council-accountability`
  - [x] 🟩 Confirm `docker_build_apps()` / any Dockerfile docs still match (no meeting-recap or council-accountability stages)

- [x] 🟩 **Step 3: Remove public navigation affordances**
  - [x] 🟩 Remove Council Accountability app card from `dashboard/templates/home.html`
  - [x] 🟩 Remove Council Accountability link from `dashboard/templates/index.html`
  - [x] 🟩 Spot-check portfolio/landing copy for leftover mentions (optional one-liners only if they deep-link to the apps)

- [x] 🟩 **Step 4: Tests + deploy verification**
  - [x] 🟩 Adjust or skip route tests that expect `/council-accountability` / `/meeting-recap` 200 when `public: false`
  - [x] 🟩 Local smoke: those paths 404; other apps still load; static trees still exist in the repo
  - [ ] 🟨 After merge to `main`/`master`: confirm Hostinger deploy; `/council-accountability`, `/meeting-recap`, `/campaign-finance`, and `/static/meeting-recap/*` / `/static/council-accountability/*` are not live

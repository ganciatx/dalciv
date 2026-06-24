# Crossword Constructor — DalCiv Migration Plan

**Overall Progress:** `100%`

## TLDR

Migrate **Crosscreate** (Vite + React crossword builder on Desktop) into the DalCiv monorepo so it ships on **`https://ganciatx.com/crossword-constructor`**. Follow the same pattern as City Budget Simulator and Time Timer: Vite subproject → static bundle under `dashboard/static/` → FastAPI route + Jinja shell. No separate subdomain or Node server in production for v1.

## Critical Decisions

- **Path slug `/crossword-constructor`** — Matches the existing package name; same-origin with portfolio and other side projects.
- **Vite subproject in-repo** — Copy/move `~/Desktop/Crosscreate` into `crossword-constructor/` at repo root (not a git submodule).
- **Static bundle + FastAPI shell** — Production serves built JS/CSS from `/static/crossword-constructor/`; `GET /crossword-constructor` returns a thin HTML template (same as `time_timer.html`).
- **Vite `base` path** — Production `base: '/static/crossword-constructor/'`; dev stays `/` with optional auth proxy.
- **Auth deferred to v2** — Express `@auth/express` server is optional today; `AuthButton` hides when no providers. Ship v1 without OAuth; puzzles stay in IndexedDB either way.
- **No React Router changes** — App uses Zustand workspace state (`home` | `grid` | `words` | `clues`); no `basename` wiring needed.
- **Docker build step** — Add a Node build stage in root `Dockerfile` (like portfolio) so VPS deploy includes the bundle.

## Tasks

- [x] 🟩 **Step 1: Import subproject**
  - [x] 🟩 Copy Crosscreate into `crossword-constructor/` (exclude `node_modules/`, `dist/`, `.env.local`)
  - [x] 🟩 Confirm `package.json` scripts: `dev`, `build`, `test` work from new location
  - [x] 🟩 Add `crossword-constructor/` to repo `.gitignore` exclusions only where needed (keep source, ignore local env)

- [x] 🟩 **Step 2: Vite build integration**
  - [x] 🟩 Update `vite.config.ts`: `outDir` → `../dashboard/static/crossword-constructor`, production `base: '/static/crossword-constructor/'`
  - [x] 🟩 Stable asset names in `rollupOptions.output` (match time-timer / city-budget-simulator)
  - [x] 🟩 Fix root-absolute paths to use `import.meta.env.BASE_URL`:
    - `src/lib/wordDb.ts` — `/data/words.json`
    - `index.html` — favicon and any other `/…` references
  - [x] 🟩 Run `npm run build` and verify `dashboard/static/crossword-constructor/data/words.json` exists (~868 KB)

- [x] 🟩 **Step 3: FastAPI route + template**
  - [x] 🟩 Add `dashboard/templates/crossword_constructor.html` (mirror `time_timer.html` asset links)
  - [x] 🟩 Add `CROSSWORD_CONSTRUCTOR_ASSET_VERSION` + `GET /crossword-constructor` in `dashboard/app.py`
  - [x] 🟩 Register route before portfolio catch-alls; confirm `/static/crossword-constructor/*` serves via existing `StaticFiles` mount

- [x] 🟩 **Step 4: Portal & catalog**
  - [x] 🟩 Add app card to `dashboard/templates/home.html` (`/dalciv` legacy grid)
  - [x] 🟩 Add entry to `portfolio/src/lib/content.ts` (name, description, `/crossword-constructor`, emoji/tags)
  - [x] 🟩 Add module entry in `dashboard/command_center.py` (`ui_path: /crossword-constructor`)
  - [x] 🟩 Rebuild portfolio static export so `/apps` includes the new card

- [x] 🟩 **Step 5: Docker & deploy**
  - [x] 🟩 Add `crossword-constructor` build stage to root `Dockerfile` (`npm ci && npm run build`)
  - [x] 🟩 Document build command in root `README.md` (local dev: `cd crossword-constructor && npm run dev`)
  - [ ] 🟥 Deploy via existing VPS workflow (`docker compose up -d --build` or Hostinger MCP)

- [x] 🟩 **Step 6: Verify end-to-end**
  - [x] 🟥 Local: `python -m dashboard` → `http://127.0.0.1:8765/crossword-constructor` loads landing + editor
  - [x] 🟩 Word list loads (no 404 on `words.json`); grid create/open/save/export works
  - [x] 🟩 `npm test` in `crossword-constructor/` passes
  - [ ] 🟥 Production: `https://ganciatx.com/crossword-constructor` over HTTPS; portfolio `/apps` link works

## Out of scope (v1)

- OAuth / `/auth/*` on DalCiv (optional follow-up: FastAPI proxy to Node sidecar or Python Authlib)
- Subdomain deploy (e.g. `crossword.ganciatx.com`)
- Backend API beyond existing client-side IndexedDB + public dictionary fetch

## Reference pattern

City Budget Simulator integration: `city-budget-simulator/vite.config.ts`, `dashboard/templates/city_budget_simulator.html`, `dashboard/app.py` route at `/city-budget-simulator`.

# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Add a **second dashboard page** with a **Leaflet map** of [Dallas Police Active Calls](https://www.dallasopendata.com/Public-Safety/Dallas-Police-Active-Calls/9fxf-t2tr/data_preview), fed by the public **Socrata SODA API** ([endpoint docs](https://dev.socrata.com/docs/endpoints)). Calls refresh on a ~2-minute cadence (per dataset metadata); the UI polls via a local FastAPI proxy so the browser never hits Socrata directly.

## Critical Decisions

- **Decision 1: SODA 2.x resource API for v1** — Use `GET https://www.dallasopendata.com/resource/9fxf-t2tr.json` with SoQL (`$limit`, `$order`, `$where`) — works without app token for this public dataset. Defer SODA 3.0 `POST /api/v3/views/9fxf-t2tr/query.json` until token/auth is required ([Socrata versioning](https://dev.socrata.com/docs/endpoints)).

- **Decision 2: Server-side proxy + cache** — New `dashboard/police_calls.py` fetches upstream, normalizes rows, geocodes, and exposes `GET /api/police/active-calls`. Keeps CORS/simple client logic aligned with existing `127.0.0.1` dashboard pattern.

- **Decision 3: Geocoding required (no lat/lon in source)** — Dataset columns are text only (`block`, `location`, `division`, `nature_of_call`, `priority`, `status`, etc.). Build display address as `"{block} {location}, Dallas, TX"`, geocode via **Nominatim** (or similar) with **disk/json cache** keyed by `block|location` to respect rate limits. Rows that fail geocode still appear in the **sidebar list** but not on the map.

- **Decision 4: Map stack** — **Leaflet** + **OpenStreetMap** tiles via CDN in `dashboard/templates/police_map.html` (no new npm build). Marker color by `priority` (1 urgent → 4 low). Popup: incident #, nature, division, unit, status, time.

- **Decision 5: Refresh cadence** — Poll proxy every **90s** while page visible (dataset documents ~2 min updates). Show `last_fetched_at` + row count + geocode hit rate in UI header.

## Tasks:

- [x] 🟩 **Step 1: Socrata client module**
  - [x] 🟩 `dashboard/police_calls.py`: `fetch_active_calls(limit=500)` → SODA resource + `$order=time DESC`.
  - [x] 🟩 Normalize to stable JSON schema (`id`, `address`, fields, `lat`, `lon`, `geocode_status`).
  - [x] 🟩 Optional env `SOCRATA_APP_TOKEN` header.

- [x] 🟩 **Step 2: Geocoding + cache**
  - [x] 🟩 `geocode_address()` + `scraper_dashboard_data/geocode_cache.json`.
  - [x] 🟩 Throttle 1 req/sec; max 25 new geocodes per API request.
  - [x] 🟩 Dallas bounding-box sanity check.

- [x] 🟩 **Step 3: API routes**
  - [x] 🟩 `GET /police` → `police_map.html`.
  - [x] 🟩 `GET /api/police/active-calls`.
  - [x] 🟩 “Police map” link on `index.html`.

- [x] 🟩 **Step 4: Map UI**
  - [x] 🟩 Full-height map + sidebar (division/priority filters).
  - [x] 🟩 Leaflet markers + popups; fit bounds; Dallas default center.
  - [x] 🟩 Poll every 90s; refresh spinner in header.
  - [x] 🟩 Attribution footer (Dallas Open Data, OSM, Nominatim).

- [x] 🟩 **Step 5: Docs**
  - [x] 🟩 `README.md` + `CHANGELOG.md` updated.

## Out of scope (this plan)

- Historical call archive / time slider.
- Push notifications or WebSockets (polling only).
- SODA 3.0 migration + authenticated export pipeline.
- Mobile-native app or public internet deployment beyond localhost.
- Merging police layer with Legistar scrape data.

## Acceptance criteria

1. `/police` loads a map centered on Dallas with **≥1 marker** when upstream has active calls. ✅
2. Sidebar lists all fetched calls; unmapped calls show dashed “not on map” styling. ✅
3. Refresh updates markers without full page reload. ✅
4. Scraper home (`/`) links to the police map page. ✅

## Follow-up (done)

- Sidebar dedupes by **`incident_number`**: one row per active call with **`unit_count`** / **`units[]`** (Socrata ships one row per unit at scene).
- **Call-type tooltips**: ℹ next to `nature_of_call` in sidebar + map popup; descriptions from `dashboard/call_type_glossary.py` via `nature_of_call_description` on each call.

---

## Desk Ops UI rebuild (done) — **Overall Progress:** `100%`

Rebuilt **`/police`** to match the hi-fi **DPD Desk Ops** mockup (`DPD Desk Ops - Standalone.html`).

### Critical decisions

- **Vanilla JS + Leaflet** (no React build): `dashboard/static/police_desk_ops.js` + `police_desk_ops.css`, shell in `police_map.html`.
- **Carto dark basemap** (labels + nolabels layers) instead of OSM light tiles.
- **Layout**: top bar + alert ribbon + map column (filters, zoom, inspector, legend, stats) + **440px right rail** (Feed / Watch / Notes / Patterns).
- **Feed**: one row per incident (API aggregation); unit count chip + unit badges; newsworthy sort; P1–P4 + division + hide-routine filters.
- **Static assets** mounted at `/static` via FastAPI `StaticFiles`.

### Tasks

- [x] 🟩 Extract design tokens + components → `police_desk_ops.css`
- [x] 🟩 Client app: map markers, filters, feed, inspector, alerts, pins/notes (`localStorage`)
- [x] 🟩 Replace `police_map.html` shell (Geist fonts, DOM hooks)
- [x] 🟩 `app.py` static mount
- [x] 🟩 Docs: README + CHANGELOG

### Out of scope (Desk Ops v1)

- Full mockup watchlist rules engine / pattern detection
- Specs overlay sheet from mockup
- WebSockets (still 90s polling)

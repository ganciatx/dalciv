# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Add a hidden admin portal at **`/command`** (URL-only; no nav links) that shows operational status: in-process API usage counters, Socrata cache health, scraper/supervisor state, disk paths, and redacted environment flags. No authentication in v1—security is obscurity plus not exposing secrets in the payload.

## Critical Decisions

- **Decision 1: URL-only access** — Route `GET /command` is registered but never linked from public templates. Admins bookmark the path.

- **Decision 2: JSON API + HTML page** — `GET /command` renders a template; `GET /api/command` returns the same data for polling (12s).

- **Decision 3: New module `dashboard/command_center.py`** — Payload builder + `ApiUsageTracker`.

- **Decision 4: In-memory API usage counters** — Middleware in `app.py`; excludes `/static/*` and `/api/command`.

- **Decision 5: Redaction by design** — Never return `SOCRATA_APP_TOKEN`; boolean `socrata_token_configured` only.

## Tasks

- [x] 🟩 **Step 1: Status aggregation module**
  - [x] 🟩 `dashboard/command_center.py` — `build_command_payload`, cache/disk/route introspection
  - [x] 🟩 Deployment, supervisor, Socrata caches, police live-fetch note, disk summary

- [x] 🟩 **Step 2: API usage middleware**
  - [x] 🟩 `ApiUsageTracker` + `@app.middleware("http")` in `app.py`
  - [x] 🟩 Exposed under `api_usage` in payload

- [x] 🟩 **Step 3: Routes**
  - [x] 🟩 `GET /command`, `GET /api/command`

- [x] 🟩 **Step 4: Admin UI template**
  - [x] 🟩 `dashboard/templates/command.html` — overview cards, usage, caches, paths, env
  - [x] 🟩 Poll + manual refresh; no public nav links

- [x] 🟩 **Step 5: Verification & docs**
  - [x] 🟩 Payload verified: no token in JSON
  - [x] 🟩 `README.md` admin note + API table rows

- [x] 🟩 **Step 6: Police & Council API catalog**
  - [x] 🟩 `page_apis` — dashboard endpoints + hit counts per page
  - [x] 🟩 `upstream_usage` — Socrata / Nominatim call tracking
  - [x] 🟩 Command UI section **Police & Council APIs**

## Files

| Path | Role |
|------|------|
| `dashboard/command_center.py` | Payload + usage tracker |
| `dashboard/app.py` | Middleware + routes |
| `dashboard/templates/command.html` | Admin UI |
| `COMMAND_PORTAL_PLAN.md` | This plan |

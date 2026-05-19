# Sivic Scraper — Dallas Legistar downloads + dashboard

Four capabilities:

1. **CLI scraper** — Playwright loads the Dallas calendar (`Calendar.aspx`), finds `MeetingDetail.aspx` / `View.ashx` links, downloads PDFs with **requests**, writes **`dallas_legistar_downloads/download_manifest.csv`** (interrupt-safe `finally`).
2. **Local dashboard** — FastAPI on **`127.0.0.1:8765`**: Start/Stop scrape subprocess, JSONL audit, manifest table, disk checks.
3. **Agenda summaries** — On-demand extractive summaries (**pypdf**, no API key) grouped by meeting; stored in **`scraper_dashboard_data/summaries.json`**.
4. **Police active-calls map** — **`/police`** page: Leaflet map of [Dallas Police Active Calls](https://www.dallasopendata.com/Public-Safety/Dallas-Police-Active-Calls/9fxf-t2tr/data_preview) via Socrata + cached Nominatim geocoding.
5. **Campaign finance dashboard** — **`/campaign-finance`**: charts + filters + transaction table for [Dallas Campaign Finance](https://www.dallasopendata.com/Services/Campaign-Finance/ndxz-gccx/data_preview) (Socrata + ~1h disk cache).

Plans: **`SCRAPER_UI_PLAN.md`**, **`AGENDA_SUMMARY_PLAN.md`**, **`CAMPAIGN_FINANCE_PLAN.md`**. Further manifest fields: **`issues/ISSUE-more-file-identifying-metadata.md`**.

---

## Requirements

- Python 3.x (tested with **3.14** in `.venv`).
- **`requirements.txt`**: `playwright`, `beautifulsoup4`, `pandas`, `requests`, `fastapi`, `uvicorn[standard]`, `jinja2`, **`pypdf`**.
- Chromium: **`playwright install chromium`** after pip install.

```bash
cd "/path/to/Sivic Scraper"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

---

## Run the scraper (CLI)

From **project root**:

```bash
python dallas_legistar_scraper.py
```

| Exit code | Meaning |
|-----------|---------|
| 0 | Success |
| 1 | Uncaught exception (`traceback` on stderr) |
| 130 | `KeyboardInterrupt` |

**Scraper behavior** (`dallas_legistar_scraper.py`):

- Playwright headless, **`networkidle`**, **120s** navigation timeout.
- Collects **`MeetingDetail.aspx`** and **`View.ashx`** links; global URL dedupe.
- **Unique filenames**: `{label}_{legistar_id}.pdf` (calendar) or `{meeting_title}_{label}_{id}.pdf` (detail) — avoids overwriting `Agenda.pdf`.
- **Manifest columns** (rewritten each run): `type`, `label`, `url`, `saved_to`, `meeting_title`, `meeting_detail_url`, `source` (`calendar` \| `meeting_detail`), `legistar_id`.

---

## Run the dashboard

```bash
python -m dashboard
```

Open **http://127.0.0.1:8765** (app portal), **http://127.0.0.1:8765/council-meetings** (Legistar), **http://127.0.0.1:8765/police** (active calls), or **http://127.0.0.1:8765/campaign-finance** (council accountability).

| Control | Action |
|---------|--------|
| **Start scrape** | Subprocess: `python dallas_legistar_scraper.py` |
| **Stop scrape** | SIGTERM → SIGKILL (~8s) |
| **Generate summaries** | Background batch: PDF text → extractive summary + key points |

Polls **`GET /api/overview`** (~3.2s idle, **~1.5s while scrape/summarize**): state, audit, manifest, **summaries by meeting**, summarize job progress. UI shows an **activity banner**, spinner, elapsed time, and rotating status messages while work is in flight.

---

## Summaries (extractive)

1. Scrape (or use existing PDFs + manifest).
2. Click **Generate summaries** (or `POST /api/summarize`) — processes every **PDF on disk**, not only manifest rows with matching paths (handles stale manifests after filename fixes).
3. After each scrape finishes, **`summaries.json` is pruned** so orphaned keys do not block new files.
4. UI groups files under **meeting name**; use **Regenerate all** (`force=true`) to refresh every on-disk PDF.

**Per-file summary record** (`summaries.json`): `summary`, `key_points[]`, `status` (`ok` \| `empty` \| `error` \| `pending`), `extracted_at`, meeting fields copied from manifest.

**Limits**: scanned/image-only PDFs → `empty`. Large packets may take minutes; progress shows `done/total`.

**Single file**: `POST /api/summarize/one?saved_to=dallas_legistar_downloads/foo.pdf`

---

## Police map — Desk Ops (`/police`)

Hi-fi **Desk Ops** dashboard for DPD **active calls** (units at scene only). Data from Socrata:

`GET https://www.dallasopendata.com/resource/9fxf-t2tr.json`

The feed has **block + street name only** (no coordinates). The server geocodes `"{block} {location}, Dallas, TX"` through [Nominatim](https://nominatim.org), caching results in **`scraper_dashboard_data/geocode_cache.json`** (respect Nominatim’s 1 req/sec policy). Up to **25 new geocodes per refresh**; repeat visits fill in more markers.

- **UI**: dark Carto map, priority markers (size = unit count), top bar + alert ribbon, right-rail **Feed** (one row per **`incident_number`** with **unit count**), inspector, filters (P1–P4, division, hide routine).
- Polls **`GET /api/police/active-calls`** every **90s** (dataset updates ~every 2 min).
- Static assets: `dashboard/static/police_desk_ops.{css,js}` served at `/static/…`.
- Optional: `SOCRATA_APP_TOKEN` env var if Socrata rate-limits.

**Restart the dashboard** after pulling changes so `/static` routes are registered.

---

## Council accountability (`/campaign-finance`)

Unified dashboard for **campaign finance** and **city council voting**:

| Dataset | Socrata ID | Cache file | TTL |
|---------|------------|------------|-----|
| [Campaign Finance](https://www.dallasopendata.com/Services/Campaign-Finance/ndxz-gccx/data_preview) | `ndxz-gccx` | `scraper_dashboard_data/campaign_finance_cache.json` | ~1h |
| [Council Voting Record](https://www.dallasopendata.com/Services/Dallas-City-Council-Voting-Record/ts5d-gdq6/data_preview) | `ts5d-gdq6` | `scraper_dashboard_data/council_voting_cache.json` | ~24h |

- **Member-centric UI**: merged directory links finance `candidate_name` ↔ voting `voter_name` (normalized + alias map).
- **Tabs**: Overview (combined profile) · Money (KPIs, charts, insights) · Voting (roll-call table, yes/participation stats) · Transactions (PDF links).
- **Refresh finance** / **Refresh voting** buttons re-fetch each dataset independently (first voting refresh may take several minutes — ~189k rows).
- Chart.js for money and yes/no-by-year charts.

---

## HTTP API (localhost)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/` | App portal (home) |
| GET | `/council-meetings` | Legistar scrape dashboard UI |
| GET | `/police` | Police active-calls map |
| GET | `/api/police/active-calls` | Socrata proxy + geocoded calls |
| GET | `/campaign-finance` | Council accountability UI |
| GET | `/api/campaign-finance/summary` | Finance KPIs + charts; `refresh`, filter query params |
| GET | `/api/council-voting/summary` | Voting KPIs + member index; `refresh`, `from_date`, `to_date` |
| GET | `/api/council-voting/votes` | Paginated vote rows; `member`, `vote`, `q`, date range |
| GET | `/api/council-voting/agenda-items` | Paginated roll calls by agenda item; `q`, date range |
| GET | `/api/council-voting/agenda-item` | One roll call + member votes; `roll_call_id` |
| GET | `/api/council-accountability/directory` | Merged member list (`refresh_finance`, `refresh_voting`) |
| GET | `/api/council-accountability/member` | Combined profile for one `member` id |
| GET | `/api/campaign-finance/transactions` | Paginated rows; same filters + `limit` / `offset` |
| GET | `/api/state` | Scrape running / PID |
| POST | `/api/start` \| `/api/stop` | Control scraper |
| GET | `/api/audit` | `limit`, optional `status` |
| GET | `/api/files` | Manifest + `file_exists` |
| GET | `/api/summaries` | Grouped summaries; `?meeting_title=` filter |
| POST | `/api/summarize` | Queue batch; `?force=true` re-run all on disk |
| GET | `/api/summarize/status` | `{ running, done, total, current }` |
| POST | `/api/summarize/one` | `saved_to` query param |
| GET | `/api/overview` | Bundle for polling |
| GET | `/command` | Ops portal UI (unlisted; no auth in v1) |
| GET | `/api/command` | Ops JSON: caches, API usage, supervisor, redacted env |

**Admin:** bookmark **`/command`** for deployment health, API usage, and **Police/Council API catalogs** (browser endpoints + upstream Socrata/Nominatim call counts). Not linked from the public app grid.

---

## Data on disk

| Path | Purpose |
|------|---------|
| `dallas_legistar_downloads/*.pdf` | Downloads |
| `dallas_legistar_downloads/download_manifest.csv` | Last scrape index + meeting metadata |
| `scraper_dashboard_data/summaries.json` | Extractive summaries keyed by `saved_to` |
| `scraper_dashboard_data/geocode_cache.json` | Block/location → lat/lon cache for police map |
| `scraper_dashboard_data/campaign_finance_cache.json` | Cached Socrata campaign finance rows |
| `scraper_dashboard_data/council_voting_cache.json` | Cached council roll-call votes (~189k rows) |
| `scraper_dashboard_data/audit_log.jsonl` | Run audit (`started` / `finished`) |
| `scraper_dashboard_data/active_run.json` | In-flight scrape PID metadata |
| `scraper_dashboard_data/logs/<run_id>.log` | Scraper stdout/stderr |

---

## Operational notes

- **Cwd**: run CLI and dashboard from repo root.
- **Playwright**: if Chromium fails to launch, try `env -u PLAYWRIGHT_BROWSERS_PATH python -m dashboard`.
- **Legacy manifest** (4 columns only): dashboard backfills empty meeting fields; re-scrape for full metadata.
- **Security**: local dev binds `127.0.0.1` only; production uses `SCRAPER_ENABLED=0` by default (see **Hostinger** below).

---

## Hostinger (publish online)

Your connected account has **Business Web Hosting** plus a **VPS** running the full app in Docker.

| URL | Role |
|-----|------|
| **[http://ganciatx.com/](http://ganciatx.com/)** | App portal; council meetings, police, council accountability |
| [mediumturquoise-giraffe-322901.hostingersite.com](https://mediumturquoise-giraffe-322901.hostingersite.com) | Landing page (links to VPS) |

**Publish updates:** push to `main` on [github.com/ganciatx/dalciv](https://github.com/ganciatx/dalciv), then redeploy via GitHub Actions (if `HOSTINGER_API_KEY` + `HOSTINGER_VM_ID` are set) or hPanel → VPS → Docker Manager → project `dalciv` → Update.

| Guide | Audience |
|-------|----------|
| **[docs/DEPLOYING_UPDATES.md](docs/DEPLOYING_UPDATES.md)** | **Non-technical:** edit → test → publish, versioning, checklist |
| [HOSTINGER_DEPLOY_PLAN.md](HOSTINGER_DEPLOY_PLAN.md) | First-time VPS + Docker setup |

Artifacts: `Dockerfile`, `docker-compose.yml`, `.github/workflows/deploy-hostinger.yml`.

---

## Layout

```
dallas_legistar_scraper.py
dashboard/
  app.py              # FastAPI routes
  supervisor.py       # subprocess + audit + manifest helpers
  content.py          # PDF extract + extractive summary
  summaries.py        # summaries.json store + batch job
  police_calls.py     # Socrata fetch + geocode for map
  campaign_finance.py     # Campaign finance Socrata + cache + aggregates
  council_voting.py       # Council voting record (~189k rows) + cache
  council_accountability.py  # Member directory + combined profiles
  templates/index.html
  templates/police_map.html
  static/police_desk_ops.css
  static/police_desk_ops.js
  templates/campaign_finance.html
requirements.txt
AGENDA_SUMMARY_PLAN.md
SCRAPER_UI_PLAN.md
```

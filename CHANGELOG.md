# Changelog

## Unreleased

### Added

- **App portal** (`GET /`): DALCIV logo + enterprise-style app grid; Legistar scraper moved to **`/council-meetings`**.
- **Command ops portal** (`GET /command`, `GET /api/command`): unlisted admin view — API usage, Socrata cache health, supervisor state, redacted env.
- **Command — Police & Council APIs**: per-page dashboard endpoint catalog with hit counts; upstream Socrata/Nominatim call tracking.
- **Council Voting — by agenda item**: toggle on Voting tab; `/api/council-voting/agenda-items` + `agenda-item` with roll-call tallies and member breakdown.
- **Fix agenda-item grouping**: roll calls group by `agenda_id` + item + date (not per-member `vote_id`).
- **docs/DEPLOYING_UPDATES.md**: Non-technical guide for testing locally, publishing via GitHub or SSH, versioning, landing vs VPS app, and post-deploy checklist.
- **Manifest meeting metadata**: `meeting_title`, `meeting_detail_url`, `source`, `legistar_id`; unique PDF filenames (Legistar ID/GUID suffix).
- **`dashboard/content.py`**: PDF text extraction (`pypdf`) + extractive `build_summary()`.
- **`dashboard/summaries.py`**: `summaries.json` store, background batch job, meeting-grouped joins.
- **Summary APIs**: `GET /api/summaries`, `POST /api/summarize`, `POST /api/summarize/one`, `GET /api/summarize/status`; overview bundle includes `summaries` + `summarize_job`.
- **Dashboard UI**: “Agenda summaries” panel (by meeting), Generate summaries + progress.
- **`pypdf`** dependency.
- **Police map**: `GET /police`, `GET /api/police/active-calls`, `dashboard/police_calls.py` (Socrata `9fxf-t2tr` + Nominatim geocode cache), Leaflet UI.
- **Police Desk Ops UI**: Rebuilt `/police` from hi-fi mockup — `police_desk_ops.css/js`, Carto dark map, alert ribbon, right-rail feed (deduped incidents + unit counts), inspector; `/static` mount in `app.py`.
- **Council accountability**: Combined `/campaign-finance` with council voting (`ts5d-gdq6`) — `council_voting.py`, `council_accountability.py`, member directory, Overview/Money/Voting/Transactions tabs, new APIs.
- **Voting filters**: Filter roll-call table by vote type (yes/no/abstain/absent variants); full agenda description text in table.
- **Hostinger deploy**: Docker + `docker-compose.yml`, production env (`SCRAPER_ENABLED`), GitHub Action `deploy-hostinger.yml`, site on `mediumturquoise-giraffe-322901.hostingersite.com`.
- **Police map**: aggregate by `incident_number` — sidebar shows unique incidents with unit count (not one row per unit).
- **Police map**: call-type tooltips (ℹ) with brief descriptions from `dashboard/call_type_glossary.py`.
- **Campaign finance**: `GET /campaign-finance`, summary + transactions APIs, `dashboard/campaign_finance.py` (Socrata `ndxz-gccx`, ~1h cache), Chart.js dashboard UI.
- **Campaign finance**: spending breakdown, donor bankroll, and conflict watch-list insights (`business_name` / counterparty parsing).
- **Campaign finance**: per-candidate overview (financials, major donors/expenditures, fiscal responsibility, monthly chart, browse grid).

### Changed

- **`README.md`**: documents scrape + dashboard + summaries.
- Legacy manifests: `normalize_manifest_row()` fills missing meeting columns.

### Fixed

- Duplicate `Agenda.pdf` overwrites on calendar scrape (unique names per Legistar ID).
- **Generate summaries** ignored new downloads when manifest paths collided or `summaries.json` was stale — now indexes all PDFs on disk, prunes store after scrape, dedupes batch jobs.

# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Add a **third dashboard page** — an easy-to-read **campaign finance reporting UI** for the City of Dallas [Campaign Finance](https://www.dallasopendata.com/Services/Campaign-Finance/ndxz-gccx/data_preview) dataset (`ndxz-gccx`), fed by the public **Socrata SODA API** ([endpoint docs](https://dev.socrata.com/docs/endpoints)). The page surfaces contributions, expenditures, and filings with summary cards, simple charts, filters, and a searchable transaction table (with links to official PDF reports). Data is proxied through the existing local FastAPI app on `127.0.0.1:8765` — same pattern as the police map.

## Critical Decisions

- **Decision 1: SODA 2.x resource API for v1** — Use `GET https://www.dallasopendata.com/resource/ndxz-gccx.json` with SoQL (`$limit`, `$where`, `$order`, `$select`) on the public dataset. Reuse optional `SOCRATA_APP_TOKEN` header (already used by `police_calls.py`). Defer SODA 3.0 until required.

- **Decision 2: Server-side proxy + disk cache** — New `dashboard/campaign_finance.py` fetches and normalizes rows, writes `scraper_dashboard_data/campaign_finance_cache.json` with `fetched_at`, and serves JSON APIs. The dataset is **~9,950 rows** (manageable to pull in one request); cache TTL **~1 hour** (updates are filing-driven, not sub-minute like active police calls).

- **Decision 3: v1 = reporting dashboard, not a map-first UI** — Rows include `amount`, `schedule_type`, `contact_type`, `candidate_name`, `transaction_date`, and optional `geo_location`. v1 focuses on **money in / money out**, **top candidates**, and **time trends**. Contributor geo map is **out of scope** for v1 (many rows lack lat/lon; PO boxes are common).

- **Decision 4: Chart stack** — **Chart.js** via CDN in `dashboard/templates/campaign_finance.html` (no npm build), matching the Leaflet/CDN approach on `police_map.html`. Styling reuses existing CSS variables / header nav pattern.

- **Decision 5: Aggregation on server** — API returns pre-computed summaries (`totals`, `by_candidate`, `by_month`, `schedule_breakdown`) plus paginated/filtered `transactions` so the browser stays simple and fast.

- **Decision 6: Row semantics** — Treat `schedule_type` as the primary bucket:
  - **Contributions:** `Political Contributions Other Than Pledges Or Loans`, `Pledged Contributions`, `Loans` (inflows; loans tracked separately in UI).
  - **Expenditures:** `Political Expenditures`, `Political Expenditures Made From Personal Funds`, etc.
  - **Filings / meta:** `Report`, `Report Itself`, `Notice From Political Committees` (exclude from dollar totals or show in a separate “Filings” count).
  Parse `amount` as `Decimal`/`float`; ignore non-numeric rows in sum charts.

## Dataset notes (from exploration)

| Field | Use |
|-------|-----|
| `id`, `record_id`, `report_id` | Stable row keys |
| `candidate_name` | Primary grouping dimension |
| `first_name`, `last_name` | Contributor/payee display |
| `contact_type` | Contributor / Expenditure / Candidate / Committee / Lender |
| `schedule_type` | Contribution vs expenditure vs report |
| `record_type` | Filing period label (e.g. `July 15: Semi-Annual 2025`) |
| `amount` | Dollar amount (string) |
| `transaction_date` | Timeline charts + date filter |
| `file_link.url` | Link to official PDF on `campfin.dallascityhall.com` |
| `election_date` | Optional filter when present |

Portal: [Campaign Finance data preview](https://www.dallasopendata.com/Services/Campaign-Finance/ndxz-gccx/data_preview)

## Tasks:

- [x] 🟩 **Step 1: Socrata client module**
  - [x] 🟩 `dashboard/campaign_finance.py`: `fetch_campaign_finance(limit=10000)` → resource `ndxz-gccx.json`, `$order=transaction_date DESC`.
  - [x] 🟩 `normalize_row()` → stable schema (`id`, `candidate_name`, `schedule_type`, `contact_type`, `record_type`, `amount`, `amount_num`, `transaction_date`, `payee_name`, `file_url`, etc.).
  - [x] 🟩 `classify_row()` → `kind`: `contribution` \| `expenditure` \| `filing` \| `other` for totals logic.
  - [x] 🟩 Disk cache read/write + `refresh_cache_if_stale()` (TTL ~1h).

- [x] 🟩 **Step 2: Aggregations + API**
  - [x] 🟩 `build_summary(calls)` → KPIs: total contributions, total expenditures, net (optional), transaction counts, unique candidates, latest `transaction_date`.
  - [x] 🟩 `top_candidates()`, `by_month()`, `schedule_breakdown()` helpers.
  - [x] 🟩 `GET /api/campaign-finance/summary` — returns summary + chart series + cache meta (`fetched_at`, `row_count`, `source_url`).
  - [x] 🟩 `GET /api/campaign-finance/transactions` — query params: `candidate`, `kind`, `record_type`, `q` (search), `limit`, `offset`; returns filtered rows + total count.

- [x] 🟩 **Step 3: Routes + nav**
  - [x] 🟩 `GET /campaign-finance` → `campaign_finance.html` in `dashboard/app.py`.
  - [x] 🟩 Nav link on `index.html` and `police_map.html` (e.g. “Campaign finance”).
  - [x] 🟩 Wire `requests.HTTPError` → 502 like police API.

- [x] 🟩 **Step 4: Visual dashboard UI**
  - [x] 🟩 Header: title, last fetched, row count, **Refresh now** button.
  - [x] 🟩 KPI cards: total raised, total spent, # transactions, # candidates.
  - [x] 🟩 Chart.js: horizontal bar — top 10 candidates by contributions; second chart — top 10 by expenditures (or toggle).
  - [x] 🟩 Chart.js: line or bar — contributions + expenditures by month (last 24 months).
  - [x] 🟩 Filters: candidate dropdown, filing period (`record_type`), kind (contribution/expenditure/all), text search.
  - [x] 🟩 Sortable/paginated table: date, candidate, payee, schedule, amount, link to PDF.
  - [x] 🟩 Footer attribution: Dallas Open Data, link to dataset portal.

- [x] 🟩 **Step 5: Docs**
  - [x] 🟩 `README.md` — route, APIs, cache path, env token note.
  - [x] 🟩 `CHANGELOG.md` entry when implemented.

## Out of scope (this plan)

- Parsing TEC PDF contents or OCR.
- Filing/submitting reports through the UI.
- State/federal campaign finance data.
- Contributor address map / geocoding.
- WebSockets or push updates (manual refresh + hourly cache only).
- Public deployment beyond localhost.
- Merging with Legistar scrape or police map data.

## Acceptance criteria

1. `GET /campaign-finance` loads without errors and shows KPI cards populated from live Socrata data (or cache). ✅
2. At least **two charts** render (candidate totals + time series) and update when filters change. ✅
3. Transaction table lists rows with working **PDF links** where `file_link.url` is present. ✅
4. Filters (candidate, kind, search) narrow the table without a full page reload. ✅
5. Home (`/`) and police map (`/police`) link to the new page. ✅

## Follow-up (done)

- **Council accountability hub** — see [`COUNCIL_ACCOUNTABILITY_PLAN.md`](COUNCIL_ACCOUNTABILITY_PLAN.md) (voting record + reimagined UI, 100%).

- **Where money goes**: spending breakdown (candidate → vendor → amount) using `business_name` / counterparty fields.
- **Who bankrolls whom**: donor → candidates supported with totals.
- **Watch list**: heuristic conflict flags (multi-candidate donor, donor–vendor overlap, concentrated funding, self-contribution).
- **Per-candidate overview**: select a candidate (or browse cards) for financials, major donors/vendors, fiscal responsibility summary, monthly cash flow, and candidate-specific flags.

## Follow-up (see `COUNCIL_ACCOUNTABILITY_PLAN.md`)

Council voting record merged into reimagined **Council Accountability** hub at `/campaign-finance` (100% complete).

## API sketch

```
GET /campaign-finance              → HTML dashboard
GET /api/campaign-finance/summary  → { meta, kpis, charts, candidates[], record_types[] }
GET /api/campaign-finance/transactions?candidate=&kind=&record_type=&q=&limit=50&offset=0
```

## File touch list (expected)

| Path | Role |
|------|------|
| `dashboard/campaign_finance.py` | Fetch, normalize, cache, aggregate |
| `dashboard/app.py` | Routes |
| `dashboard/templates/campaign_finance.html` | UI + Chart.js |
| `dashboard/templates/index.html` | Nav link |
| `dashboard/templates/police_map.html` | Nav link |
| `scraper_dashboard_data/campaign_finance_cache.json` | Cached rows (gitignored) |
| `README.md`, `CHANGELOG.md` | Docs |

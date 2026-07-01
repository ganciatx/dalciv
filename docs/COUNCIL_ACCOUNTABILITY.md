# Council Accountability — Product & Technical Spec

**Product URL:** `/council-accountability` (legacy redirect: `/campaign-finance` → 308)  
**Last verified against codebase:** June 2025  
**Repo paths:** `council-accountability/` (frontend), `dashboard/council_accountability.py` (orchestrator)

---

## Product at a Glance

| | |
|---|---|
| **Product name** | **Council Accountability** |
| **What it is** | A Dallas-focused civic transparency dashboard that unifies campaign finance, city council roll-call voting, and lobbyist registration around **council member profiles** |
| **One-liner** | See who funds Dallas council campaigns, how members vote, and which lobbying clients overlap with campaign money — on one page, by district. |
| **Format** | Single-page web app served by FastAPI; data fetched from Dallas Open Data (Socrata), cached server-side |
| **Account required** | No login |
| **Geography** | City of Dallas, Texas (districts 1–14) |
| **Data freshness** | Finance ~1h cache · Voting & lobbying ~24h cache (manual refresh available) |

---

# Part I — Product & Marketing

## The Problem We Solve

Accountability data about Dallas city government lives in separate silos: campaign finance filings, roll-call vote records, and lobbyist registrations. Residents, journalists, and researchers who want the full picture — *who raised money, how they voted, and who is lobbying while also giving* — have to cross-reference multiple datasets manually.

**Council Accountability connects those datasets** around recognizable council members, with a signature **Influence overlap** view that surfaces entities appearing in both lobbying registrations and campaign finance.

## Core Value Propositions

Use these for headlines, catalog copy, and landing-page sections.

1. **One hub, three official datasets** — Campaign finance, council voting, and lobbyist registration in a single interface with shared filters and member context.
2. **Member-first, not dataset-first** — Browse by district (1–14), open a profile, and see money + votes + lobbying ties together.
3. **Influence overlap** — Surfaces lobbying clients who also appear as campaign donors or vendors (heuristic name matching; not vendors merely *paid by* campaigns).
4. **Grounded in public filings** — Data comes from Dallas Open Data; PDF links on transactions and lobby reports where available.
5. **Investigative starting points, not legal conclusions** — Watch list flags and overlap matches are automated heuristics for manual review.
6. **Transparent limitations** — Footer and in-app copy state cache TTLs and “not legal advice” clearly.

## Target Audiences

| Audience | Why they care | Product hooks |
|----------|---------------|---------------|
| **Dallas residents / voters** | Understand their councilmember’s money and votes before elections | District browse, member cards with headshots, yes-rate meters |
| **Local journalists & watchdogs** | Quick leads on influence patterns and voting records | Influence radar, watch list, transactions ledger with PDFs |
| **Civic researchers & students** | Structured access to open data without building ETL | Export-friendly tables, API endpoints, cached aggregates |
| **Campaign staff & candidates** | Benchmark peers (not primary audience — copy should stay neutral) | Candidate browse, fiscal health summaries |
| **Civic-tech curious / portfolio visitors** | Explore DalCiv side projects | Featured on `/apps` and portfolio catalog |

**Primary audience:** Dallas residents and local accountability-minded users who think in **council districts** and **named officials**, not Socrata dataset IDs.

## Messaging Pillars

### 1. Follow the money *and* the votes

> Campaign finance + voting + lobbyist registrations · one dashboard.

Money alone doesn’t tell the whole story. Council Accountability pairs fundraising and spending with roll-call records so users can see the same person across both ledgers.

### 2. Same players, two channels of influence

> Dallas requires lobbyists to register clients with the city. This app links those registrations to campaign money.

The **Lobbying** tab and **Influence overlap** / **Influence radar** features are the differentiated story — entities that lobby City Hall *and* show up in campaign finance.

### 3. Start with your councilmember

> Active councilmembers by district (1–14). Click a card for a full profile — campaign money, voting record, and lobbying ties.

Member cards show raised/spent totals, yes-rate, and data-availability badges ($ for finance, Vote for voting record).

### 4. Flags to investigate, not verdicts

> Automated flags for manual review only (not legal conclusions).

Watch list and overlap matching use name heuristics. Marketing and UI copy must never imply guilt, illegality, or causation (donor → vote).

### 5. Open data, clearly sourced

> Cached locally (finance ~1h, voting & lobbying ~24h). Not legal advice.

Link to Dallas Open Data dataset pages in technical/footer contexts. Emphasize public records, not proprietary intelligence.

## User Journey

```
Land on Overview
  → Browse council members by district OR pick from dropdown
  → Open member profile (money + votes + lobbying overlap)
  → Drill into Money / Voting / Lobbying / Transactions tabs
  → Filter, search, refresh datasets as needed
```

### Tab map (user-facing names)

| Tab | Purpose |
|-----|---------|
| **Overview** | Influence radar teaser, member grid, combined **Member profile** when one member is selected |
| **Money** | Campaign finance KPIs, candidate browse, watch list, charts, vendor/donor tables |
| **Voting** | Roll-call search; toggle **By member** vs **By agenda item** |
| **Lobbying** | Registrations search, **Influence overlap** filters, top clients chart |
| **Transactions** | Sortable finance ledger with PDF links |

### Key screens & copy (from live UI)

| Screen | Headline / lede |
|--------|-----------------|
| Page header | **Council accountability** — *Campaign finance + voting + lobbyist registrations* |
| Overview | **Browse council members** — *Active councilmembers by district (1–14)…* |
| Overview teaser | **Influence radar** — *Lobbying clients who also gave money to council campaigns — not vendors paid by campaigns.* |
| Member profile | **Member profile — {name}**; **Lobbying overlap** on profile when matches exist |
| Money | **Watch list — possible conflicts of interest** — *Automated flags for manual review only* |
| Money | **Where money goes** / **Who bankrolls whom** / **Top vendors (all campaigns)** |
| Voting | **Voting record** — **By member** \| **By agenda item** |
| Lobbying | **Who is lobbying City Hall?** — *…same players, two channels of influence.* |
| Footer | *Cached locally (finance ~1h, voting & lobbying ~24h). Not legal advice.* |

## Feature Glossary (user-facing ↔ internal)

| User-facing label | Meaning |
|-------------------|---------|
| **Influence radar** | Overview teaser grid of overlap entities (subset of full lobbying overlap) |
| **Influence overlap** | Lobbying tab: clients matched to campaign donors/vendors |
| **Lobbying overlap** | Same matches, scoped to selected member’s profile |
| **Campaign donors** / **Campaign vendors** / **Show all** | Overlap filter modes |
| **Watch list — possible conflicts of interest** | Heuristic flags from finance filings |
| **Campaign finance overview** | Per-candidate deep dive (donors, expenditures, fiscal health, cash-flow chart) |
| **Fiscal responsibility** | Backend-derived fiscal health label on candidate cards |
| **By agenda item** | Voting view grouped by roll call, not by member |
| Badges **$** / **Vote** | Data available for finance and/or voting on member cards |

## Suggested Headlines & CTAs

**Headline directions:**
- *Follow Dallas council money, votes, and lobbying — in one place.*
- *See who funds your councilmember and how they vote.*
- *Same players, two channels of influence.*

**CTA options:**
- Explore council members
- Open the dashboard
- View your district

**Short bullets (catalog / app card):**
- Campaign finance, roll-call voting, lobbyist registrations
- Member profiles by district (1–14)
- Influence overlap between lobbying and campaign money
- Searchable transactions with PDF links
- Cached Dallas Open Data — refresh on demand

## Tone & Voice

| Do | Don't |
|----|-------|
| Factual, civic, neutral | Sensational or accusatory |
| “Possible conflicts,” “overlap,” “flags for review” | “Corrupt,” “bought,” “guilty” |
| Name Dallas explicitly | Present as a generic national tool |
| Acknowledge heuristics and cache lag | Imply real-time or comprehensive coverage |
| “Not legal advice” where relevant | Offer legal or ethics conclusions |

## What We Are NOT (avoid inaccurate marketing)

| Don't claim | Reality |
|-------------|---------|
| “Proves corruption” or donor→vote causation | Name matching and aggregates only; no causation model |
| “Real-time council votes” | ~24h voting cache; refresh button required for updates |
| “Complete lobbyist coverage” | Only registered clients in Dallas dataset; heuristic overlap |
| “Legal or ethics compliance tool” | Explicitly not legal advice |
| “National / multi-city” | Dallas datasets only |
| “AI-powered investigation” | Rule-based flags and string matching |
| Mobile-native app | Responsive web SPA; desktop-oriented density |

## Positioning in the DalCiv Ecosystem

- **Catalog slug:** `council-accountability` (`apps/registry.yaml`, `portfolio/content/site.yaml`)
- **Tags:** Civic, Data
- **Featured:** Yes (side projects catalog and DalCiv portal)
- **Emoji:** ⚖️
- **Sibling apps:** City Budget Explorer, Police Active Calls, Council Meetings (Legistar)

## FAQ Seeds (marketing / support)

**Is this only for Dallas?**  
Yes. All three datasets are City of Dallas open data.

**Do I need an account?**  
No.

**How fresh is the data?**  
Finance cache ~1 hour; voting and lobbying ~24 hours. Use header refresh buttons to pull from Socrata.

**What is “Influence overlap”?**  
Lobbying clients whose names also appear in campaign finance as donors or vendors. Matching is heuristic — verify in source filings.

**Is the watch list definitive?**  
No. Automated flags for manual review only, not legal conclusions.

**Can I use this in a news story?**  
Credit Dallas Open Data sources; note matching limitations and cache timestamps.

---

# Part II — Technical Specifications

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser — council-accountability SPA (Vite, vanilla JS)        │
│  Chart.js (lazy) · sessionStorage bootstrap cache · tab lazy-load │
└────────────────────────────┬────────────────────────────────────┘
                             │ JSON APIs + embedded bootstrap
┌────────────────────────────▼────────────────────────────────────┐
│  FastAPI (dashboard/)                                             │
│  council_accountability.py — member directory, bootstrap, profiles│
│  campaign_finance.py · council_voting.py · lobbyist_registration.py│
│  council_headshots.py — portraits + district links                │
└────────────────────────────┬────────────────────────────────────┘
                             │ Socrata API (optional SOCRATA_APP_TOKEN)
┌────────────────────────────▼────────────────────────────────────┐
│  Dallas Open Data                                                 │
│  ndxz-gccx · ts5d-gdq6 · ffkm-63hd                                │
└─────────────────────────────────────────────────────────────────┘
```

**Pattern:** Hybrid server-rendered shell + client SPA. The server owns fetch, normalization, aggregation, and disk cache; the browser never loads ~189k voting rows at once.

## Routes & Deployment

| Item | Value |
|------|-------|
| **Canonical route** | `GET /council-accountability` |
| **Legacy redirect** | `GET /campaign-finance` → 308 → `/council-accountability` |
| **Registry** | `apps/registry.yaml` — `type: vite-spa`, `embed_bootstrap: true`, `serve_built_html: true` |
| **Route registration** | `dashboard/routes/spa.py` (HTML), `dashboard/routes/civic.py` (APIs) |
| **Build output** | `council-accountability/` → `dashboard/static/council-accountability/` |
| **Vite base** | `/static/council-accountability/` (`vite.config.ts`) |
| **Production build** | `./scripts/build-all-frontends.sh` or Docker multi-stage build |
| **Local dev** | `npm run dev` in `council-accountability/`; API at `http://127.0.0.1:8765` |

### Bootstrap injection

When `embed_bootstrap: true`, FastAPI injects into built `index.html`:

```html
<script id="ca-bootstrap">window.__CA_BOOTSTRAP__={...};</script>
```

Implemented in `dashboard/routes/spa.py` → `_inject_bootstrap_html()`.

### Site chrome

Built HTML is post-processed with global header/footer via `inject_site_chrome()` in `dashboard/site_chrome.py` (same pattern as other Vite SPAs).

## Frontend Stack

| Layer | Path | Notes |
|-------|------|-------|
| Shell | `council-accountability/index.html` | Tabs, KPIs, all section markup |
| App logic | `council-accountability/src/main.js` | ~2k lines: tabs, fetch, charts, member scope |
| Styles | `council-accountability/src/styles.css` | CSS variables, cards, overlap grid |
| Overlap | `council-accountability/src/lib/overlap.js` | Donor/vendor/both classification |
| Search | `council-accountability/src/lib/search.js` | Member/candidate card filtering |
| Members | `council-accountability/src/lib/members.js` | Active members, district sort |
| Bootstrap cache | `council-accountability/src/lib/bootstrap-cache.js` | `sessionStorage`, 1h TTL |
| Build | `council-accountability/vite.config.ts` | Out dir → dashboard static |
| Unit tests | `council-accountability/src/lib/*.test.js` | Vitest |

**Dependencies:** `chart.js` (runtime); `vite`, `vitest` (dev). **No React/TypeScript** in the shipped app.

### Client bootstrap priority

1. `window.__CA_BOOTSTRAP__` (server-injected)
2. `sessionStorage` key `ca-bootstrap-v1` (1h TTL)
3. `GET /api/council-accountability/bootstrap`
4. `<link rel="preload" href="/api/council-accountability/bootstrap">` in `index.html`

### Lazy tab loading

Heavy payloads for **Money** (transactions), **Voting**, and **Lobbying** load on first tab visit (`tabsLoaded` set in `main.js`). Overview paints from bootstrap immediately.

### Member scoping

Selecting a member:
- Scopes KPIs and profile API calls
- Hides global Money sections (`money-global-only`)
- Filters lobby overlap on profile and lobbying tab
- Resolves finance via `member` slug → `candidate_name` on server

## Backend Modules

| Module | Responsibility |
|--------|----------------|
| `dashboard/council_accountability.py` | Member directory, bootstrap cache, combined profiles, finance↔voting name bridge |
| `dashboard/campaign_finance.py` | Socrata `ndxz-gccx`, aggregates, watch list, transactions |
| `dashboard/council_voting.py` | Socrata `ts5d-gdq6`, ~189k rows, stats, agenda items, vote search |
| `dashboard/lobbyist_registration.py` | Socrata `ffkm-63hd`, `build_influence_overlap()`, `member_lobby_overlap()` |
| `dashboard/council_headshots.py` | `enrich_directory()`, headshot URLs, district page links |
| `dashboard/data_sync.py` | Cache refresh orchestration; calls `refresh_bootstrap_cache()` after source updates |

### Member name bridge

Finance uses `candidate_name`; voting uses `voter_name` (with spacing variants). Server builds:

- `member_id` — slug from normalized name (`member_id_from_name()`)
- `MEMBER_ALIASES` — known mismatches (e.g. `Gay Willis` ↔ `Gay Donnell Willis`)
- `build_member_directory()` — merges finance + voting into one row per member with `has_finance`, `has_voting`, summaries

Active council roster filtered via `active_members_by_district()` for districts 1–14.

### Influence overlap algorithm (summary)

In `lobbyist_registration.py`:

1. Normalize client/donor/vendor names
2. Match lobbying registrations to campaign finance entities (contributions, expenditures)
3. Classify roles: campaign donor, campaign vendor, or both
4. **Exclude** vendors that only received campaign *expenditures* from the primary “Influence radar” donor-focused view (UI copy clarifies this)
5. Scope to member when `member` query param resolves to finance candidate

## Data Sources & Caches

| Dataset | Socrata ID | Cache file | TTL |
|---------|------------|------------|-----|
| [Campaign Finance](https://www.dallasopendata.com/Services/Campaign-Finance/ndxz-gccx/data_preview) | `ndxz-gccx` | `scraper_dashboard_data/campaign_finance_cache.json` | ~1h |
| [Council Voting Record](https://www.dallasopendata.com/Services/Dallas-City-Council-Voting-Record/ts5d-gdq6/data_preview) | `ts5d-gdq6` | `scraper_dashboard_data/council_voting_cache.json` | ~24h |
| [Lobbyist Registration](https://www.dallasopendata.com/Services/Lobbyist-Registration/ffkm-63hd/about_data) | `ffkm-63hd` | `scraper_dashboard_data/lobbyist_registration_cache.json` | ~24h |
| Combined bootstrap | — | `scraper_dashboard_data/council_accountability_bootstrap_cache.json` | Invalidated when source cache mtimes change |

**Optional env:** `SOCRATA_APP_TOKEN` for higher rate limits.

**First voting refresh:** May take several minutes (~189k paginated rows).

## HTTP API Reference

### Council Accountability endpoints

| Method | Path | Query params | Response |
|--------|------|--------------|----------|
| GET | `/api/council-accountability/bootstrap` | `refresh_finance`, `refresh_voting` | Full bootstrap payload; `Cache-Control: private, max-age=60` |
| GET | `/api/council-accountability/directory` | `refresh_finance`, `refresh_voting` | `{ meta, members }` — active members, by district |
| GET | `/api/council-accountability/member` | `member` (required), `refresh_finance`, `refresh_voting`, `record_type`, `q`, `from_date`, `to_date` | Combined profile + overlap |

### Related endpoints (used by SPA tabs)

| Path | Used for |
|------|----------|
| `/api/campaign-finance/summary` | Money tab KPIs, charts, watch list, candidate index |
| `/api/campaign-finance/transactions` | Transactions tab (paginated, sortable) |
| `/api/council-voting/summary` | Voting KPIs, date defaults |
| `/api/council-voting/votes` | Voting tab roll calls (`member`, `vote`, `q`, date range, pagination) |
| `/api/council-voting/agenda-items` | By agenda item view |
| `/api/council-voting/agenda-item` | Single roll call detail |
| `/api/lobbyist-registration/summary` | Lobbying tab, overlap grid, registrations |

Member-scoped finance calls accept `member` slug; server resolves via `finance_candidate_for_member_id()` in `civic.py`.

## Bootstrap Payload Shape

Built in `council_accountability.py` → `get_bootstrap_payload()`:

```json
{
  "directory": {
    "meta": {
      "finance_fetched_at": "...",
      "voting_fetched_at": "...",
      "finance_row_count": 0,
      "voting_row_count": 0,
      "date_range_defaults": { "from": "...", "to": "..." }
    },
    "members": [
      {
        "id": "slug",
        "display_name": "...",
        "district": "District 3",
        "district_num": 3,
        "council_status": "active",
        "has_finance": true,
        "has_voting": true,
        "finance_candidate_name": "...",
        "voting_names": ["..."],
        "finance_summary": { },
        "voting_summary": { },
        "headshot_url": "/static/...",
        "district_page_url": "https://..."
      }
    ]
  },
  "voting": { },
  "finance": { },
  "lobbyist": { }
}
```

### Member profile payload

```json
{
  "found": true,
  "member": { },
  "finance_overview": { },
  "voting_stats": { },
  "recent_votes": [ ],
  "lobbyist_overlap": [ ]
}
```

## Voting Semantics

| Vote values | Treatment |
|-------------|-----------|
| `YES`, `NO` | Cast votes; used in yes-rate numerators/denominators |
| `ABST`, `ABSNT`, `ABSNT_CB`, `AWVT`, `N/A` | Non-votes for yes-rate; tracked for attendance/participation |

Vote filter options exposed in UI map to API `vote` query param.

## Tests

| Suite | Location | Coverage |
|-------|----------|----------|
| Frontend unit | `council-accountability/src/lib/*.test.js` | Overlap, search, members, bootstrap cache |
| Bootstrap | `tests/test_council_accountability_bootstrap.py` | Payload shape, disk cache, stale invalidation |
| API + HTML | `tests/test_council_accountability_api.py` | Bootstrap/directory/member APIs, embedded script, assets |
| E2E | `tests/test_council_accountability_e2e.py` | Playwright: cards, search, lobbying filters, member scope |
| Runner | `scripts/run-council-accountability-tests.sh` | vitest → pytest → e2e |

```bash
# Frontend
cd council-accountability && npm test

# Backend (non-e2e)
python3 -m pytest tests/test_council_accountability*.py -v -k "not e2e"

# Full suite
./scripts/run-council-accountability-tests.sh
```

## Development Commands

```bash
# Frontend dev server (proxies to dashboard in typical setup)
cd council-accountability && npm run dev

# Production bundle
cd council-accountability && npm run build

# Dashboard with all civic apps
python -m dashboard.app   # http://127.0.0.1:8765/council-accountability
```

## Out of Scope (current)

Documented in `plans/COUNCIL_ACCOUNTABILITY_PLAN.md` and still accurate:

- Agenda PDF / video parsing
- Ideology scores or party alignment
- Donor → vote causation models
- Real-time live meeting votes
- Full-text search index beyond in-memory filters
- Multi-city expansion

## Planned but Not Shipped

`plans/COUNCIL_ACCOUNTABILITY_UI_REBUILD_PLAN.md` describes a React + light civic mockup rebuild (**0%**). **Current production app is vanilla JS + Vite**, not React.

## Legacy Artifacts

| Artifact | Status |
|----------|--------|
| `dashboard/templates/campaign_finance.html` | Legacy monolithic Jinja template (~2,783 lines); **not** production path |
| `/campaign-finance` URL | 308 redirect to `/council-accountability` |

## File Index

```
council-accountability/
  index.html
  src/main.js
  src/styles.css
  src/lib/overlap.js
  src/lib/search.js
  src/lib/members.js
  src/lib/bootstrap-cache.js
  vite.config.ts
  package.json

dashboard/
  council_accountability.py
  campaign_finance.py
  council_voting.py
  lobbyist_registration.py
  council_headshots.py
  routes/spa.py
  routes/civic.py

apps/registry.yaml
portfolio/content/site.yaml
plans/COUNCIL_ACCOUNTABILITY_PLAN.md
tests/test_council_accountability_*.py
scripts/run-council-accountability-tests.sh
```

---

## Document Changelog

| Date | Note |
|------|------|
| 2025-06 | Initial combined product + technical spec from codebase audit |

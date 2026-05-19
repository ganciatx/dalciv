# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Reimagine the existing **Campaign Finance** dashboard into a unified **Council Accountability** hub: money (Socrata `ndxz-gccx`) and **City Council voting** ([Dallas City Council Voting Record](https://www.dallasopendata.com/Services/Dallas-City-Council-Voting-Record/ts5d-gdq6/data_preview), Socrata `ts5d-gdq6`) on one page, centered on **each member’s profile**—fundraising/spending on one side, roll-call record on the other. Same FastAPI localhost pattern; server-side fetch, cache, and aggregation.

## Critical Decisions

- **Decision 1: Separate voting module** — Add `dashboard/council_voting.py` (do not bloat `campaign_finance.py`). Voting data is **~189k rows** vs ~10k finance rows; different cache file, TTL, and pagination strategy.

- **Decision 2: SODA 2.x + paginated full cache** — Use `GET https://www.dallasopendata.com/resource/ts5d-gdq6.json` with `$limit` + `$offset` (or `$order=date DESC` pages) until exhausted, same optional `SOCRATA_APP_TOKEN` as police/finance. One-time refresh may take minutes; store `scraper_dashboard_data/council_voting_cache.json` with `fetched_at`. TTL **~24h** (council votes update after meetings, not continuously).

- **Decision 3: Member-centric UI (reimagine, not bolt-on)** — Replace “finance-only” layout with:
  - **Global**: KPI strip (money + voting), member picker, date range (voting).
  - **Tabs**: **Overview** | **Money** | **Voting** | **Transactions** (existing table, under Money).
  - **Member profile** (primary): combined card—financials + fiscal summary + voting stats (yes/no %, attendance, recent votes)—when a member is selected.
  - Reuse Chart.js CDN; align visual style with existing dashboard tokens (no npm build).

- **Decision 4: Name bridge between datasets** — Finance uses `candidate_name`; voting uses `voter_name` (with duplicates like `Adam  Bazaldua` vs `Adam Bazaldua`). Server builds `canonical_member_id` + `display_name` via normalized whitespace, optional alias table for known variants (`Gay Willis` ↔ `Gay Donnell Willis`, `Jennifer Gates` ↔ `Jennifer S. Gates`). Unmatched finance-only names remain finance-only; unmatched voters remain voting-only.

- **Decision 5: Voting aggregates on server** — APIs return pre-computed per-member stats and paginated vote rows so the browser never holds 189k rows. Member detail queries filter cached rows in memory (acceptable after one disk load).

- **Decision 6: Vote semantics** — Treat `YES` / `NO` as cast votes; `ABST`, `ABSNT`, `ABSNT_CB`, `AWVT`, `N/A` as non-votes for yes-rate denominators but track **attendance/participation** separately. Group by `agenda_id` for item-level roll calls; expose `final_action_taken`, `agenda_item_description`, `district`, `item_type`.

## Tasks:

- [x] 🟩 **Step 1: Council voting module**
  - [x] 🟩 `dashboard/council_voting.py`: paginated `fetch_voting_records()` → `ts5d-gdq6.json`.
  - [x] 🟩 `normalize_vote_row()` → stable schema (`vote_id`, `date`, `member_name`, `member_canonical`, `district`, `vote`, `vote_category`, `agenda_id`, `description`, …).
  - [x] 🟩 `normalize_member_name()` + small `MEMBER_ALIASES` map for known finance/voting mismatches.
  - [x] 🟩 Disk cache read/write + `refresh_cache_if_stale()` (TTL ~24h).

- [x] 🟩 **Step 2: Voting aggregations**
  - [x] 🟩 `build_member_voting_stats(rows, member?)` → participation rate, yes/no counts, votes in range, by-year breakdown.
  - [x] 🟩 `recent_votes(rows, member, limit)` → last N roll calls for profile table.
  - [x] 🟩 `member_index(rows)` → all members with district + stats (for picker/grid).
  - [x] 🟩 `search_votes(rows, q, member, from_date, to_date, limit, offset)` for voting tab table.

- [x] 🟩 **Step 3: Unified member bridge**
  - [x] 🟩 `dashboard/council_accountability.py`: `build_member_directory(finance_rows, voting_rows)`.
  - [x] 🟩 `get_member_profile_payload()` → finance overview + voting stats + recent votes.

- [x] 🟩 **Step 4: API routes** (`dashboard/app.py`)
  - [x] 🟩 `GET /api/council-voting/summary`
  - [x] 🟩 `GET /api/council-voting/votes`
  - [x] 🟩 `GET /api/council-accountability/directory`
  - [x] 🟩 `GET /api/council-accountability/member`
  - [x] 🟩 Existing finance transaction API unchanged.

- [x] 🟩 **Step 5: Reimagined UI** (`dashboard/templates/campaign_finance.html`)
  - [x] 🟩 Header: dual dataset attribution + separate refresh for finance vs voting cache.
  - [x] 🟩 Member picker (merged directory) + browse cards (raised / spent / yes% / participation).
  - [x] 🟩 **Overview tab**: combined member profile.
  - [x] 🟩 **Money tab**: existing KPIs, charts, insights.
  - [x] 🟩 **Voting tab**: stats, yearly chart, searchable vote table.
  - [x] 🟩 **Transactions tab**: existing table.
  - [x] 🟩 Nav links on `/`, `/police` updated.

- [x] 🟩 **Step 6: Docs**
  - [x] 🟩 `README.md`, `CHANGELOG.md`, `council_voting_cache.json` path noted.
  - [x] 🟩 `CAMPAIGN_FINANCE_PLAN.md` follow-up link.

## Out of scope (this plan)

- Parsing council agenda PDFs or video.
- Legistar / police map integration.
- Ideology scores, party alignment, or donor→vote causation models.
- Real-time meeting live votes (cache refresh only).
- Full-text search index beyond in-memory filter on cached rows.
- Public deployment beyond localhost.

## Acceptance criteria

1. `GET /campaign-finance` loads the **reimagined** layout with member picker and **Overview / Money / Voting / Transactions** tabs. ✅
2. Selecting a member with both datasets shows **finance overview + voting stats** on Overview. ✅
3. Voting tab lists paginated roll-call rows with **YES/NO/ABSENT** semantics and agenda description. ✅
4. First voting cache build completes via **Refresh voting**; subsequent loads read from disk within ~24h TTL. ✅
5. Nav from `/` and `/police` reaches the combined dashboard; README documents both Socrata datasets. ✅

## API sketch

```
GET /campaign-finance                          → HTML (Council Accountability UI)
GET /api/campaign-finance/summary              → existing
GET /api/campaign-finance/transactions         → existing
GET /api/council-voting/summary                → { meta, members[], global_kpis, date_range_defaults }
GET /api/council-voting/votes                  → ?member=&vote=&q=&from=&to=&limit=&offset=
GET /api/council-accountability/directory      → merged member list
GET /api/council-accountability/member         → combined profile
```

## Follow-up (done)

- **Vote filter** on Voting tab: Yes, No, Abstain, Absent (any), ABSNT, ABSNT_CB, AWVT, N/A, Other — `vote` query param on `/api/council-voting/votes`.
- **Full agenda descriptions** in vote table (no JS truncation).

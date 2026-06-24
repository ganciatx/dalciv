# Feature Implementation Plan

**Overall Progress:** `0%`

## TLDR

Rebuild the **Council Accountability** frontend to match the attached standalone mockup (`Council Accountability (standalone).html`): light civic design system (Public Sans + Source Serif 4, oklch tokens, `.ca-*` layout), React SPA with hero → snapshot → spotlight → watch list → member grid on **Overview**, plus **Money / Voting / Lobbying / Transactions** tabs, first-run guided tour, and footer. **Do not ship the mockup’s fictional `window.CA` placeholder data** — every figure, name, and row must come from the FastAPI layer already connected in `campaign_finance.html` (Socrata caches + aggregations). Replace the current dark-theme `campaign_finance.html` shell at `/council-accountability`.

## Critical Decisions

- **Decision 1: Vite + React + TypeScript package** — Follow the `city-budget-simulator` pattern: new `council-accountability/` app, build to `dashboard/static/council-accountability/`, thin FastAPI template shell. Do **not** ship Babel-standalone in production (mockup bundler is reference only).

- **Decision 2: Visual parity with mockup** — Port mockup CSS and component structure verbatim (masthead, sticky tab bar, hero + 3-step card, freshness chips, grouped snapshot stats, spotlight card, watch grid, 5-column member grid, tab panels, tour overlay, footer). Use Google Fonts CDN for Public Sans + Source Serif 4. Drop the mockup’s illustrative banner and placeholder copy once real data loads.

- **Decision 3: Keep existing backend** — Reuse `council_accountability.py`, `campaign_finance.py`, `council_voting.py`, `lobbyist_registration.py`, `council_headshots.py`, and current API routes. Add only small server helpers if a mockup field is missing from bootstrap (e.g. tab badge counts, `where_money_goes` top expenditures).

- **Decision 4: Adapter only — no placeholder data file** — The mockup ships a `data.js` IIFE that fills `window.CA` with generic districts, fake donors, and seeded random rows. **Do not port or import that file.** Instead, implement `src/api/` adapters that fetch live responses and map them into the mockup’s *component prop shapes* (`snapshot`, `spotlight`, `watch`, `money`, `voting`, `lobbying`, `transactions`, `members`, `updated`). Use the current `campaign_finance.html` fetch calls as the source of truth for which endpoints and fields already work.

- **Decision 5: Real names + headshots** — Member grid and spotlight use live directory data (`display_name`, `district`, `headshot_url`, active/former status) from existing headshot enrichment—not generic “District N” placeholders.

- **Decision 6: Watch list from heuristics** — Map existing `build_watch_list()` output to mockup card format (`member`, `summary`, `tags`); no new legal-inference logic in the UI layer.

## Placeholder → real data (must replace)

The mockup is **layout-only**. During implementation, delete or never add any copy of mockup `data.js`. Wire each UI section to the **already-connected** backend:

| Mockup `window.CA` field | Real source (existing) |
|--------------------------|-------------------------|
| `updated.finance` / `updated.civic` | Cache `fetched_at` from finance / voting / lobby summaries in bootstrap |
| `snapshot.money` (raised, spent, tx, candidates) | `finance` lightweight summary via `/api/council-accountability/bootstrap` |
| `snapshot.voting` (vote records, yes-rate) | `voting` lightweight summary in bootstrap |
| `snapshot.lobbying` (regs, overlap) | `lobbyist` summary + `influence_overlap` in bootstrap |
| `members[]` | `directory.members` from bootstrap + `council_headshots` enrichment (`display_name`, `headshot_url`, district) |
| `spotlight` stats + note | `/api/council-accountability/member?member_id=…` → `finance_overview`, `voting_stats`, `lobbyist_overlap` |
| `watch[]` | `watch_list` from finance insights / `build_watch_list()` (map `title`/`detail`/`candidate` → mockup cards) |
| `money.whereMoneyGoes` | Top expenditure rows from finance summary (add to bootstrap if not exposed yet) |
| `money.bankrolls` | `donor_bankroll` from finance summary |
| `money.top10contrib` / `top10expend` | Existing top-candidate charts data in finance summary |
| `money.monthly` | `monthly` time series from finance summary |
| `voting.rows` | `/api/council-voting/votes` (paginated; never load full 189k cache client-side) |
| `lobbying.overlap` | `influence_overlap` from `/api/lobbyist-registration/summary` |
| `lobbying.registrations` | Lobbyist cache rows via lobby summary / search API |
| `transactions.rows` | Existing campaign-finance transactions API (same as current Transactions tab) |
| Tab badge counts | Row counts from bootstrap summaries (`voting_row_count`, lobby reg count, finance txn count) |

**Explicit removals from mockup behavior:**
- Remove the yellow “Illustrative prototype” banner (`ca-banner`).
- Remove footer line “This prototype uses illustrative placeholder figures.”
- Replace “District N Representative” labels with real `display_name` everywhere.
- Replace generic “Donor A / Vendor 3 / Client group 1” strings with real counterparty names from filings.

## Tasks:

- [ ] 🟥 **Step 1: Scaffold frontend package**
  - [ ] 🟥 Create `council-accountability/` with Vite, React 18, TypeScript (mirror `city-budget-simulator/vite.config.ts` outDir → `dashboard/static/council-accountability/`)
  - [ ] 🟥 Add `dashboard/templates/council_accountability.html` shell (`#root`, asset hashes / version query)
  - [ ] 🟥 Point `/council-accountability` in `app.py` at new template; keep `/campaign-finance` redirect

- [ ] 🟥 **Step 2: Port design system from mockup**
  - [ ] 🟥 Extract mockup `<style>` block into `src/styles/council-accountability.css` (all `.ca-*` rules, responsive breakpoints, reduced-motion)
  - [ ] 🟥 Add Google Fonts link for Public Sans (400–800) and Source Serif 4 (400–600)
  - [ ] 🟥 Verify sticky masthead (64px) + tab bar offset, max-width 1200px, skeleton shimmer states

- [ ] 🟥 **Step 3: Port shared UI primitives** (from mockup `ui.jsx`)
  - [ ] 🟥 `Icon`, `Avatar` (headshot image or district initials + stripes), `StatCard`, `SectionHead`, `EmptyState`, `Pager`, `TablePanel`, `BarList`, `MonthChart`
  - [ ] 🟥 Match mockup props/behavior: tab counts, pagination nouns, empty states, vote/outcome badges

- [ ] 🟥 **Step 4: Port Overview experience** (from mockup `overview.jsx`)
  - [ ] 🟥 `Hero` (headline, lede, “Browse council members”, “Take the 30-second tour”)
  - [ ] 🟥 `Freshness` chips (auto-refreshed; no manual refresh buttons in header)
  - [ ] 🟥 `Snapshot` — 4 money KPIs + voting/lobbying sub-groups with flagged overlap stat
  - [ ] 🟥 `Spotlight` — district picker, 4 mini-stats, conflict note; “View full profile” opens member detail state
  - [ ] 🟥 `WatchList` — disclaimer + 3-column flag cards
  - [ ] 🟥 `MemberBrowse` — 5→4→3→2 col responsive grid; active member highlight; headshots from `/council-images/`

- [ ] 🟥 **Step 5: Port tab panels** (from mockup `tabs.jsx`)
  - [ ] 🟥 **Money** — “Where money goes” + “Who bankrolls whom” tables, top-campaigns `BarList` (contrib/expend toggle), monthly `MonthChart`
  - [ ] 🟥 **Voting** — member/vote-type/search filters, paginated roll-call table, “By member / By agenda item” toggle (agenda item mode can reuse existing agenda-item API)
  - [ ] 🟥 **Lobbying** — influence overlap table, top clients bar list, searchable registrations table
  - [ ] 🟥 **Transactions** — type filter + search, paginated ledger (server-side pagination via existing finance API)

- [ ] 🟥 **Step 6: Port app chrome + tour** (from mockup `app.jsx`, `tour.jsx`)
  - [ ] 🟥 `Masthead` + external nav links (`/`, Legistar, `/police`, `/city-budget`)
  - [ ] 🟥 `TabBar` with icons and live counts (votes, lobby regs, transactions)
  - [ ] 🟥 `Footer` — Dallas Open Data source links, about copy, “Replay the first-load experience”
  - [ ] 🟥 4-step guided tour (`localStorage` `ca_tour_seen`), spotlight ring positioning

- [ ] 🟥 **Step 7: Replace placeholder data with live API adapter**
  - [ ] 🟥 **Do not** copy mockup `data.js` or seed fictional rows — port fetch logic from `campaign_finance.html` into typed `src/api/` modules
  - [ ] 🟥 Initial load: `GET /api/council-accountability/bootstrap` → `snapshot`, `members`, tab counts, default spotlight member (first active councilmember by district)
  - [ ] 🟥 Member change: `GET /api/council-accountability/member?member_id=…` → spotlight raised/spent/yes-rate/lobby ties + conflict note from `lobbyist_overlap`
  - [ ] 🟥 Tab lazy-load: votes (`/api/council-voting/votes`), lobby (`/api/lobbyist-registration/summary`), transactions (existing finance transactions endpoint with `limit`/`offset`)
  - [ ] 🟥 Map existing finance fields: `donor_bankroll`, `monthly`, top candidates, `watch_list`, expenditures → mockup table/chart props (see mapping table above)
  - [ ] 🟥 Format `updated` relative times from cache `fetched_at` timestamps (replace mockup’s hardcoded “47 min ago”)
  - [ ] 🟥 Grep built bundle for mockup placeholder strings (`Donor A`, `District 9 campaign`, `Client group`, `Illustrative prototype`) — must return zero hits

- [ ] 🟥 **Step 8: Backend gaps (minimal)**
  - [ ] 🟥 Extend bootstrap or finance lightweight summary with `where_money_goes` (top expenditure rows) if not already exposed
  - [ ] 🟥 Ensure bootstrap returns aggregate tab counts for Voting / Lobbying / Transactions badges
  - [ ] 🟥 Optional: `watch_list` top-N citywide in bootstrap for Overview (reuse `build_watch_list` on full finance cache)

- [ ] 🟥 **Step 9: Integration & cleanup**
  - [ ] 🟥 `npm run build` wired in README; asset version constant in `app.py` (same pattern as city-budget-simulator)
  - [ ] 🟥 Retire or archive monolithic `campaign_finance.html` once parity verified
  - [ ] 🟥 Smoke-test: cold cache load, member spotlight switch, tour dismiss/replay, mobile breakpoints (620px / 900px)

- [ ] 🟥 **Step 10: Docs**
  - [ ] 🟥 Update `README.md` Council Accountability section (new build path, UI description)
  - [ ] 🟥 Add `CHANGELOG.md` entry for UI rebuild

## Out of scope (this plan)

- New Socrata datasets or cache TTL changes
- Parsing council agenda PDFs / video
- Ideology scores or donor→vote causation models
- Replacing heuristic name matching with a search index
- Public deployment beyond existing localhost / Hostinger patterns

## Acceptance criteria

1. `/council-accountability` visually matches the mockup: typography, colors, spacing, component layout, tour, and five tabs.
2. Overview loads real KPIs on first paint (skeleton → data); no manual refresh buttons in the header.
3. Member grid shows real councilmember names and headshots where available.
4. Money, Voting, Lobbying, and Transactions tabs use live API data with working filters and pagination.
5. Watch list and influence overlap use existing heuristic backend logic with mockup-style disclaimer copy.
6. `npm run build` produces static assets served by FastAPI without Babel/React CDN at runtime.
7. **No mockup placeholder data remains** — all KPIs, names, table rows, and chart series reflect Dallas Open Data via existing caches/APIs; illustrative banner and prototype disclaimer removed.

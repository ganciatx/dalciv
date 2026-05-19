# Issue: Council page — agenda-item view (vote-centric)

**Type:** `feature` • **Priority:** `normal` • **Effort:** `medium` • **Status:** fixed in tree

## TL;DR

Council Accountability (`/campaign-finance`) is **member-first** (pick a councilmember → see their votes). Add a **second lens**: browse by **agenda item / roll call** — date, full description, outcome tallies (e.g. 12 yes, 2 no, 1 abstain), and a breakdown of how each member voted.

## Current vs expected

| | |
|---|---|
| **Current** | Global member directory + filters; Voting tab lists rows **per member vote** (`/api/council-voting/votes?member_id=…`). Hard to answer “what happened on this agenda item?” without mentally grouping rows. |
| **Expected** | User can switch (or add a tab/mode) to **By agenda item**: select or search an item → see metadata, pass/fail or `final_action_taken`, vote counts, and a councilmember roll-call table for that item only. |

## Data already available

Socrata `ts5d-gdq6` rows (normalized in `council_voting.normalize_vote_row`) include:

- `vote_id` — likely groups one roll call (many rows, one per member)
- `agenda_id`, `agenda_item_number`, `description`, `date`, `item_type`, `final_action_taken`
- Per member: `member_name`, `district`, `vote`, `vote_category`

**Grouping key:** `agenda_id` + `agenda_item_number` + `date` (not `vote_id` — Dallas data uses one `vote_id` per member row).

## Proposed UX (minimal)

- **View toggle** on Voting tab (or new sub-tab): `By member` | `By agenda item` (keep existing member flow unchanged).
- **Agenda list** — searchable/paginated table: date, item #, description snippet, yes/no/abstain/absent counts, outcome badge.
- **Agenda detail** — click row → panel with full description, `final_action_taken`, date, and table: Member | District | Vote.
- Reuse existing vote filters where sensible (date range, text search on description).

## Implementation sketch

1. **Backend** — `council_voting.py`:
   - `group_rows_by_roll_call(rows) -> list[dict]` with tallies (`yes`, `no`, `abstain`, `absent`, `other`) and `members: [{member_id, name, district, vote, vote_category}]`.
   - `GET /api/council-voting/agenda-items` — paginated index (q, from, to, limit, offset).
   - `GET /api/council-voting/agenda-items/{vote_id}` — single roll-call detail (or query param `?vote_id=`).
2. **Frontend** — `campaign_finance.html` Voting section: toggle + list + detail renderers (mirror member table styling).
3. **Performance** — build roll-call index from cache in memory on first request or precompute in cache file (see `ISSUE-council-police-slow-load.md`); avoid scanning 189k rows on every keystroke.

## Files

- `dashboard/council_voting.py` — grouping, new payloads, routes
- `dashboard/app.py` — wire `/api/council-voting/agenda-items` endpoints
- `dashboard/templates/campaign_finance.html` — view toggle, list/detail UI

## Acceptance criteria

- User can open `/campaign-finance` → Voting → **By agenda item** without selecting a member first.
- Selecting an agenda item shows correct yes/no (and abstain/absent) counts and each councilmember’s vote.
- Member-centric view still works as today.
- Empty/search states are handled; long descriptions use existing full-text display (no truncation regression).

## Risks / notes

- **Fixed:** `vote_id` is per-member, not per roll call — index groups by `agenda_id` + item + date.
- **Large cache** — indexing ~189k rows may add memory/time; consider persisted `agenda_index.json` beside `council_voting_cache.json`.
- **Outcome label** — `final_action_taken` may not always match numeric tally; show both when they disagree.
- Related: `ISSUE-council-police-slow-load.md` (parallel loads / cache warm may help this feature feel fast).

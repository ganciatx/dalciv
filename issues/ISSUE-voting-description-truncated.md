# Issue: Voting tab agenda descriptions truncated

**Type:** `bug` • **Priority:** `normal` • **Effort:** `small` • **Status:** fixed in tree

## TL;DR

On the **Voting** tab (and Overview recent roll calls), agenda item text is cut off mid-sentence. Users cannot tell what council actually voted on.

## Current vs expected

| | |
|---|---|
| **Current** | Description column shows ~120–160 characters + `…` (JS `slice` + narrow column / `nowrap`). |
| **Expected** | Full `agenda_item_description` visible in the table (wrap across lines; date/vote/district columns stay compact). |

## Root cause

- `renderVotesTable()` in `campaign_finance.html` hard-caps description at 160 chars.
- `renderRecentVotes()` caps at 120 chars.
- Table layout does not allow the description cell to wrap.

## Fix (implemented)

- Remove client-side truncation; render full escaped description.
- CSS: `.vote-desc` / `#votes-table .col-description` — `white-space: normal`, `word-break: break-word`, sensible `min-width`.

## Files

- `dashboard/templates/campaign_finance.html` — `renderVotesTable`, `renderRecentVotes`, vote table CSS

## Notes

- Long descriptions will make rows taller; `#votes-table` wrapper already scrolls.
- No API change — full text is already in `description` from `council_voting.py`.

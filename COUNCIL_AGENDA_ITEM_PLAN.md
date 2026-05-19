# Council Agenda Item View Plan

**Overall Progress:** `100%`

## TLDR

Voting tab on `/campaign-finance` now supports **By member** (unchanged) and **By agenda item** — browse roll calls with yes/no tallies and drill into full council votes.

## Tasks

- [x] 🟩 **Backend** — `roll_call_key`, `build_roll_call_index`, cached index, `get_agenda_items_payload`, `get_agenda_item_payload`
- [x] 🟩 **Routes** — `GET /api/council-voting/agenda-items`, `GET /api/council-voting/agenda-item?roll_call_id=`
- [x] 🟩 **Frontend** — view toggle, agenda table, detail panel, search + pagination
- [x] 🟩 **Command portal** — new endpoints listed under Council APIs
- [x] 🟩 **Docs** — `README.md`, issue closed

## Files

| Path | Role |
|------|------|
| `dashboard/council_voting.py` | Grouping + payloads |
| `dashboard/app.py` | API routes |
| `dashboard/templates/campaign_finance.html` | Voting tab UI |
| `issues/ISSUE-council-agenda-item-view.md` | Original issue |

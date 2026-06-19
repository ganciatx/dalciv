# Phase 10 should show each player's required phase goal

**Status: ✅ Implemented**

| Field | Value |
|-------|-------|
| **Type** | feature |
| **Priority** | normal |
| **Effort** | medium |
| **Area** | Phase 10 live scoring |

## TL;DR

Live scoring only shows a phase **number** badge (`P4`) next to each player. Players can't see **what they actually need to lay down** to mark "made" and advance — the core info on a physical Phase 10 score pad.

## Current behavior

- `Phase10Scoring.tsx` displays `P{currentPhase}` badge beside each player name during round entry.
- A collapsible **Point reference** shows card point values (5/10/15/25) — helpful for scoring, not for knowing the phase requirement.
- "made" checkbox tracks completion but gives no context on what was supposed to be made.
- Standings sidebar / leaderboard chips show name + total only — no phase goal text.

## Expected behavior

Each player should always see **which phase they are on and what that phase requires**, e.g.:

| Phase | Requirement (standard deck) |
|-------|----------------------------|
| 1 | 2 sets of 3 |
| 2 | 1 set of 3 + 1 run of 4 |
| 3 | 1 set of 3 + 1 run of 7 |
| 4 | 1 run of 7 |
| 5 | 1 run of 8 |
| 6 | 1 run of 9 |
| 7 | 2 sets of 4 |
| 8 | 7 cards of one color |
| 9 | 1 set of 5 + 1 set of 2 |
| 10 | 1 set of 5 + 1 set of 3 |

**UX suggestions (wireframe-aligned):**
- Show requirement inline under or beside the `P#` badge on the active round card (primary).
- Optionally show a compact phase goal in the standings panel / player header row.
- Tap badge or `?` icon → expand full requirement text if space is tight on mobile.
- Players who finished Phase 10 (`currentPhase > 10`) should show a clear "Done" / "Finished" state instead of a requirement.

## Relevant files

1. `src/games/phase10Phases.ts` *(new)* — static list of phase # → requirement label (and optional short label for badges)
2. `src/games/definitions.ts` — attach phase list to Phase 10 `GameDefinition` config
3. `src/components/scoring/Phase10Scoring.tsx` — render requirement text per player in round entry + past rounds (read-only)

## Notes / risks

- **Edition variants:** Original vs Masters Phase 10 phase lists differ slightly — pick one as default (Masters is most common today) and note in UI or settings if variants matter later.
- Spec §4.2 only requires a phase **number** badge; this adds requirement text — aligns with "faithfully reproduce the scoring structure" goal but is beyond current MVP spec wording.
- Reference-only display — no need to validate that the player actually made the right combo (same as MVP: manual "made" toggle + score entry).
- Keep copy concise on small screens; wireframe uses `P4` badges — add a second line or tooltip rather than replacing the badge.

## Test plan

- [ ] Player on Phase 1 sees "2 sets of 3" (or equivalent short label)
- [ ] Each phase 1–10 shows the correct requirement
- [ ] Requirement updates after "made" is checked and round is saved
- [ ] Player who hasn't made phase re-shows same requirement next round
- [ ] Completed player (past Phase 10) shows finished state, not Phase 11 requirement
- [ ] Layout readable with 4–6 players on mobile

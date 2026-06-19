# Yahtzee category scores should enforce per-box maximums

**Status: ✅ Implemented**

| Field | Value |
|-------|-------|
| **Type** | improvement |
| **Priority** | normal |
| **Effort** | medium |
| **Area** | Yahtzee live scoring |

## TL;DR

Yahtzee sum-category cells accept any non-negative number today (e.g. 99 in Threes). The official scorecard caps each box — upper section by die face × 5, lower sum boxes at 30 — so invalid scores should be blocked at entry time.

## Current behavior

- `submitKeypad()` in `YahtzeeScoring.tsx` only rejects negative values (`num < 0`).
- Fixed categories (Full House 25, Small Straight 30, Large Straight 40, Yahtzee 50) are already tap-only: fill fixed value or Scratch (0). ✅
- **Upper section** (Ones–Sixes): free numeric entry with no max — user can enter values above the physical maximum (e.g. 20 in Fours when max is 20… or 999).
- **Lower sum categories** (Three of a Kind, Four of a Kind, Chance): free numeric entry with no max — user can exceed 30 (max sum of five dice).

## Expected behavior (per official scorecard)

Each category should only accept **0 (scratch)** or a value within the legal range:

| Category | Allowed values | Max |
|----------|----------------|-----|
| Ones | 0, 1, 2, 3, 4, 5 | 5 (1×5) |
| Twos | 0, 2, 4, 6, 8, 10 | 10 |
| Threes | 0, 3, 6, 9, 12, 15 | 15 |
| Fours | 0, 4, 8, 12, 16, 20 | 20 |
| Fives | 0, 5, 10, 15, 20, 25 | 25 |
| Sixes | 0, 6, 12, 18, 24, 30 | 30 |
| Three of a Kind | 0–30 | 30 |
| Four of a Kind | 0–30 | 30 |
| Chance | 0–30 | 30 |
| Full House / Sm Straight / Lg Straight / Yahtzee | fixed or 0 | already enforced |

**Upper-section nuance:** scores must be multiples of the face value (can't score 7 in Threes). Consider rejecting invalid multiples, not just over-max values.

**UX:** On invalid submit, show inline feedback in the keypad modal (e.g. “Max for Fours is 20”) rather than silently ignoring input.

## Relevant files

1. `src/games/yahtzeeCategories.ts` — add `maxScore` (and optionally `step` / face value) to category metadata
2. `src/utils/scoring.ts` or new `src/utils/yahtzeeValidation.ts` — `isValidYahtzeeScore(categoryId, value): boolean` + human-readable error message
3. `src/components/scoring/YahtzeeScoring.tsx` — call validator in `submitKeypad()`; optionally disable ↵ until valid

## Notes / risks

- Spec §5 currently says MVP-minimal validation is `≥ 0` + fixed-category tap-only — this issue extends that intentionally; update spec if we ship it.
- Yahtzee bonus chips (+100 each) are separate from category cells and out of scope.
- Validation should be shared (not duplicated) so tablet grid and mobile single-player flows stay in sync.

## Test plan

- [ ] Ones accepts 0–5 in steps of 1; rejects 6+
- [ ] Sixes accepts 0, 6, 12, 18, 24, 30; rejects 7, 31
- [ ] Three of a Kind / Four of a Kind / Chance accept 0–30; reject 31
- [ ] Fixed categories still only allow tap fill or Scratch
- [ ] Invalid entry shows error message; score is not saved

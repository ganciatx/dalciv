# Yahtzee upper section should offer tap-to-fill score multiples

**Status: ✅ Implemented**

| Field | Value |
|-------|-------|
| **Type** | improvement |
| **Priority** | normal |
| **Effort** | medium |
| **Area** | Yahtzee live scoring |

## TL;DR

Upper-section categories require multiples of the die face (0, 3, 6, 9… for Threes), but the Yahtzee keypad is digit-entry only with no quick picks. Tapping legal multiples would be faster and prevent invalid entries before submit.

## Current behavior

- Sum-category modal uses `ScoreKeypad` with `quickValues={[]}` — full numeric keypad only.
- Phase 10 uses quick chips (+5/+10/+15/+25) that **add** to the current value; Yahtzee has no equivalent.
- Issue #001 added validation + hint text (`0–15, multiples of 3`) but still requires typing.
- Upper section metadata already exists: `faceValue` and `maxScore` on each category in `yahtzeeCategories.ts`.

## Expected behavior

**Upper section (primary):** When entering Ones–Sixes, show tappable chips for every **legal score** for that category:

| Category | Quick-pick values |
|----------|-------------------|
| Ones | 0, 1, 2, 3, 4, 5 |
| Twos | 0, 2, 4, 6, 8, 10 |
| Threes | 0, 3, 6, 9, 12, 15 |
| … | … up to face × 5 |

- Tap a chip → sets the value (and optionally auto-submits, or user taps ↵ to confirm).
- Include **0** as a visible chip (same as Scratch) or keep separate Scratch button — either is fine; 0 should be one tap.
- Digit keypad can remain for power users, or be de-emphasized/hidden on upper categories if chips cover all legal values.

**Lower sum boxes (optional stretch):** Three/Four of a Kind and Chance allow any 0–30 — less benefit from multiples, but a 0–30 grid or common-value chips could be a follow-up. **Out of scope unless trivial** — focus upper section first.

## Relevant files

1. `src/utils/yahtzeeValidation.ts` — add helper e.g. `getYahtzeeQuickPicks(category): number[]` derived from `faceValue` / `maxScore`
2. `src/components/ScoreKeypad.tsx` — support **set-on-tap** mode (vs current Phase 10 **add-on-tap**); e.g. `quickMode: 'add' | 'set'`
3. `src/components/scoring/YahtzeeScoring.tsx` — pass upper-section quick picks into keypad modal; wire tap → validate → save

## Notes / risks

- Reuse `validateYahtzeeScore()` on chip tap so behavior stays consistent with manual entry.
- Six chips (0 + five multiples) fit on mobile if laid out in a 3×2 or horizontal scroll row — wireframe Phase 10 keypad is the layout reference.
- Don't break Phase 10 / Generic keypads: default `quickMode: 'add'` preserves current additive chips.
- Upper section chips replace most typing need; invalid values become harder to enter by design.

## Test plan

- [ ] Threes modal shows 0, 3, 6, 9, 12, 15 chips; tap 12 fills display and submits correctly
- [ ] Sixes shows 0, 6, 12, 18, 24, 30
- [ ] Tap 0 / Scratch both score 0
- [ ] Manual keypad entry still works (if kept)
- [ ] Phase 10 quick chips still add (not replace) values
- [ ] Fixed categories unchanged (tap fill / Scratch menu)

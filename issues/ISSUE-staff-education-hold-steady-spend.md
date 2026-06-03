# Issue: Staff recommendations show absurd education spend (Education & EDC advisor)

**Type:** `bug` • **Priority:** `high` • **Effort:** `small` • **Status:** fixed

## TL;DR

Policy advisor counsel—especially **Sofia Reyes** (Education & economic development director)—reports hold-steady gaps and implied dollar amounts in the **tens of thousands of millions** (e.g. “22,000M below hold-steady”). Recommended education line items are capped at $280M while the math behind the warning is wrong.

## Current vs expected

| | Behavior |
|---|----------|
| **Current** | `eduHoldSteady()` ≈ **$22,200M** for default enrollment (185k). Urgent copy cites `eduGap` in the thousands of millions. Player sees nonsensical spend language; “Apply recommendation” may not match the scary warning. |
| **Expected** | Hold-steady K–12 spend ≈ **$200M** scale (aligned with scenario baseline ~198M and `perPupilSpending` ~11.2M per 10k students). Advisor gap text uses realistic millions (e.g. “18M below hold-steady”). |

## Root cause (suspected)

`eduHoldSteady` in `staff.ts` duplicates `education.ts` but uses:

```ts
Math.round(enrollment * 0.012 * 10)
```

With `enrollment = 185_000` → **22,200** (game units = millions).

Hold-steady should scale by **enrollment / 10_000**, not raw enrollment—same pattern as `perPupilSpending`:

```ts
spend / Math.max(1, enrollment / 10_000)
```

Correct shape is likely:

```ts
Math.round((enrollment / 10_000) * holdSteadyPer10k)  // ~11.2 → ~207M
```

The constant `0.012 * 10` (0.12) may also be stale vs baseline `perPupilSpending: 11.2` in `createInitialEducation`.

## Impact

- **UI:** Misleading urgent advisor copy for development/education advisor.
- **Simulation:** Same formula in `education.ts` `updateEducation()`—school quality may always treat budgets as massively underfunded (gap > 15 every year).

## Files

- `city-budget-simulator/src/simulation/staff.ts` — `eduHoldSteady`, `developmentAdvice` gap text & `education` recommendation cap
- `city-budget-simulator/src/simulation/education.ts` — shared `HOLD_STEADY_PER_PUPIL` / hold-steady calculation (dedupe into one export)

## Fix direction

1. Export a single `educationHoldSteadySpend(enrollment)` (or use state’s target per-10k rate) from `education.ts`.
2. Use it in `staff.ts` and `updateEducation`.
3. Add unit test: 185k enrollment → hold-steady in ~200M band, not 20,000+.
4. Smoke-test Staff panel + Development panel sliders after “Apply recommendation”.

## Acceptance criteria

1. Education advisor urgent detail shows gap on the order of **tens of millions**, not thousands.
2. `formatMillions(eduHoldSteady(state))` displays **~$200M**, not **$22B+**.
3. At default scenario funding (~198M education), advisor is not permanently “urgent” solely due to math error.
4. `updateEducation` hold-steady gap uses the same corrected formula.

## Notes / risk

- Deduplicating the formula touches **both** advice UX and year-end education outcomes—verify a year advance after fix doesn’t flip balance from “always crisis” to “always fine.”
- Check other advisors for similar unit mistakes (infrastructure `infraHoldSteady` sums `maintenanceToHold` per asset—different pattern, likely OK).

# Scorekeeper MVP — Implementation Tracker

**Overall progress: 100%**

## MVP core

| Step | Task | Status |
|------|------|--------|
| 1 | Project scaffold (Vite + React + TS + Router) | ✅ Done |
| 2 | Core types, game definitions, storage adapter | ✅ Done |
| 3 | Scoring utilities (Yahtzee, Phase 10, rounds) | ✅ Done |
| 4 | Game session context + routing shell | ✅ Done |
| 5 | Landing + Game Picker + Player Setup pages | ✅ Done |
| 6 | Yahtzee scoring UI (player-at-a-time + tablet grid) | ✅ Done |
| 7 | Phase 10 scoring UI (round-card stack + keypad) | ✅ Done |
| 8 | Mexican Train scoring UI | ✅ Done |
| 9 | Generic scoreboard UI | ✅ Done |
| 10 | Game Over + History + end-condition banner | ✅ Done |
| 11 | Responsive styles (wireframe-aligned) + build verify | ✅ Done |

## Follow-up issues

| Issue | Task | Status |
|-------|------|--------|
| [#001](issues/001-yahtzee-category-max-validation.md) | Yahtzee per-box max + multiple validation | ✅ Done |
| [#002](issues/002-phase10-show-phase-requirements.md) | Phase 10 show phase goal requirements | ✅ Done |
| [#003](issues/003-yahtzee-upper-section-quick-picks.md) | Yahtzee upper-section tap-to-fill multiples | ✅ Done |
| — | UI theme — game-night visual redesign | ✅ Done |
| — | Yahtzee readability — sans-serif scoring UI | ✅ Done |

## New games

| Feature | Task | Status |
|---------|------|--------|
| [License Plate Game plan](license-plate-game-plan.md) | Checklist mode · US/Canada regions · competitive/cooperative | ✅ Done |
| Tic Tac Toe | Board mode · 2-player pass-and-play · round win tracking | ✅ Done |

**Design reference:** `Scorekeeper-Wireframes.pptx` + warm felt table / cream score-pad aesthetic, DM Sans (Fraunces on landing title only), per-game accents, `PlayerChip` markers.

**Run:** `npm install && npm run dev`

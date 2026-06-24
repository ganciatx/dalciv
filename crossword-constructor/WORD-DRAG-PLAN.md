# Feature Implementation Plan

**Overall Progress:** `0%`

## TLDR

Add a **left-side answer palette** to the grid workspace so constructors can drag words/phrases onto the grid for faster building. The drop target cell becomes the word's **first letter**; an **Across / Down** toggle (plus live preview) makes direction easy to switch before committing.

## Critical Decisions

- **Left sidebar, not right** — Restructure `GridWorkspace` to `[AnswerPalette | grid | existing right panels]`. Keeps Assist/WordEntry on the right; the draggable working list lives beside the grid where placement happens.
- **Puzzle-scoped answer bank** — Add `answerBank: string[]` on `Puzzle` (persisted via autosave/library/export). User adds entries manually or via "Add to bank" from Assist theme results. Avoids coupling drag UX to live search results.
- **Anchor-based placement** — New `getPlacementCells(grid, row, col, direction, word)` in `lib/grid.ts`. Drop cell = index 0; extend in chosen direction for `word.length`. Reuse existing `fillWordInGrid`.
- **Mirror black-square drag pattern** — New `useWordDrag` hook (like `useBlackSquareDrag`) with `WORD_DRAG_TYPE`, store preview state (`wordDragPreview`), and cell drop handlers on `GridCanvas`.
- **Easy direction switching** — (1) Segmented **Across / Down** control in the palette sets default placement direction. (2) **Shift** while dragging flips direction. (3) Live preview highlights cells + shows letters before drop. Default direction follows current `selection.direction`.
- **Validate before commit** — Preview turns invalid (out of bounds, black square, letter conflict) red; drop is rejected with no grid change. Crossing letters must match existing letters or be empty.

## Tasks

- [ ] 🟥 **Step 1: Answer bank data model & store**
  - [ ] 🟥 Add `answerBank?: string[]` to `Puzzle` type
  - [ ] 🟥 Store actions: `addAnswer`, `removeAnswer`, `reorderAnswer`, `setPlacementDirection`
  - [ ] 🟥 Persist `answerBank` in autosave, library, and JSON export/import
  - [ ] 🟥 Store action: `placeWordAt(row, col, direction, word)` — `pushHistory`, `fillWordInGrid`, `recalculateNumbers`, update `selection`

- [ ] 🟥 **Step 2: Anchor placement utilities**
  - [ ] 🟥 `getPlacementCells(grid, row, col, direction, word)` — returns cell coords from anchor
  - [ ] 🟥 `validatePlacement(grid, cells, word)` — bounds, blacks, crossing-letter conflicts
  - [ ] 🟥 Unit tests for valid/invalid placements (across, down, conflicts, edge of grid)

- [ ] 🟥 **Step 3: Word drag hook & preview state**
  - [ ] 🟥 `useWordDrag` hook: drag start (word in `dataTransfer`), drag end, cell `onDragOver` / `onDrop` / `onDragLeave`
  - [ ] 🟥 Store state: `wordDragPreview` (`{ word, row, col, direction, cells, valid }`), `placementDirection`
  - [ ] 🟥 Shift-key listener during drag to flip preview direction
  - [ ] 🟥 On valid drop: call `placeWordAt`; on invalid drop: no-op + brief feedback

- [ ] 🟥 **Step 4: Answer palette UI (left sidebar)**
  - [ ] 🟥 `AnswerPalette.tsx` — scrollable list of bank entries (mono font, length badge)
  - [ ] 🟥 Draggable list items (`draggable`, grab cursor, same pattern as `BlackSquarePalette`)
  - [ ] 🟥 Manual add input + Enter to append; remove button per entry
  - [ ] 🟥 Across / Down segmented toggle bound to `placementDirection`
  - [ ] 🟥 Optional: "Add to bank" button on Assist theme candidates

- [ ] 🟥 **Step 5: Grid integration**
  - [ ] 🟥 Wire `useWordDrag` drop handlers into `GridCanvas` cells (alongside existing black-square handlers)
  - [ ] 🟥 Render word-drag preview overlay on cells (valid = blue highlight + ghost letters; invalid = red)
  - [ ] 🟥 Update `GridWorkspace` layout: left `AnswerPalette` (`w-56`), center grid, right panels unchanged

- [ ] 🟥 **Step 6: Tests & polish**
  - [ ] 🟥 Unit tests: `placeWordAt` store action, answer bank round-trip persistence
  - [ ] 🟥 Component test: drag word onto grid cell places letters at anchor in selected direction
  - [ ] 🟥 Empty bank placeholder text; disable drag on invalid preview

## Out of Scope

- Autofill / backtracking solver
- Multi-cell rebus phrases from drag (single-letter-per-cell words only for v1)
- Dragging directly from WordEntryPanel or filler suggestions (bank + Assist "Add to bank" only)
- Symmetric auto-placement of theme pairs (user places each word manually)

## Suggested Build Order

Steps 1 → 2 → 3 → 5 → 4 → 6

Core placement logic first; hook + grid preview next; palette UI last so drag behavior is testable early.

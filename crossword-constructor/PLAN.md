# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Build **Crossword Constructor**, a desktop-oriented single-page web app that helps crossword constructors design NYT- and WSJ-compliant puzzles. The app covers three integrated workflows—grid design with live compliance feedback, word/fill management from a scored word list, and clue writing—with local persistence and export to `.puz`, plain-text, PDF, and JSON formats.

## Feature Addendum: Puzzle Library Management

- [x] 🟩 **In-app puzzle management (home screen)**
  - [x] 🟩 IndexedDB puzzle library (full puzzle storage)
  - [x] 🟩 List, open, rename, delete from UI
  - [x] 🟩 Autosave syncs to library; legacy autosave migration
  - [x] 🟩 Delete clears matching autosave recovery slot

## Bugfix Addendum: Session Proliferation

- [x] 🟩 **Stop spurious puzzle sessions on page load**
  - [x] 🟩 Decouple autosave from recent-list writes
  - [x] 🟩 Track recent only on new/open/save
  - [x] 🟩 Skip autosave on home workspace
  - [x] 🟩 Unit tests for persistence behavior


- [x] 🟩 **Drag-and-drop black square placement**
  - [x] 🟩 Draggable black-square token in grid toolbar
  - [x] 🟩 Drop / drag-over painting on grid cells
  - [x] 🟩 Auto-place 180° symmetric partner (when symmetry enabled)
  - [x] 🟩 Live drop preview highlighting both affected cells
  - [x] 🟩 Single undo step per drag session

## Critical Decisions

- **React 18 + TypeScript + Vite** — Spec-recommended stack; fast dev loop, strong typing, static deploy.
- **Zustand for state** — Lightweight store for nested grid/clue/validation state without Redux overhead.
- **Custom grid component** — No third-party crossword library; required for symmetry enforcement, compliance highlighting, and rebus support.
- **Tailwind + CSS Grid for layout; custom CSS for cells** — Tailwind for chrome; precise cell sizing/numbering needs dedicated grid styles.
- **IndexedDB (via idb or Dexie) for word list; localStorage for puzzle autosave** — Matches spec; keeps word list queryable offline without a backend.
- **sql.js (WASM) or in-memory JSON index for word search** — Pattern search over 150k–200k entries; evaluate sql.js vs. pre-built trie/index at implementation time.
- **puzjs for `.puz` export** — Industry-standard binary format for NYT/WSJ.
- **Bundled clue dataset (offline)** — Clue lookup uses a local dataset, not a live API (per spec assumption).
- **Publication target (`NYT` | `WSJ`) drives all validation thresholds** — Single toggle re-evaluates word-count limits, title requirements, and export formats.

## Tasks

- [ ] 🟥 **Step 1: Project Scaffolding**
  - [ ] 🟥 Initialize Vite + React 18 + TypeScript project
  - [ ] 🟥 Add Tailwind CSS, Zustand, Vitest, React Testing Library
  - [ ] 🟥 Configure path aliases, ESLint, and base folder structure (`components/`, `stores/`, `lib/`, `types/`, `data/`)
  - [ ] 🟥 Add app shell with persistent nav bar placeholder (Grid | Words | Clues tabs)

- [ ] 🟥 **Step 2: Core Data Models & Puzzle Store**
  - [ ] 🟥 Define TypeScript types: `Puzzle`, `Cell`, `WordEntry`, `ValidationIssue`, `PublicationTarget`
  - [ ] 🟥 Implement Zustand puzzle store (grid, clues, metadata, selection, undo/redo history)
  - [ ] 🟥 Implement grid numbering utility (standard crossword numbering rules)
  - [ ] 🟥 Implement word-slot extraction (Across/Down answers from grid state)

- [ ] 🟥 **Step 3: Grid Workspace — Canvas & Interactions**
  - [ ] 🟥 Build `GridCanvas` component (15×15 / 21×21, white/black cells, cell numbers)
  - [ ] 🟥 Cell selection, direction toggle (Across/Down), cursor movement (arrows, Tab to next empty)
  - [ ] 🟥 Letter entry with auto-advance; Backspace/Delete behavior
  - [ ] 🟥 Black-square toggle (click black cell, right-click, Space shortcut)
  - [ ] 🟥 Grid toolbar: size selector, symmetry toggle, clear/reset (with confirm), zoom (75–150%), rebus mode
  - [ ] 🟥 180° rotational symmetry enforcement on black-square placement (with disable toggle + yellow violation indicator)
  - [ ] 🟥 Brief highlight of symmetric pairs on placement

- [ ] 🟥 **Step 4: Grid Side Panel & Live Stats**
  - [ ] 🟥 Word Entry Panel: current slot context, pattern display, one-click fill from suggestions
  - [ ] 🟥 Live Stats Bar: word count vs. max, black-square %, avg word length, 3-letter count, fill completion %

- [ ] 🟥 **Step 5: Validation & Compliance Engine**
  - [ ] 🟥 Implement all rules from spec Section 14 (E/W/I levels): symmetry, interlock, unchecked, min length, word count, black density, low-score words, crosswordese, duplicates, proper-noun cluster (WSJ), rebus, missing title, incomplete clues, near-duplicates
  - [ ] 🟥 Re-evaluate rules on every grid/clue change; NYT vs. WSJ thresholds
  - [ ] 🟥 Compliance Panel: grouped by severity, clickable navigation to offending cell/word
  - [ ] 🟥 Nav-bar compliance badge (green / yellow / red error count)

- [ ] 🟥 **Step 6: Word List & Fill Management**
  - [ ] 🟥 Bundle default word list (~150k–200k entries with score 1–100 and tags)
  - [ ] 🟥 IndexedDB storage; load/index on first launch
  - [ ] 🟥 Pattern search (`?` wildcards), sorted by score; slot-length constraint when grid cell selected
  - [ ] 🟥 Filters: min score, exclude proper nouns / abbreviations / crosswordese, max length
  - [ ] 🟥 Custom word list upload (CSV/plain text); manual add/edit/exclude entries
  - [ ] 🟥 Words workspace UI: browser, search, filters
  - [ ] 🟥 Grid cell color-coding by word score (green/yellow/red/gray)
  - [ ] 🟥 Duplicate answer and root-form near-duplicate detection

- [ ] 🟥 **Step 7: Clue Management**
  - [ ] 🟥 Clues workspace: two-column layout (Across | Down) with number, answer, inline clue input, completion indicator
  - [ ] 🟥 Tab/Shift-Tab navigation between clue fields; auto-save on blur
  - [ ] 🟥 Completion tracker (N of M per direction)
  - [ ] 🟥 Clue quality hints: duplicate clue text, question-mark convention, abbreviation hint
  - [ ] 🟥 Clue database search panel (bundled dataset, search by answer, one-click copy)
  - [ ] 🟥 WSJ title field (required, ≤60 chars, hint about theme answers) when target is WSJ
  - [ ] 🟥 Ctrl+G jump from clue to corresponding grid cell

- [ ] 🟥 **Step 8: Publication Guidance System**
  - [ ] 🟥 Collapsible guidance sidebar (? icon / F1 / Ctrl+?)
  - [ ] 🟥 Quick-reference card per publication (NYT vs. WSJ requirements)
  - [ ] 🟥 Phase-aware tips: empty grid, partial fill, fill complete, clue writing, pre-export

- [ ] 🟥 **Step 9: Export**
  - [ ] 🟥 Export modal with pre-export checklist (block on errors; acknowledge warnings)
  - [ ] 🟥 Across Lite `.puz` via puzjs (NYT + WSJ)
  - [ ] 🟥 NYT plain-text format (grid + clues)
  - [ ] 🟥 WSJ plain-text format (grid lines with spaces for blacks; tab-delimited clues)
  - [ ] 🟥 PDF solve view (grid + clues, no answers)
  - [ ] 🟥 JSON backup (full puzzle state, re-importable)

- [ ] 🟥 **Step 10: Persistence & Session Management**
  - [ ] 🟥 Autosave to localStorage every 30s and on significant actions
  - [ ] 🟥 Restore prompt on load if unsaved session exists
  - [ ] 🟥 Save As / Open: `.json` (internal) and `.puz` import
  - [ ] 🟥 Home screen with recently opened puzzles (name + last-modified from localStorage)
  - [ ] 🟥 New / Open / Save buttons in nav bar

- [ ] 🟥 **Step 11: Keyboard Shortcuts & Polish**
  - [ ] 🟥 Implement all shortcuts from spec Section 12 (undo/redo, save, export, focus search, guidance toggle)
  - [ ] 🟥 Inline editable puzzle title in nav bar
  - [ ] 🟥 Publication target selector (NYT / WSJ) wired to validation + export + UI conditionals

- [ ] 🟥 **Step 12: Testing & Build**
  - [ ] 🟥 Unit tests: numbering, symmetry, interlock, word-count, pattern search
  - [ ] 🟥 Component tests: grid interactions, compliance panel, clue editor
  - [ ] 🟥 Vite production build verified as static deploy

## Out of Scope (Do Not Implement in v1)

- Direct submission to NYT/WSJ
- Collaborative multi-user editing
- Full auto-fill / constraint-propagation engine
- Cryptic crossword formats
- Mobile-first or native mobile app
- Account system or cloud sync

## Suggested Build Order

Steps 1 → 2 → 3 → 5 → 4 → 6 → 7 → 10 → 9 → 8 → 11 → 12

Validation (Step 5) follows core grid (Step 3) so compliance feedback is available early; persistence (Step 10) before export (Step 9) so puzzles can be saved during development.

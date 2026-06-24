# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Add an **Assist** panel to Crosscreate that helps constructors brainstorm theme entries and pick better filler words. Assist stays suggestive and user-driven—no autonomous grid fill. Theme ideas come from a seed phrase or puzzle title; filler suggestions reuse the existing word list with crossing-aware, quality-ranked search. Optional AI (user-provided API key) extends theme ideation only; filler remains offline.

## Critical Decisions

- **Suggest, don't autofill** — Assist proposes candidates; the user applies them via existing `fillCurrentWord` / slot selection. Aligns with v1 out-of-scope (no constraint-propagation engine).
- **Theme metadata on `Puzzle`** — Add optional `themeConcept` and `themeSlotNumbers` so assist and validation can distinguish theme from filler without changing export formats.
- **Local-first filler assist** — Enhance `searchWords` with crossing-letter constraints and duplicate/crosswordese penalties; no network required.
- **Optional AI for theme ideation only** — User-supplied API key in local settings; graceful fallback to local tag/pattern search when unavailable.
- **Grid workspace integration** — New collapsible Assist panel beside `WordEntryPanel`, phase-aware like `GuidanceSidebar` (empty grid → theme; partial fill → filler).

## Tasks

- [x] 🟩 **Step 1: Theme metadata & store actions**
  - [x] 🟩 Extend `Puzzle` type with `themeConcept?: string` and `themeSlotNumbers?: number[]`
  - [x] 🟩 Add store actions: `setThemeConcept`, `toggleThemeSlot`, `applyThemeWord` (fill slot + mark as theme)
  - [x] 🟩 Persist new fields in autosave, library, and JSON export/import

- [x] 🟩 **Step 2: Theme word assist (local)**
  - [x] 🟩 Add `lib/themeAssist.ts`: given concept + target length(s), search word list by substring, `domain:*` tags, and score
  - [x] 🟩 Return ranked theme candidates with length filters (common theme lengths: 9–15 for 15×15)
  - [x] 🟩 Surface symmetric placement hints (pair slot numbers) using existing grid numbering utilities

- [x] 🟩 **Step 3: Filler word assist (crossing-aware)**
  - [x] 🟩 Extend `searchWords` (or wrapper `searchFillCandidates`) to accept crossing constraints from current slot + grid state
  - [x] 🟩 Rank results: boost score, penalize duplicates, crosswordese, and words already in grid
  - [x] 🟩 Wire enhanced search into `WordEntryPanel` and expose batch preview in Assist panel (top N per unfilled slot)

- [x] 🟩 **Step 4: Assist UI panel**
  - [x] 🟩 Create `AssistPanel.tsx` in grid workspace: theme concept input, theme candidate list, filler suggestions for selected slot
  - [x] 🟩 One-click apply: fill slot, mark theme slots, jump to symmetric partner
  - [x] 🟩 Toggle via toolbar button / keyboard shortcut; show phase-appropriate default tab (Theme vs Filler)
  - [x] 🟩 Visual distinction for theme slots on grid (subtle highlight, reusing score color system)

- [x] 🟩 **Step 5: Optional AI theme ideation**
  - [x] 🟩 Add `lib/assistProvider.ts` abstraction with `local` and `ai` backends
  - [x] 🟩 Settings UI: API key (localStorage), provider toggle, model selection
  - [x] 🟩 AI backend: generate theme entry lists + short rationale from `themeConcept`; user picks entries to apply
  - [x] 🟩 Clear offline/error states; never send grid or clues unless user opts in

- [x] 🟩 **Step 6: Tests & polish**
  - [x] 🟩 Unit tests: theme search ranking, crossing-aware filler search, theme metadata round-trip
  - [x] 🟩 Component test: Assist panel apply flow
  - [x] 🟩 Update guidance tips to reference Assist where relevant

## Out of Scope

- Full auto-fill or backtracking solver
- Autonomous clue writing (future add-on)
- Cloud sync or shared assist sessions
- Submitting generated content to NYT/WSJ

## Suggested Build Order

Steps 1 → 3 → 2 → 4 → 6 → 5

Filler assist (Step 3) delivers immediate value on partial grids; theme metadata (Step 1) unblocks theme UI; AI (Step 5) is optional and last.

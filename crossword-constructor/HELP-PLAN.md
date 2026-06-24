# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Expand in-app help so every interactive control has at least a one-sentence explanation — via hover tooltips on controls and a comprehensive Interface Guide in the Guidance sidebar (F1), without adding visible UI clutter.

## Critical Decisions

- **Centralized `helpContent.ts`** — Single source of truth for all help strings; components import `help.*` for `title` attributes.
- **Guidance sidebar as deep reference** — Grouped Interface Guide + keyboard shortcuts; context-filtered “This screen” section by workspace.
- **Native `title` tooltips only** — No extra icons or inline help text on controls; keeps the UI clean.
- **Grid cells documented once** — One tooltip on the grid canvas, not per-cell (would be noisy).

## Tasks

- [x] 🟩 **Step 1: Help content module**
  - [x] 🟩 `helpContent.ts` with sections, shortcuts, and `help` tip map
  - [x] 🟩 Unit test: every entry has a non-empty description

- [x] 🟩 **Step 2: Expand Guidance sidebar**
  - [x] 🟩 “This screen” workspace-filtered controls list
  - [x] 🟩 Full Interface Guide by section
  - [x] 🟩 Keyboard shortcuts reference

- [x] 🟩 **Step 3: Wire tooltips across UI**
  - [x] 🟩 NavBar, HomeScreen, PuzzleLibrary
  - [x] 🟩 Grid workspace (toolbar, palette, panels, canvas)
  - [x] 🟩 Words, Clues, Export modal

- [x] 🟩 **Step 4: Tests & verify**
  - [x] 🟩 Guidance sidebar renders new sections
  - [x] 🟩 Build passes

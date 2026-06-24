# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Unify the editor and workspace UI with the landing page's warm cream palette, navy accents, DM Sans / Newsreader typography, and consistent panel/button patterns.

## Critical Decisions

- **Global tokens in `index.css`** — single `@theme` source for Tailwind utilities (`bg-app-bg`, `text-app-accent`, etc.) shared by landing and app.
- **Reusable `app-ui.css` classes** — `.app-panel`, `.app-btn-primary`, `.app-input` for consistent chrome without repeating long class strings.
- **NavBar matches landing nav** — sticky warm header with `LandingLogo`, navy Export CTA, tinted workspace tabs.
- **Semantic colors preserved** — error/warning/success states keep red/yellow/green; accent navy replaces generic blue/slate.

## Tasks

- [x] 🟩 **Step 1: Global theme tokens** — `index.css`, `app-ui.css`, grid cell harmonization
- [x] 🟩 **Step 2: App shell** — `App.tsx`, `NavBar.tsx`, `AuthButton.tsx`
- [x] 🟩 **Step 3: Workspaces** — grid, words, clues components
- [x] 🟩 **Step 4: Overlays** — `GuidanceSidebar`, `ExportModal`, `PuzzleLibrary`
- [x] 🟩 **Step 5: Landing CSS alignment** — `landing.css` references shared `--color-app-*` tokens
- [x] 🟩 **Step 6: Verify** — build passes, 63 tests pass

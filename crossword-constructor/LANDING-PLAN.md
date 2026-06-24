# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Replace the minimal home screen with a full marketing landing page matching the approved HTML mockup — hero with app preview, how-it-works, features, publications comparison, FAQ, and footer CTA — while preserving new-puzzle, autosave restore, and puzzle library flows.

## Critical Decisions

- **Modular landing components** under `src/components/landing/` — keeps `HomeScreen` as a thin orchestration layer.
- **Dedicated `landing.css`** with design tokens from the mockup — precise colors, typography, and spacing without polluting global app styles.
- **Start building modal** — CTAs open a modal with NYT/WSJ grid-size choices (existing `newPuzzle` flow) plus saved puzzles.
- **Google Fonts** (DM Sans + Newsreader) — loaded in `index.html` to match mockup typography.

## Tasks

- [x] 🟩 **Step 1: Design tokens & CSS** — `landing.css`, font links in `index.html`
- [x] 🟩 **Step 2: Landing data & hero mockup grid** — `landingData.ts`, `heroGridData.ts`
- [x] 🟩 **Step 3: Section components** — `LandingPage.tsx`, `HeroMockup.tsx`, `FaqSection.tsx`, `LandingLogo.tsx`
- [x] 🟩 **Step 4: Start building modal** — `StartBuildingModal.tsx` with puzzle target picker + puzzle library
- [x] 🟩 **Step 5: Wire HomeScreen & App** — `HomeScreen.tsx` renders `LandingPage`, autosave banner preserved
- [x] 🟩 **Step 6: Verify** — build passes, 63 tests pass

# City Budget Simulator — UI Redesign Plan

**Overall Progress:** `100%` (accessibility contrast pass complete)

## TLDR

Redesign the City Budget Simulator to match the vibrant civic cartoon aesthetic from the hero artwork: bright sky palette, Civic Blue / Park Green / Action Orange, bold rounded UI, and a welcoming landing page that explains the game before scenario selection.

## Critical Decisions

- **Light civic-game theme** — Replace dark industrial editorial with optimistic sky-blue backgrounds, thick outlines, and playful typography (Fredoka + Nunito Sans).
- **Landing → Scenario → Game flow** — New `LandingPage` explains mechanics; saved games resume from landing via "Continue your term."
- **Hero artwork** — Ship `public/hero.png` from reference art for landing hero; CSS/SVG accents elsewhere.
- **Preserve simulation + routes** — No backend or simulation changes; CSS class names kept compatible with existing panels.

## Tasks

- [x] 🟩 **Step 1: Design tokens** — Civic color palette, typography, shadows, rounded components in `index.css`
- [x] 🟩 **Step 2: Landing page** — Hero, tagline ribbon, how-to-play, department icons, CTAs
- [x] 🟩 **Step 3: Game store flow** — `showLandingPage`, `hasSavedGame`, continue vs new game
- [x] 🟩 **Step 4: App shell** — Branded header, nav tabs, buttons match new theme
- [x] 🟩 **Step 5: Scenario picker** — Restyled to match landing aesthetic
- [x] 🟩 **Step 6: Skyline** — Light-theme city hall silhouette
- [x] 🟩 **Step 7: Build + deploy bundle** — `npm run build` → `dashboard/static/city-budget-simulator/`
- [x] 🟩 **Step 8: Accessibility contrast pass** — WCAG AA tokens, focus rings, darker muted text, readable warnings, `prefers-contrast: more`

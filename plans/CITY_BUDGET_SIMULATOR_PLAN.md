# City Budget Simulator — Implementation Plan

**Overall Progress:** `100%` (Phase 2 enhancements added)

Based on `city-budget-simulator-spec.md` Phase 1 (playable prototype).

## TLDR

Turn-based civic budget game at **`/city-budget-simulator`**: client-side simulation (TypeScript), React + Zustand UI built with Vite into `dashboard/static/city-budget-simulator/`. Sun Belt Boom scenario, 30-year horizon.

## Critical Decisions

- Vite subproject `city-budget-simulator/` → static bundle (no Node in production).
- Simulation is pure TS (`simulateTurn`) with Vitest unit tests.
- No backend APIs (save/load via localStorage in Phase 1).
- Distinct visual identity (civic/industrial editorial) — not Dallas Budget paper theme.

## Tasks

- [x] 🟩 **Step 1: Simulation module** — types, scenarios, `simulateTurn`, event queue
- [x] 🟩 **Step 2: Vitest** — core turn + loss/win edge cases
- [x] 🟩 **Step 3: React UI** — dashboard, budget editor, timeline, politics
- [x] 🟩 **Step 4: Vite build** — output to `dashboard/static/city-budget-simulator/`
- [x] 🟩 **Step 5: FastAPI route + template** — `GET /city-budget-simulator`
- [x] 🟩 **Step 6: Portal + README** — `home.html`, cross-nav link

### Phase 2 enhancements

- [x] 🟩 **5 scenarios** + sandbox/hard difficulty
- [x] 🟩 **Random events** — recession, disaster, state cuts, rate spike, boom
- [x] 🟩 **Credit-rated bond caps** + debt service by rating
- [x] 🟩 **Housing policies** — rent control, inclusionary, subsidy
- [x] 🟩 **Pension reforms** — COLA freeze, close DB, employee share
- [x] 🟩 **History charts** + newspaper feed + event progress bars
- [x] 🟩 **Policy explainer toggle** + multi-dimensional end scorecard

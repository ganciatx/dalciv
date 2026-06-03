# City Budget Simulator — UX review screenshots

Captured **2026-05-22** from local dev (`npm run dev` → http://localhost:5173/) using **Sun Belt Boom** / standard / no challenge, after one budget year unless noted.

Production build is served at `/city-budget-simulator` on the Dallas civic portal; layout matches these captures.

## How to view

Open this folder in Finder or attach to Figma. Files are full-page PNGs (1920px-wide viewport).

## Screen inventory

| File | View | Notes |
|------|------|--------|
| `00-scenario-picker.png` | New game / scenario select | All 5 scenarios + challenge dropdown + achievements |
| `01-dashboard.png` | Dashboard | FY2025 start, balanced metrics |
| `01b-dashboard-year2-deficit.png` | Dashboard | FY2026 after year close: junk credit, negative fund balance, newspaper + council quotes |
| `02-budget.png` | Budget | Revenue levers, pension reform, expenditures, consequences preview |
| `02b-budget-explainer-on.png` | Budget + policy explainer | Explainer toggle on (sidebar) |
| `03-development.png` | Development | Education, EDC, capital catalog |
| `04-districts.png` | Districts | Three districts + maintenance priority |
| `05-timeline-empty.png` | Timeline | Empty state (no queued events yet) |
| `06-history-empty.png` | History | Empty charts (year 0) — reference only |
| `06b-history-year1.png` | History | After FY2025 close: fund balance / tax base / crime charts + year row |
| `07-politics.png` | Politics | Electoral outlook + faction approval bars |
| `08-staff.png` | Staff | Campaign manager + three policy advisors + last-year briefing |
| `09-year-summary-modal.png` | Year-end modal | Overlay after “Adopt budget & advance” |
| `10-game-over-scorecard.png` | Game over | Term complete + stewardship grades + achievements (simulated end state) |

## Global chrome (all in-game views)

- Header: city name, population, scenario, difficulty, challenge legend, portal back-link
- Nav tabs: Dashboard · Budget · Development · Districts · Timeline · History · Politics · Staff
- Actions: Explainer toggle · Adopt budget & advance · New game
- Game over disables Budget, Development, Districts, Staff tabs

## Not captured (optional follow-up)

- **Timeline with queued events** — requires budget choices that schedule delayed consequences, then advance a year
- **Achievement unlock toast** — transient banner after meeting achievement criteria
- **Staff urgent recommendations** — e.g. slash education spend far below hold-steady
- **Per-scenario picker cards** — same layout; only copy/metrics differ
- **Mobile / tablet breakpoints** — desktop-only capture

## Recapture locally

```bash
cd city-budget-simulator && npm run dev
# Open http://localhost:5173/ — clear localStorage for scenario picker
```

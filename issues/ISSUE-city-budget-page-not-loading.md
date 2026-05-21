# Issue: City budget page (`/city-budget`) does not load

**Type:** `bug` • **Priority:** `high` • **Effort:** `small` • **Status:** fixed ✅

## TL;DR

After swapping to the exact Dallas Budget React mockup, **`/city-budget` stays on “Loading Dallas budget…”** (or a blank shell) because JSX never runs in the browser.

## Current vs expected

| | Behavior |
|---|----------|
| **Current** | HTML and APIs return 200; static assets load; React never mounts; page stuck loading |
| **Expected** | Mockup UI (Hero, Your dollar, Revenue, Departments, Glossary, Tweaks) with live Socrata data |

## Root cause

1. **Missing Babel loader** — Babel standalone does not transpile `type="text/babel"` scripts with a `src` attribute. The original `Dallas Budget.html` fetches each `.jsx`, inlines it, then runs `transformScriptTags()`. Our template copied `src` tags but omitted that boot step.
2. **Data/JSX race** — `sections.jsx` does `const DATA = window.BUDGET_DATA` at load time. If JSX ran before `data-live.js` finished, `DATA` was `undefined` and React crashed even after Babel boot was added.

## Fix

- Add `dashboard/static/dallas-budget/babel-boot.js`: wait for `budget-data-ready`, then `fetch` each `.jsx`, compile with `Babel.transform`, append scripts in order.
- Update `dashboard/templates/city_budget.html` to load `data-live.js` + `babel-boot.js` (no external babel `src` tags).
- `data-live.js` dispatches `budget-data-failed` on API errors so boot does not hang.

## Files

- `dashboard/templates/city_budget.html`
- `dashboard/static/dallas-budget/babel-boot.js` (new)
- `dashboard/static/dallas-budget/data-live.js` (live data bridge; separate failure path)

## Risks / notes

- **Boot order:** `babel-boot.js` waits for `budget-data-ready` before compiling JSX so `sections.jsx` sees populated `BUDGET_DATA`.
- **Production:** Confirm `/static/dallas-budget/*.jsx` are included in Docker image (same as other static assets).
- **Fallback:** `data.js` mock still available for offline/dev if live API fails.

## Acceptance criteria

1. ✅ `/city-budget` renders full mockup UI (not stuck on loading text).
2. ✅ Totals match `/api/city-budget/summary` for current FY.
3. ✅ Browser console has no Babel/JSX load errors.

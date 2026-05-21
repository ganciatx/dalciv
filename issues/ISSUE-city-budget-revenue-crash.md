# Issue: City budget page blank — `RevenueSection` crashes on missing revenue IDs

**Type:** `bug` • **Priority:** `high` • **Effort:** `small` • **Status:** fixed ✅

## TL;DR

`/city-budget` renders Hero and Tax Dollar, then **crashes with a blank page** when `RevenueSection` mounts. Console: `Uncaught TypeError: Cannot read properties of undefined (reading 'amount')` in `<RevenueSection>`.

## Current vs expected

| | Behavior |
|---|----------|
| **Current** | Page loads through early sections; React unmounts on `RevenueSection`; white/blank content below fold |
| **Expected** | Full budget UI including Revenue bars, Operating departments, Glossary |

## Root cause

`RevenueSection` assumed **mock data IDs** (`hotel`, `sales`) but live data from `data-live.js` `buildRevenue()` uses **slugified Open Data `revsource` labels** (e.g. `hotel-occupancy-tax`, not `hotel`). `.find()` returned `undefined` → `.amount` threw.

Separate from [`ISSUE-city-budget-page-not-loading.md`](ISSUE-city-budget-page-not-loading.md) (Babel boot / data race).

## Fix

- `sections.jsx`: `findRevenueAmount()` helper matching by canonical `id` or name substring; removed unused `taxFromVisitors`.
- `data-live.js`: `revenueId()` maps known revsource names to stable mock-compatible ids (`hotel`, `sales`, `property`).

## Files

- `dashboard/static/dallas-budget/sections.jsx`
- `dashboard/static/dallas-budget/data-live.js`

## Acceptance criteria

1. ✅ `/city-budget` renders through Revenue, Operating, and Glossary with live API data
2. ✅ Console has no `Cannot read properties of undefined (reading 'amount')` in `RevenueSection`
3. ✅ Hotel occupancy callout shows a value or hides gracefully when source missing

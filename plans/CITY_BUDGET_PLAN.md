# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

City Budget microapp at **`/city-budget`**: revenue (`rtn4-pmj9`) and operating (`e2fs-y4nb`) budgets from Dallas Open Data, server-cached and charted in the browser. UI matches the **Dallas Budget (1).html** prototype: “$X in, $Y out” hero, Money in / Money out / Departments / Funds sections.

## Critical Decisions

- Single module `dashboard/city_budget.py`, two cache files, TTL ~24h.
- Full SODA fetch per dataset (~1.5k + ~1.8k rows).
- Primary amount `budcurr`; operating tab also shows encumbrance/expenditure fields.
- UI: exact Dallas Budget React mockup (`dashboard/static/dallas-budget/`).

## Tasks:

- [x] **Step 1: Socrata module** — `city_budget.py`
- [x] **Step 2: Aggregations + payloads**
- [x] **Step 3: API routes** — `app.py`
- [x] **Step 4: UI** — `city_budget.html` + mockup static bundle
- [x] **Step 5: Portal + ops** — `home.html`, cross-nav, `command_center.py`, `README.md`
- [x] **Bugfix: page load** — `babel-boot.js` + `data-live.js` events (`issues/ISSUE-city-budget-page-not-loading.md`) ✅
- [x] **Bugfix: RevenueSection crash** — live revenue ids + safe lookups (`issues/ISSUE-city-budget-revenue-crash.md`) ✅
- [x] **Vendor payments layer** — `x5ih-idh7` aggregates, `/api/city-budget/vendors`, UI section + dept drill-down ✅
- [x] **Fund aggregation fix** — General Fund total from `fundtype` pivot (`plans/budget_recon_plan.md`) ✅
- [x] **Proto UI redesign** — `sections.jsx` / `app.jsx` / `components.jsx` from Dallas Budget (1).html; `budget-build.js` + `revsource-type-map.json` for live `BUDGET_DATA` shape ✅

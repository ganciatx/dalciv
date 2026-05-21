# Budget reconciliation

**Status:** General Fund aggregation fixed (2026-05-21); full-row API load fixed (2026-05-20)

## Excel reference row counts (Data sheets)

| FY | Revenue rows | Revenue BUDCURR | Operating rows | Operating BUDCURR |
|----|--------------|-----------------|----------------|-------------------|
| 2026 | 626 | $4,254,327,886 | 779 | $4,284,452,698 |
| 2025 | 853 | $4,131,890,127 | 1062 | $4,383,213,618 |

Socrata cache matches these totals. UI was incomplete because `/api/city-budget/rows` capped at 200 rows while `data-live.js` requested thousands — only ~$325M of $4.25B revenue loaded. Fix: `BULK_ROWS_LIMIT=10000`, paginated Socrata fetch, completeness check in `data-live.js`.

## Pivot reference (BFY 2026, sum of `budcurr` by `fundtype`)

| Fund type | Amount |
|-----------|--------|
| Enterprise Operating Fund | $1,530,213,187 |
| General Fund | **$1,963,072,642** |
| General Obligation Debt Service | $477,371,642 |
| Internal Service Fund | $257,051,714 |
| Other Operating Fund | $25,889,369 |
| Other - State Reimbursements | $729,332 |
| **Grand total** | **$4,254,327,886** |

Source: [Operating Budget](https://www.dallasopendata.com/Economy/Operating-Budget/e2fs-y4nb/about_data) / revenue book (same fund totals for adopted current).

## Bug

`generalFundTotal` summed only department cards tagged `fund === "General Fund"` (top 14 services, first-row fundtype). Most General Fund dollars sit in other services or in "Other departments" (`fund: "Various"`), so the Tax Dollar section showed ~$48M–$985M instead of **~$1.96B**.

## Fix

- `generalFundTotal`: **revenue budget** rows where `fundtype` is General Fund (`overview.fund_totals.revenue` from API, or sum of revenue `budcurr`).
- `generalFundDepts`: group those revenue rows by `revsource` for the dollar bar (not operating `service`).
- `fundTotals` on `BUDGET_DATA`; API `overview.fund_totals` from [`city_budget.py`](../dashboard/city_budget.py).
- Department cards: `fund` = dominant fundtype by dollar amount within each service.

## Verify

```bash
curl -s "http://127.0.0.1:8765/api/city-budget/summary?bfy=2026" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['overview']['kpis']['general_fund_revenue_budget'])"
```

Expect `1963072642` (matches pivot). **Restart dashboard** after pulling — old processes omit `fund_totals` / `general_fund_revenue_budget` KPIs.

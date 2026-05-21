/**
 * Loads Dallas Open Data via /api/city-budget/* and builds BUDGET_DATA for the proto UI.
 */
(async function loadBudgetData() {
  const POP = 1302868;
  const HOUSEHOLDS = 533450;

  async function fetchJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  try {
    if (typeof window.buildBudgetData !== "function") {
      throw new Error("budget-build.js did not load");
    }

    const summary = await fetchJson("/api/city-budget/summary");
    const fy = parseInt(summary.selected?.bfy || summary.overview?.kpis?.bfy || "2026", 10);

    // Full FY row sets (Excel Data sheet: ~626 revenue + ~779 operating rows for FY26).
    const revPayload = await fetchJson(
      `/api/city-budget/rows?dataset=revenue&bfy=${fy}&limit=10000`
    );
    const opPayload = await fetchJson(
      `/api/city-budget/rows?dataset=operating&bfy=${fy}&limit=10000`
    );
    const revRows = revPayload.rows;
    const opRows = opPayload.rows;
    if (revPayload.total > revRows.length || opPayload.total > opRows.length) {
      throw new Error(
        `Incomplete budget rows (revenue ${revRows.length}/${revPayload.total}, ` +
          `operating ${opRows.length}/${opPayload.total}). Retry after cache refresh.`
      );
    }

    const bfys = (summary.filters?.bfys || []).map(String).sort((a, b) => b - a);
    const prior = bfys.find((y) => parseInt(y, 10) < fy);
    let revPrev = [];
    let opPrev = [];
    if (prior) {
      const revPrevPayload = await fetchJson(
        `/api/city-budget/rows?dataset=revenue&bfy=${prior}&limit=10000`
      );
      const opPrevPayload = await fetchJson(
        `/api/city-budget/rows?dataset=operating&bfy=${prior}&limit=10000`
      );
      revPrev = revPrevPayload.rows;
      opPrev = opPrevPayload.rows;
    }

    window.BUDGET_DATA = window.buildBudgetData(revRows, opRows, revPrev, opPrev, {
      fy,
      population: POP,
      households: HOUSEHOLDS,
      source: "dallas-opendata-live",
      fetchedAt: summary.revenue_meta?.fetched_at || summary.operating_meta?.fetched_at,
    });

    window.dispatchEvent(new Event("budget-data-ready"));
  } catch (err) {
    console.error("[city-budget] Failed to load live data:", err);
    window.__budgetDataFailed = true;
    window.__budgetDataError = String(err.message || err);
    window.dispatchEvent(new Event("budget-data-failed"));
    const el = document.getElementById("root");
    if (el) {
      el.innerHTML =
        '<p style="padding:2rem;font-family:system-ui;color:#B53227">Could not load budget data. ' +
        window.__budgetDataError +
        "</p>";
    }
  }
})();

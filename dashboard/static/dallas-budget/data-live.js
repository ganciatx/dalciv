/**
 * Loads Dallas Open Data via /api/city-budget/bootstrap (single cache-backed request).
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

    const boot = await fetchJson("/api/city-budget/bootstrap");
    const summary = boot.summary || {};
    const fy = parseInt(boot.selected_bfy || summary.selected?.bfy || "2026", 10);

    const revRows = boot.revenue_rows || [];
    const opRows = boot.operating_rows || [];
    const revPrev = boot.revenue_rows_prior || [];
    const opPrev = boot.operating_rows_prior || [];

    if (
      boot.revenue_total > revRows.length ||
      boot.operating_total > opRows.length
    ) {
      throw new Error(
        `Incomplete budget rows (revenue ${revRows.length}/${boot.revenue_total}, ` +
          `operating ${opRows.length}/${boot.operating_total}). Retry after cache refresh.`
      );
    }

    if ((boot.meta || {}).cache_warming) {
      throw new Error(
        "Budget cache is still warming. Wait a minute and refresh the page."
      );
    }

    window.BUDGET_DATA = window.buildBudgetData(revRows, opRows, revPrev, opPrev, {
      fy,
      population: POP,
      households: HOUSEHOLDS,
      source: "dallas-opendata-live",
      fetchedAt:
        boot.meta?.revenue_fetched_at ||
        summary.revenue_meta?.fetched_at ||
        summary.operating_meta?.fetched_at,
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

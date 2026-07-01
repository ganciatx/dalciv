import { buildBudgetData } from "./budget-build.js";

const POP = 1302868;
const HOUSEHOLDS = 533450;

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Load Dallas Open Data via /api/city-budget/bootstrap.
 */
export async function loadBudgetData() {
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
        `operating ${opRows.length}/${boot.operating_total}). Retry after cache refresh.`,
    );
  }

  if ((boot.meta || {}).cache_warming) {
    throw new Error(
      "Budget cache is still warming. Wait a minute and refresh the page.",
    );
  }

  let displayMap = boot.revsource_display;
  if (!displayMap || typeof displayMap !== "object") {
    try {
      displayMap = await fetchJson(
        "/static/city-budget/data/revsource-display-map.json",
      );
    } catch {
      displayMap = {};
    }
  }

  return buildBudgetData(revRows, opRows, revPrev, opPrev, {
    fy,
    population: POP,
    households: HOUSEHOLDS,
    displayMap,
    source: "dallas-opendata-live",
    fetchedAt:
      boot.meta?.revenue_fetched_at ||
      summary.revenue_meta?.fetched_at ||
      summary.operating_meta?.fetched_at,
  });
}

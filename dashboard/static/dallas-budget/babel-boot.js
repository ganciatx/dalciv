/**
 * Boot the Dallas Budget mockup JSX under FastAPI static hosting.
 *
 * 1. Babel standalone ignores type="text/babel" scripts with src= — fetch and inline.
 * 2. sections.jsx binds `const DATA = window.BUDGET_DATA` at load time — wait for live data first.
 */
(async function bootBabelJsx() {
  const JSX_FILES = [
    "/static/dallas-budget/tweaks-panel.jsx",
    "/static/dallas-budget/components.jsx",
    "/static/dallas-budget/sections.jsx",
    "/static/dallas-budget/app.jsx",
  ];
  const DATA_TIMEOUT_MS = 120000;

  function showError(message) {
    const el = document.getElementById("root");
    if (!el) return;
    el.innerHTML =
      '<p style="padding:2rem;font-family:system-ui;color:#B53227">Could not load budget UI. ' +
      String(message) +
      "</p>";
  }

  async function waitForBudgetData() {
    if (window.BUDGET_DATA) return;
    if (window.__budgetDataFailed) {
      throw new Error(window.__budgetDataError || "Budget data failed to load");
    }
    await new Promise(function (resolve, reject) {
      const timer = setTimeout(function () {
        reject(new Error("Timed out waiting for budget data"));
      }, DATA_TIMEOUT_MS);
      function done(fn) {
        return function () {
          clearTimeout(timer);
          fn();
        };
      }
      window.addEventListener("budget-data-ready", done(resolve), { once: true });
      window.addEventListener(
        "budget-data-failed",
        done(function () {
          reject(new Error(window.__budgetDataError || "Budget data failed to load"));
        }),
        { once: true }
      );
    });
  }

  await waitForBudgetData();

  if (!window.Babel || typeof window.Babel.transform !== "function") {
    throw new Error("Babel.transform is not available");
  }

  for (const url of JSX_FILES) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load " + url + ": " + res.status);
    const src = await res.text();
    const compiled = window.Babel.transform(src, { presets: ["react"] }).code;
    const s = document.createElement("script");
    s.textContent = compiled;
    document.body.appendChild(s);
  }
})().catch(function (err) {
  console.error("[city-budget] Babel boot failed:", err);
  const el = document.getElementById("root");
  if (el) {
    el.innerHTML =
      '<p style="padding:2rem;font-family:system-ui;color:#B53227">Could not load budget UI. ' +
      String(err.message || err) +
      "</p>";
  }
});

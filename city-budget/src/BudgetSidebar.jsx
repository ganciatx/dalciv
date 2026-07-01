// BudgetSidebar — section rail for the Dallas budget explorer.

import React from "react";
import { useBudgetData } from "./BudgetDataContext.jsx";
import { fmt } from "./components.jsx";

const SECTIONS = [
  { id: "hero", label: "Overview" },
  { id: "income", label: "Money in", statKey: "revenueTotal" },
  { id: "spending", label: "Money out", statKey: "operatingTotal" },
  { id: "departments", label: "Departments" },
  { id: "funds", label: "Funds" },
  { id: "glossary", label: "Glossary" },
];

function scrollOffset() {
  const root = getComputedStyle(document.documentElement);
  const header = parseInt(root.getPropertyValue("--site-header-height"), 10) || 52;
  return header + 16;
}

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - scrollOffset();
  window.scrollTo({ top, behavior: "smooth" });
  if (id !== "hero") {
    window.history.replaceState(null, "", `#${id}`);
  } else {
    window.history.replaceState(null, "", window.location.pathname);
  }
}

function useScrollSpy(sectionIds) {
  const [active, setActive] = React.useState(sectionIds[0]);

  React.useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!elements.length) return undefined;

    const offset = scrollOffset();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      {
        rootMargin: `-${offset}px 0px -55% 0px`,
        threshold: [0, 0.15, 0.35, 0.55, 0.75],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionIds]);

  return active;
}

function useHashScroll() {
  React.useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash || !SECTIONS.some((s) => s.id === hash)) return undefined;
    const timer = window.setTimeout(() => scrollToSection(hash), 120);
    return () => window.clearTimeout(timer);
  }, []);
}

function NavButton({ section, active, stat, onSelect }) {
  const isActive = active === section.id;
  return (
    <button
      type="button"
      className={`budget-nav-item${isActive ? " is-active" : ""}`}
      onClick={() => onSelect(section.id)}
      aria-current={isActive ? "true" : undefined}
    >
      <span className="budget-nav-item-label">{section.label}</span>
      {stat && <span className="budget-nav-item-stat">{stat}</span>}
    </button>
  );
}

export function BudgetSidebar({
  mode,
  onModeChange,
  themeName,
  themeNames,
  onThemeChange,
}) {
  const DATA = useBudgetData();
  const sectionIds = React.useMemo(() => SECTIONS.map((s) => s.id), []);
  const active = useScrollSpy(sectionIds);
  useHashScroll();

  const statFor = (section) => {
    if (!section.statKey) return null;
    const val = DATA[section.statKey];
    if (val == null) return null;
    return mode === "perCap"
      ? fmt.perCap(val, DATA.population)
      : fmt.shortDollar(val);
  };

  const progressIdx = Math.max(0, sectionIds.indexOf(active));
  const progressPct = ((progressIdx + 1) / sectionIds.length) * 100;

  return (
    <div className="budget-rail">
      <nav className="budget-mobile-nav" aria-label="Budget sections">
        <div className="budget-mobile-nav-track">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`budget-mobile-pill${active === section.id ? " is-active" : ""}`}
              onClick={() => scrollToSection(section.id)}
              aria-current={active === section.id ? "true" : undefined}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      <aside className="budget-sidebar" aria-label="Budget explorer">
        <div className="budget-sidebar-inner">
          <header className="budget-sidebar-head">
            <span className="budget-sidebar-mark" aria-hidden="true">$</span>
            <div>
              <p className="budget-sidebar-kicker">City of Dallas</p>
              <h2 className="budget-sidebar-title">FY {DATA.fy} Budget</h2>
            </div>
          </header>

          <div
            className="budget-sidebar-progress"
            role="progressbar"
            aria-valuenow={progressIdx + 1}
            aria-valuemin={1}
            aria-valuemax={sectionIds.length}
            aria-label={`Section ${progressIdx + 1} of ${sectionIds.length}`}
          >
            <span className="budget-sidebar-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>

          <nav className="budget-sidebar-nav">
            {SECTIONS.map((section) => (
              <NavButton
                key={section.id}
                section={section}
                active={active}
                stat={statFor(section)}
                onSelect={scrollToSection}
              />
            ))}
          </nav>

          <div className="budget-sidebar-controls">
            <div className="budget-sidebar-control">
              <span className="budget-sidebar-control-label">Numbers</span>
              <div className="budget-segment" role="group" aria-label="Number display mode">
                <button
                  type="button"
                  className={mode === "total" ? "is-on" : ""}
                  aria-pressed={mode === "total"}
                  onClick={() => onModeChange("total")}
                >
                  Total
                </button>
                <button
                  type="button"
                  className={mode === "perCap" ? "is-on" : ""}
                  aria-pressed={mode === "perCap"}
                  onClick={() => onModeChange("perCap")}
                >
                  Per resident
                </button>
              </div>
            </div>

            <div className="budget-sidebar-control">
              <label className="budget-sidebar-control-label" htmlFor="budget-theme-select">
                Theme
              </label>
              <select
                id="budget-theme-select"
                className="budget-sidebar-select"
                value={themeName}
                onChange={(e) => onThemeChange(e.target.value)}
              >
                {themeNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

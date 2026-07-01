// app.jsx — top-level shell, theme system, and tweaks.

import React from "react";
import { BudgetSidebar } from "./BudgetSidebar.jsx";
import {
  Hero, IncomeSection, SpendingSection, DepartmentsSection,
  FundsSection, GlossarySection, FooterSection,
} from "./sections.jsx";
import {
  useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakColor,
} from "./tweaks-panel.jsx";

// ── Themes ─────────────────────────────────────────────────────────────────
const THEMES = {
  "Bold Civic": {
    paper: "#F2EBDA",
    paper2: "#EBE3CE",
    ink: "#181A22",
    sub: "rgba(24,26,34,0.62)",
    hair: "rgba(24,26,34,0.18)",
    accentFg: "#B53227",
    accentBg: "rgba(181,50,39,0.10)",
    chart: ["#181A22", "#B53227", "#C68A2E", "#3F5E3F", "#5A4F3F",
            "#7A4536", "#4B5563", "#8B6F47", "#2D6E6E", "#A0522D",
            "#3F4A3A", "#6B4A2B"],
  },
  "Newsprint": {
    paper: "#EFEDE5",
    paper2: "#E5E2D7",
    ink: "#111111",
    sub: "rgba(17,17,17,0.62)",
    hair: "rgba(17,17,17,0.18)",
    accentFg: "#A52A1F",
    accentBg: "rgba(165,42,31,0.08)",
    chart: ["#111111", "#A52A1F", "#5A5A5A", "#2E2E2E", "#7A7A7A",
            "#3D3D3D", "#9A9A9A", "#444", "#6B6B6B", "#222",
            "#888", "#555"],
  },
  "Texas Sky": {
    paper: "#F1F2F3",
    paper2: "#E7E9EC",
    ink: "#0E1A2B",
    sub: "rgba(14,26,43,0.60)",
    hair: "rgba(14,26,43,0.16)",
    accentFg: "#2C4A8E",
    accentBg: "rgba(44,74,142,0.10)",
    chart: ["#0E1A2B", "#2C4A8E", "#4A8FBF", "#6BA88A", "#C0833E",
            "#8E3A3A", "#5A6B7A", "#3F6E6E", "#A88B5A", "#445566",
            "#7A4F8E", "#6B7A5A"],
  },
  "Trinity": {
    paper: "#EFEEE6",
    paper2: "#E5E4D7",
    ink: "#1B2218",
    sub: "rgba(27,34,24,0.60)",
    hair: "rgba(27,34,24,0.16)",
    accentFg: "#B8542E",
    accentBg: "rgba(184,84,46,0.10)",
    chart: ["#1B2218", "#B8542E", "#2F5A3F", "#6B7A4E", "#8B6F2E",
            "#5A4F3F", "#3F5E5E", "#A0522D", "#4B5536", "#7A6346",
            "#2D4A2D", "#8B4F2E"],
  },
};

function applyTheme(name) {
  const t = THEMES[name] || THEMES["Bold Civic"];
  const r = document.documentElement.style;
  r.setProperty("--paper", t.paper);
  r.setProperty("--paper-2", t.paper2);
  r.setProperty("--ink", t.ink);
  r.setProperty("--sub", t.sub);
  r.setProperty("--hair", t.hair);
  r.setProperty("--accent-fg", t.accentFg);
  r.setProperty("--accent-bg", t.accentBg);
  return t;
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "Bold Civic",
  "mode": "total",
  "showAnnotations": true,
  "displayFont": "Instrument Serif"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const theme = React.useMemo(() => applyTheme(t.theme), [t.theme]);

  React.useEffect(() => {
    document.documentElement.style.setProperty(
      "--ff-display",
      t.displayFont === "Bricolage Grotesque"
        ? `"Bricolage Grotesque", serif`
        : t.displayFont === "Newsreader"
          ? `"Newsreader", serif`
          : `"Instrument Serif", serif`
    );
  }, [t.displayFont]);

  return (
    <div className="budget-shell">
      <BudgetSidebar
        mode={t.mode}
        onModeChange={(v) => setTweak("mode", v)}
        themeName={t.theme}
        themeNames={Object.keys(THEMES)}
        onThemeChange={(v) => setTweak("theme", v)}
      />

      <div className="budget-main">
        <div id="hero"><Hero mode={t.mode} /></div>
        <IncomeSection palette={theme.chart} />
        <SpendingSection palette={theme.chart} />
        <DepartmentsSection mode={t.mode} />
        <FundsSection palette={theme.chart} />
        <GlossarySection />
        <FooterSection />
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakColor label="Palette" value={[
          THEMES[t.theme].paper, THEMES[t.theme].ink,
          THEMES[t.theme].accentFg, THEMES[t.theme].paper2,
        ]}
          options={Object.keys(THEMES).map((k) => [
            THEMES[k].paper, THEMES[k].ink,
            THEMES[k].accentFg, THEMES[k].paper2,
          ])}
          onChange={(arr) => {
            const found = Object.entries(THEMES).find(([_, v]) =>
              v.paper === arr[0] && v.ink === arr[1] && v.accentFg === arr[2]);
            if (found) setTweak("theme", found[0]);
          }} />
        <TweakSelect label="Palette name" value={t.theme}
          options={Object.keys(THEMES)}
          onChange={(v) => setTweak("theme", v)} />

        <TweakSection label="Framing" />
        <TweakRadio label="Numbers" value={t.mode}
          options={[
            { value: "total", label: "Total" },
            { value: "perCap", label: "Per resident" },
          ]}
          onChange={(v) => setTweak("mode", v)} />

        <TweakSection label="Type" />
        <TweakSelect label="Display font" value={t.displayFont}
          options={["Instrument Serif", "Newsreader", "Bricolage Grotesque"]}
          onChange={(v) => setTweak("displayFont", v)} />
      </TweaksPanel>
    </div>
  );
}

export default App;

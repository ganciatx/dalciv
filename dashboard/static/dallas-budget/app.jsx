// app.jsx — top-level shell, theme system, and tweaks.

// ── Themes ─────────────────────────────────────────────────────────────────
// Each theme defines: paper/ink/sub/hair (surfaces) + accent + a chart palette
// for the dollar bar. We keep accent colors close in chroma to share a family
// feel while letting hue do the talking.
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

// ── Defaults (persisted via Tweaks host) ───────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "Bold Civic",
  "mode": "total",
  "showAnnotations": true,
  "displayFont": "Instrument Serif"
}/*EDITMODE-END*/;

// ── App ────────────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const theme = React.useMemo(() => applyTheme(t.theme), [t.theme]);

  // Display font swap
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

  // Sticky mini-nav anchor scrolling
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
  };

  return (
    <div style={{
      maxWidth: 1280, margin: "0 auto",
      padding: "0 clamp(20px, 4vw, 56px)",
    }}>
      <TopNav onJump={scrollTo} />
      <div id="hero"><Hero mode={t.mode} /></div>
      <IncomeSection palette={theme.chart} />
      <SpendingSection palette={theme.chart} />
      <DepartmentsSection mode={t.mode} />
      <FundsSection palette={theme.chart} />
      <GlossarySection />
      <FooterSection />

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

// ── TopNav ─────────────────────────────────────────────────────────────────
function TopNav({ onJump }) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items = [
    { id: "hero", label: "Overview" },
    { id: "income", label: "Money in" },
    { id: "spending", label: "Money out" },
    { id: "departments", label: "Departments" },
    { id: "funds", label: "Funds" },
    { id: "glossary", label: "Glossary" },
  ];

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", gap: 24,
      background: scrolled ? "color-mix(in oklab, var(--paper) 88%, transparent)" : "transparent",
      backdropFilter: scrolled ? "blur(12px) saturate(140%)" : "none",
      borderBottom: scrolled ? "0.5px solid var(--hair)" : "0.5px solid transparent",
      transition: "background .2s, border-color .2s",
      marginLeft: "calc(-1 * clamp(20px, 4vw, 56px))",
      marginRight: "calc(-1 * clamp(20px, 4vw, 56px))",
      paddingLeft: "clamp(20px, 4vw, 56px)",
      paddingRight: "clamp(20px, 4vw, 56px)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        fontSize: 12, fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "var(--ink)",
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: 4,
          background: "var(--accent-fg)", color: "var(--paper)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--ff-display)", fontSize: 16, fontWeight: 400,
        }}>$</span>
        <span>Dallas Budget · FY {window.BUDGET_DATA.fy}</span>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        <a href="/" style={{
          all: "unset", cursor: "pointer",
          padding: "6px 12px", borderRadius: 99,
          fontSize: 12, fontWeight: 600, color: "var(--sub)",
          border: "0.5px solid var(--hair)",
        }}>Apps</a>
        {items.map((it) => (
          <button key={it.id} onClick={() => onJump(it.id)}
                  style={{
                    all: "unset", cursor: "pointer",
                    padding: "6px 12px", borderRadius: 99,
                    fontSize: 12, fontWeight: 600, color: "var(--sub)",
                    transition: "color .15s, background .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--ink)";
                    e.currentTarget.style.background = "var(--accent-bg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--sub)";
                    e.currentTarget.style.background = "transparent";
                  }}>
            {it.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ── Mount (after live data bridge) ─────────────────────────────────────────
function mountApp() {
  const root = document.getElementById("root");
  if (!root || !window.BUDGET_DATA) return;
  ReactDOM.createRoot(root).render(<App />);
}
if (window.BUDGET_DATA) mountApp();
else window.addEventListener("budget-data-ready", mountApp, { once: true });

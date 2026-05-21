// components.jsx — reusable building blocks for the Dallas budget app.

// ── Formatting ─────────────────────────────────────────────────────────────
const fmt = {
  // Compact short: $4.28B, $612.4M, $4.2K
  short(n) {
    if (n == null || isNaN(n)) return "—";
    const a = Math.abs(n);
    if (a >= 1e9) return `${(n / 1e9).toFixed(2)}B`.replace(/\.0+B$/, "B");
    if (a >= 1e6) return `${(n / 1e6).toFixed(1)}M`.replace(/\.0M$/, "M");
    if (a >= 1e3) return `${(n / 1e3).toFixed(1)}K`.replace(/\.0K$/, "K");
    return String(Math.round(n));
  },
  // $-prefixed compact
  shortDollar(n) { return "$" + fmt.short(n); },
  // Long money: $4,284,452,698
  full(n) {
    if (n == null) return "—";
    return "$" + Math.round(n).toLocaleString();
  },
  // Per capita: $/person, sensible decimals
  perCap(n, pop) {
    const v = n / pop;
    if (v >= 100) return "$" + Math.round(v).toLocaleString();
    if (v >= 10) return "$" + v.toFixed(1);
    return "$" + v.toFixed(2);
  },
  // Percent, smart precision
  pct(num, denom) {
    if (!denom) return "—";
    const p = (num / denom) * 100;
    if (p < 1) return p.toFixed(2) + "%";
    if (p < 10) return p.toFixed(1) + "%";
    return Math.round(p) + "%";
  },
  // Cents of a dollar — returns integer cents like "32"
  cents(num, denom) {
    if (!denom) return "—";
    const c = (num / denom) * 100;
    if (c < 1) return c.toFixed(1);
    return String(Math.round(c));
  },
};

// ── BigStat ────────────────────────────────────────────────────────────────
// Editorial display number with eyebrow label and optional kicker line.
function BigStat({ kicker, value, label, sub, accent, size = "lg", align = "left" }) {
  const sizes = {
    xl: { num: "clamp(56px, 9vw, 132px)", lh: 0.85 },
    lg: { num: "clamp(40px, 5.4vw, 80px)", lh: 0.92 },
    md: { num: "clamp(28px, 3.6vw, 52px)", lh: 1 },
    sm: { num: "clamp(22px, 2.6vw, 36px)", lh: 1 },
  };
  const s = sizes[size] || sizes.lg;
  return (
    <div style={{ textAlign: align, color: "var(--ink)" }}>
      {kicker && (
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--sub)", marginBottom: 10,
        }}>{kicker}</div>
      )}
      <div style={{
        fontFamily: "var(--ff-display)",
        fontSize: s.num, lineHeight: s.lh, letterSpacing: "-0.02em",
        fontWeight: 400, color: accent || "var(--ink)",
        fontVariantNumeric: "tabular-nums",
      }}>{value}</div>
      {label && (
        <div style={{
          marginTop: 12, fontSize: "clamp(13px, 1vw, 16px)",
          fontWeight: 500, color: "var(--ink)", maxWidth: 480,
        }}>{label}</div>
      )}
      {sub && (
        <div style={{
          marginTop: 6, fontSize: 13, color: "var(--sub)",
          maxWidth: 480, lineHeight: 1.5,
        }}>{sub}</div>
      )}
    </div>
  );
}

// ── BarRow ─────────────────────────────────────────────────────────────────
// Horizontal bar with name on left, amount on right, fill scaled to max.
function BarRow({ name, amount, max, color, denom, mode, pop, note, onClick }) {
  const pct = max ? (amount / max) * 100 : 0;
  const display = mode === "perCap"
    ? fmt.perCap(amount, pop)
    : fmt.shortDollar(amount);
  return (
    <div onClick={onClick}
         style={{
           display: "grid",
           gridTemplateColumns: "minmax(180px, 2fr) minmax(140px, 4fr) auto",
           gap: 14, alignItems: "center", padding: "9px 0",
           borderBottom: "0.5px solid var(--hair)",
           cursor: onClick ? "pointer" : "default",
         }}>
      <div style={{
        fontSize: 14, fontWeight: 500, color: "var(--ink)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{name}</div>
      <div style={{ position: "relative", height: 20 }}>
        <div style={{
          position: "absolute", inset: "2px 0",
          width: `${pct}%`, background: color || "var(--accent)",
          borderRadius: 2, transition: "width .35s cubic-bezier(.3,.7,.4,1)",
        }} />
        {note && (
          <div style={{
            position: "absolute", left: `min(${pct}%, calc(100% - 6px))`,
            top: -2, fontSize: 11, color: "var(--sub)",
            paddingLeft: 8, whiteSpace: "nowrap",
          }}>{note}</div>
        )}
      </div>
      <div style={{
        fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums",
        color: "var(--ink)", textAlign: "right", minWidth: 80,
      }}>
        {display}
        {denom && (
          <span style={{ marginLeft: 8, color: "var(--sub)", fontWeight: 400, fontSize: 12 }}>
            {fmt.pct(amount, denom)}
          </span>
        )}
      </div>
    </div>
  );
}

// ── DollarBar ──────────────────────────────────────────────────────────────
// Single stacked horizontal bar showing dept share of one dollar.
// Each segment is interactive — hover/tap surfaces the amount + def.
function DollarBar({ items, total, palette, active, onActive }) {
  const W = 100; // percent
  let cursor = 0;
  return (
    <div>
      <div style={{
        position: "relative", width: "100%", height: 56,
        borderRadius: 6, overflow: "hidden",
        boxShadow: "0 0 0 0.5px rgba(0,0,0,.08), 0 1px 0 rgba(255,255,255,.4) inset",
      }}>
        {items.map((it, i) => {
          const pct = (it.amount / total) * W;
          const left = cursor;
          cursor += pct;
          const isActive = active === it.id;
          return (
            <div key={it.id}
                 onMouseEnter={() => onActive(it.id)}
                 onMouseLeave={() => onActive(null)}
                 onClick={() => onActive(isActive ? null : it.id)}
                 style={{
                   position: "absolute", top: 0, bottom: 0,
                   left: `${left}%`, width: `${pct}%`,
                   background: palette[i % palette.length],
                   cursor: "pointer",
                   borderRight: i < items.length - 1 ? "1px solid rgba(255,255,255,.85)" : "none",
                   filter: active && !isActive ? "saturate(.4) opacity(.55)" : "none",
                   transition: "filter .2s",
                 }} />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6,
        fontSize: 11, color: "var(--sub)", fontVariantNumeric: "tabular-nums" }}>
        <span>$0.00</span><span>$0.25</span><span>$0.50</span><span>$0.75</span><span>$1.00</span>
      </div>
    </div>
  );
}

// ── Annotation ─────────────────────────────────────────────────────────────
// Editorial callout — diagonal leader line + small label, used to annotate
// charts in the style of a newspaper graphic.
function Annotation({ text, x = 0, y = 0, anchor = "tl", width = 160 }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, width,
      fontFamily: "var(--ff-display)", fontStyle: "italic",
      fontSize: 14, lineHeight: 1.25, color: "var(--ink)",
      pointerEvents: "none",
    }}>
      <div style={{ borderTop: "0.5px solid var(--ink)", paddingTop: 4 }}>{text}</div>
    </div>
  );
}

// ── DeptCard ───────────────────────────────────────────────────────────────
// Square-ish poster card for one department. Big tag glyph + amount + name.
function DeptCard({ dept, total, mode, pop, onClick, accent }) {
  const display = mode === "perCap"
    ? fmt.perCap(dept.amount, pop) + "/person"
    : fmt.shortDollar(dept.amount);
  return (
    <button onClick={onClick}
            style={{
              all: "unset", cursor: "pointer", display: "block",
              background: "var(--paper-2)",
              border: "0.5px solid var(--hair)",
              borderRadius: 6, padding: "18px 18px 16px",
              position: "relative", overflow: "hidden",
              transition: "transform .15s ease, box-shadow .15s ease, border-color .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,.08)";
              e.currentTarget.style.borderColor = "var(--ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = "";
              e.currentTarget.style.borderColor = "var(--hair)";
            }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 26, lineHeight: 1, filter: "grayscale(.1)" }}>{dept.tag}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--sub)",
          padding: "3px 8px", border: "0.5px solid var(--hair)", borderRadius: 99,
        }}>{dept.fund}</span>
      </div>
      <div style={{
        fontFamily: "var(--ff-display)",
        fontSize: "clamp(32px, 3.4vw, 46px)", lineHeight: 0.95,
        letterSpacing: "-0.02em", color: accent || "var(--ink)",
        fontVariantNumeric: "tabular-nums",
      }}>{display}</div>
      <div style={{
        marginTop: 4, fontSize: 11, color: "var(--sub)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {fmt.pct(dept.amount, total)} of city · {fmt.cents(dept.amount, total)}¢ per $1
      </div>
      <div style={{
        marginTop: 14, fontSize: 15, fontWeight: 600, color: "var(--ink)",
        lineHeight: 1.25,
      }}>{dept.name}</div>
      <div style={{
        marginTop: 6, fontSize: 12.5, color: "var(--sub)",
        lineHeight: 1.45, textWrap: "pretty",
      }}>{dept.blurb}</div>
      <div style={{
        marginTop: 16, fontSize: 11, color: "var(--accent-fg)",
        fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
      }}>See breakdown →</div>
    </button>
  );
}

// ── Disclosure ─────────────────────────────────────────────────────────────
function Disclosure({ q, a, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ borderBottom: "0.5px solid var(--hair)" }}>
      <button onClick={() => setOpen(!open)}
              style={{
                all: "unset", display: "flex", width: "100%",
                justifyContent: "space-between", alignItems: "center",
                padding: "16px 0", cursor: "pointer",
              }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{q}</span>
        <span style={{
          fontSize: 20, color: "var(--sub)",
          transform: open ? "rotate(45deg)" : "rotate(0)",
          transition: "transform .2s",
        }}>+</span>
      </button>
      {open && (
        <div style={{
          padding: "0 0 18px", fontSize: 14.5, lineHeight: 1.6,
          color: "var(--ink)", maxWidth: 720, textWrap: "pretty",
        }}>{a}</div>
      )}
    </div>
  );
}

// ── SectionHeader ──────────────────────────────────────────────────────────
function SectionHeader({ number, eyebrow, title, lede }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 14,
        marginBottom: 14,
      }}>
        {number != null && (
          <span style={{
            fontFamily: "var(--ff-display)", fontStyle: "italic",
            fontSize: 22, color: "var(--accent-fg)",
            fontVariantNumeric: "tabular-nums",
          }}>§{number.toString().padStart(2, "0")}</span>
        )}
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.16em",
          textTransform: "uppercase", color: "var(--sub)",
        }}>{eyebrow}</span>
      </div>
      <h2 style={{
        fontFamily: "var(--ff-display)", margin: 0,
        fontSize: "clamp(34px, 4.4vw, 64px)", lineHeight: 1.05,
        letterSpacing: "-0.02em", fontWeight: 400, color: "var(--ink)",
        textWrap: "balance",
        paddingBottom: "0.18em",
      }}>{title}</h2>
      {lede && (
        <p style={{
          marginTop: 22, marginBottom: 0,
          fontSize: "clamp(15px, 1.2vw, 19px)",
          lineHeight: 1.5, color: "var(--ink)", maxWidth: 720,
          textWrap: "pretty",
        }}>{lede}</p>
      )}
    </div>
  );
}

// ── Pill ───────────────────────────────────────────────────────────────────
function Pill({ children, accent = false }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
      textTransform: "uppercase", whiteSpace: "nowrap",
      background: accent ? "var(--accent-bg)" : "transparent",
      border: accent ? "none" : "0.5px solid var(--hair)",
      color: accent ? "var(--accent-fg)" : "var(--sub)",
    }}>{children}</span>
  );
}

Object.assign(window, {
  fmt, BigStat, BarRow, DollarBar, Annotation, DeptCard,
  Disclosure, SectionHeader, Pill,
});

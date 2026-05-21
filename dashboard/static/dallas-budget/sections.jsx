// sections.jsx — citizen-friendly Dallas budget explorer.
// The "cycle" — money in (Revenue) and money out (Operating) — told side
// by side, with each department revealing whether it pays its own way.

const DATA = window.BUDGET_DATA;

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero({ mode }) {
  const inVal = DATA.revenueTotal;
  const outVal = DATA.operatingTotal;
  const pop = DATA.population;
  const big = (n) => mode === "perCap" ? fmt.perCap(n, pop) : fmt.shortDollar(n);

  return (
    <section data-screen-label="01 Hero" style={{ padding: "clamp(40px, 6vw, 80px) 0 clamp(48px, 6vw, 96px)" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
        textTransform: "uppercase", color: "var(--sub)",
        marginBottom: 28,
      }}>
        <span>The City of Dallas Budget</span>
        <span style={{ flex: 1, height: 0, borderTop: "0.5px solid var(--hair)" }} />
        <span>FY {DATA.fy} · Adopted</span>
      </div>

      <h1 style={{
        fontFamily: "var(--ff-display)", margin: 0,
        fontSize: "clamp(48px, 8vw, 128px)", lineHeight: 0.88,
        letterSpacing: "-0.035em", fontWeight: 400, color: "var(--ink)",
        textWrap: "balance",
      }}>
        <em style={{ color: "var(--accent-fg)", fontStyle: "italic" }}>{big(inVal)}</em> in,{" "}
        <em style={{ color: "var(--accent-fg)", fontStyle: "italic" }}>{big(outVal)}</em> out.
      </h1>
      <p style={{
        marginTop: 28, fontSize: "clamp(17px, 1.4vw, 22px)",
        lineHeight: 1.45, color: "var(--ink)", maxWidth: 820,
        textWrap: "pretty",
      }}>
        Every year, Dallas collects taxes and fees, then pays for police, water,
        firefighters, parks, libraries, and a thousand other things. Here's both
        sides of the ledger — in plain English.
      </p>

      <CycleVisual mode={mode} />

      <div style={{
        marginTop: 56, display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "clamp(20px, 3vw, 48px)", rowGap: 32,
        borderTop: "0.5px solid var(--ink)", paddingTop: 32,
      }}>
        <BigStat kicker="Money in" value={big(inVal)}
          label={mode === "perCap" ? "per Dallas resident" : "expected this year"}
          sub={fmt.full(inVal)} size="md" />
        <BigStat kicker="Money out" value={big(outVal)}
          label={mode === "perCap" ? "per Dallas resident" : "planned spending"}
          sub={fmt.full(outVal)} size="md" />
        <BigStat kicker="People served" value={(pop / 1e6).toFixed(2) + "M"}
          label="Dallas residents"
          sub={`${DATA.households.toLocaleString()} households`} size="md" />
        <BigStat kicker="Year over year"
          value={(DATA.operatingYoY >= 0 ? "+" : "") + DATA.operatingYoY.toFixed(1) + "%"}
          label="growth in operating spend"
          sub={`From ${fmt.shortDollar(DATA.operatingTotalPrev)} in FY${DATA.fy - 1}`}
          accent="var(--accent-fg)" size="md" />
      </div>

      <div style={{
        marginTop: 56, padding: "20px 24px",
        background: "var(--paper-2)", border: "0.5px solid var(--hair)", borderRadius: 6,
        display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap",
      }}>
        <span style={{
          fontFamily: "var(--ff-display)", fontStyle: "italic",
          fontSize: 22, color: "var(--accent-fg)", lineHeight: 1,
        }}>What you'll find →</span>
        <div style={{
          display: "grid", gap: 10, flex: 1,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}>
          {[
            ["#income", "01", "Where the money comes from"],
            ["#spending", "02", "Where the money goes"],
            ["#departments", "03", "Who pays their own way"],
            ["#funds", "04", "Six pots, six sets of rules"],
          ].map(([href, n, q]) => (
            <a key={href} href={href} style={{
              textDecoration: "none", color: "var(--ink)",
              fontSize: 13.5, lineHeight: 1.35,
              display: "flex", gap: 10, padding: "8px 0",
            }}>
              <span style={{
                fontFamily: "var(--ff-display)", fontStyle: "italic",
                color: "var(--accent-fg)", fontSize: 14,
              }}>§{n}</span>
              <span style={{ textWrap: "pretty" }}>{q}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CycleVisual — two opposing bars showing inflow and outflow side-by-side
function CycleVisual({ mode }) {
  const inVal = DATA.revenueTotal;
  const outVal = DATA.operatingTotal;
  const top3Rev = DATA.revByType.slice(0, 3);
  const top3Out = DATA.opByOG.slice(0, 3);
  const restRev = inVal - top3Rev.reduce((s, r) => s + r.amount, 0);
  const restOut = outVal - top3Out.reduce((s, r) => s + Math.abs(r.amount), 0);

  return (
    <div style={{ marginTop: 56 }}>
      <FlowBar side="in" total={inVal}
        segs={[...top3Rev.map(t => ({ name: t.name, icon: t.icon, val: t.amount })),
               { name: "Everything else", icon: "·", val: restRev }]} />
      <div style={{
        margin: "12px 0", display: "flex", alignItems: "center", gap: 12,
        fontFamily: "var(--ff-display)", fontStyle: "italic",
        fontSize: 18, color: "var(--sub)",
      }}>
        <span style={{ flex: 1, height: 0, borderTop: "0.5px solid var(--hair)" }} />
        <span>the city</span>
        <span style={{ flex: 1, height: 0, borderTop: "0.5px solid var(--hair)" }} />
      </div>
      <FlowBar side="out" total={outVal}
        segs={[...top3Out.map(t => ({ name: t.name, icon: t.icon, val: Math.abs(t.amount) })),
               { name: "Everything else", icon: "·", val: restOut }]} />
    </div>
  );
}

function FlowBar({ side, total, segs }) {
  const isIn = side === "in";
  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--sub)",
        }}>{isIn ? "Money in · Top sources" : "Money out · Top destinations"}</span>
        <span style={{
          fontFamily: "var(--ff-display)",
          fontSize: 24, lineHeight: 1,
          color: "var(--ink)", fontVariantNumeric: "tabular-nums",
        }}>{fmt.shortDollar(total)}</span>
      </div>
      <div style={{
        display: "flex", height: 44, borderRadius: 5, overflow: "hidden",
        border: "0.5px solid var(--hair)",
      }}>
        {segs.map((s, i) => {
          const pct = (s.val / total) * 100;
          return (
            <div key={i} title={`${s.name}: ${fmt.shortDollar(s.val)}`}
                 style={{
                   width: `${pct}%`,
                   background: i === 0 ? "var(--accent-fg)"
                     : i === segs.length - 1 ? "var(--paper-2)"
                     : `color-mix(in oklab, var(--accent-fg) ${60 - i * 18}%, var(--ink))`,
                   borderRight: i < segs.length - 1 ? "1px solid var(--paper)" : "none",
                   display: "flex", alignItems: "center", gap: 6, padding: "0 10px",
                   fontSize: 11, fontWeight: 600, color: i === segs.length - 1 ? "var(--sub)" : "var(--paper)",
                   overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                 }}>
              <span style={{ fontSize: 14 }}>{s.icon}</span>
              {pct > 8 && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.name}
              </span>}
            </div>
          );
        })}
      </div>
      <div style={{
        display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap",
        fontSize: 11, color: "var(--sub)", fontVariantNumeric: "tabular-nums",
      }}>
        {segs.map((s, i) => (
          <span key={i}>
            <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{s.icon} {s.name}</strong>{" "}
            {fmt.shortDollar(s.val)} · {fmt.pct(s.val, total)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── §01 Money In ───────────────────────────────────────────────────────────
function IncomeSection({ palette }) {
  const types = DATA.revByType;
  const total = DATA.revenueTotal;
  const [active, setActive] = React.useState(null);
  const activeType = active ? types.find((t) => t.name === active) : null;

  return (
    <section id="income" data-screen-label="02 Money In"
             style={{ padding: "clamp(48px, 7vw, 96px) 0", borderTop: "0.5px solid var(--ink)" }}>
      <SectionHeader number={1} eyebrow="Money in · Revenue"
        title="Where the money comes from"
        lede="Every dollar Dallas collects fits into one of these 13 categories. Property taxes are by far the biggest source — but they're not the only one. Click any row for plain-language details and the actual line items inside." />

      <div style={{ marginBottom: 28 }}>
        <DollarBar items={types.map((t) => ({ id: t.name, amount: t.amount }))}
                   total={total} palette={palette}
                   active={active} onActive={setActive} />
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: "clamp(24px, 4vw, 64px)", alignItems: "start",
      }}>
        <div>
          {types.map((t, i) => {
            const isActive = active === t.name;
            return (
              <CategoryRow key={t.name} item={t} total={total} color={palette[i % palette.length]}
                onActivate={() => setActive(isActive ? null : t.name)}
                onHover={() => setActive(t.name)}
                dim={active && !isActive} />
            );
          })}
        </div>

        <DetailPanel active={activeType} label="Revenue Type" emptyTitle='“Out of every dollar Dallas collects…”'
          emptyBody="Hover any segment of the bar — or any row — to see how many cents come from each category and who pays it." />
      </div>
    </section>
  );
}

// ── §02 Money Out ─────────────────────────────────────────────────────────
function SpendingSection({ palette }) {
  const groups = DATA.opByOG;
  const total = DATA.operatingTotal;
  // Filter out Reimbursements (negative) for the cents-on-a-dollar bar — they
  // are net offsets and showing them visually as a slice misleads.
  const posGroups = groups.filter(g => g.amount > 0);
  const totalPos = posGroups.reduce((s, g) => s + g.amount, 0);
  const [active, setActive] = React.useState(null);
  const activeGroup = active ? groups.find((g) => g.name === active) : null;

  return (
    <section id="spending" data-screen-label="03 Money Out"
             style={{ padding: "clamp(48px, 7vw, 96px) 0", borderTop: "0.5px solid var(--ink)" }}>
      <SectionHeader number={2} eyebrow="Money out · Operating"
        title="Where the money goes"
        lede="Not by department — by the kind of thing the city is paying for. Roughly 42 cents of every dollar goes to the people who work for the city. Another 27 cents goes to outside contractors. The rest pays for debt, supplies, and equipment." />

      <div style={{ marginBottom: 28 }}>
        <DollarBar items={posGroups.map((g) => ({ id: g.name, amount: g.amount }))}
                   total={totalPos} palette={palette}
                   active={active} onActive={setActive} />
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: "clamp(24px, 4vw, 64px)", alignItems: "start",
      }}>
        <div>
          {groups.map((g, i) => {
            const isActive = active === g.name;
            return (
              <CategoryRow key={g.name} item={g} total={totalPos} color={palette[i % palette.length]}
                onActivate={() => setActive(isActive ? null : g.name)}
                onHover={() => setActive(g.name)}
                dim={active && !isActive} />
            );
          })}
        </div>

        <DetailPanel active={activeGroup} label="Object Group" emptyTitle='“Where does the spending actually go?”'
          emptyBody="Cents-on-a-dollar share by the city's official 'object group' — the kind of thing a dollar buys."
          mode="spending" />
      </div>

      <div style={{ marginTop: 56 }}>
        <h3 style={{
          fontFamily: "var(--ff-display)", margin: 0,
          fontSize: "clamp(24px, 2.6vw, 36px)", lineHeight: 1,
          letterSpacing: "-0.02em", fontWeight: 400,
        }}>What it actually buys</h3>
        <p style={{
          marginTop: 12, fontSize: 14.5, color: "var(--sub)",
          lineHeight: 1.5, maxWidth: 640, textWrap: "pretty",
        }}>
          The top 12 specific city <em>services</em> by dollar amount — each is a
          line of the operating budget tied to a department.
        </p>
        <div style={{ marginTop: 24 }}>
          {DATA.topServices.slice(0, 12).map((s, i) => (
            <ServiceRow key={s.name} service={s} rank={i + 1}
                        max={DATA.topServices[0].amount} total={total} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CategoryRow (shared between income types + spending groups) ───────────
function CategoryRow({ item, total, color, onActivate, onHover, dim }) {
  return (
    <button onMouseEnter={onHover} onClick={onActivate}
            style={{
              all: "unset", cursor: "pointer", display: "block", width: "100%",
              opacity: dim ? 0.45 : 1, transition: "opacity .2s",
            }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "16px 22px 1fr auto auto",
        gap: 12, alignItems: "center",
        padding: "10px 0",
        borderBottom: "0.5px solid var(--hair)",
      }}>
        <span style={{ width: 12, height: 12, borderRadius: 2, background: color }} />
        <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{item.name}</span>
        <span style={{
          fontFamily: "var(--ff-display)", fontSize: 22, lineHeight: 1,
          color: item.amount < 0 ? "var(--sub)" : "var(--ink)",
          fontVariantNumeric: "tabular-nums",
        }}>{item.amount < 0 ? "−" : ""}{fmt.cents(Math.abs(item.amount), total)}¢</span>
        <span style={{
          fontSize: 12, color: "var(--sub)", minWidth: 76,
          textAlign: "right", fontVariantNumeric: "tabular-nums",
        }}>{item.amount < 0 ? "−" : ""}{fmt.shortDollar(Math.abs(item.amount))}</span>
      </div>
    </button>
  );
}

// ── DetailPanel (shared) ──────────────────────────────────────────────────
function DetailPanel({ active, label, emptyTitle, emptyBody, mode = "income" }) {
  const total = mode === "income" ? DATA.revenueTotal : DATA.operatingTotal;
  return (
    <div style={{
      position: "sticky", top: 88,
      background: "var(--paper-2)",
      border: "0.5px solid var(--hair)",
      padding: "clamp(24px, 3vw, 36px)",
      borderRadius: 6, minHeight: 320,
    }}>
      {active ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>{active.icon}</span>
            <Pill accent>{label}</Pill>
          </div>
          <div style={{
            marginTop: 14,
            fontFamily: "var(--ff-display)",
            fontSize: "clamp(28px, 3vw, 42px)", lineHeight: 1,
            letterSpacing: "-0.02em", color: "var(--ink)",
          }}>{active.name}</div>
          <div style={{
            marginTop: 10,
            fontFamily: "var(--ff-display)", fontStyle: "italic",
            fontSize: 18, color: "var(--accent-fg)",
          }}>
            {active.amount < 0 ? "−" : ""}{fmt.cents(Math.abs(active.amount), total)}¢ of every dollar ·{" "}
            {active.amount < 0 ? "−" : ""}{fmt.shortDollar(Math.abs(active.amount))}
          </div>
          <p style={{
            marginTop: 18, fontSize: 14.5, lineHeight: 1.55,
            color: "var(--ink)", textWrap: "pretty",
          }}>{active.blurb}</p>
          {active.paidBy && (
            <div style={{
              marginTop: 16, padding: "12px 14px",
              background: "var(--paper)", borderRadius: 5,
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "var(--sub)", marginBottom: 6 }}>Who pays</div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>{active.paidBy}</div>
            </div>
          )}
          {active.educate && (
            <p style={{
              marginTop: 14, fontSize: 13, color: "var(--sub)",
              lineHeight: 1.5, fontStyle: "italic",
              fontFamily: "var(--ff-display)",
            }}>{active.educate}</p>
          )}
          {active.rows && active.rows.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "var(--sub)", marginBottom: 8 }}>
                Top line items in this category
              </div>
              {active.rows.slice(0, 5).map((r, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", gap: 12,
                  padding: "6px 0",
                  borderBottom: i < 4 ? "0.5px solid var(--hair)" : "none",
                  fontSize: 12.5,
                }}>
                  <span style={{ flex: 1, color: "var(--ink)", textWrap: "pretty" }}>
                    {r.pl || r.src}
                  </span>
                  <span style={{ color: "var(--sub)", fontVariantNumeric: "tabular-nums" }}>
                    {fmt.shortDollar(r.bud)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{
            fontFamily: "var(--ff-display)", fontStyle: "italic",
            fontSize: "clamp(22px, 2.2vw, 30px)", lineHeight: 1.2,
            color: "var(--ink)", textWrap: "balance",
          }}>{emptyTitle}</div>
          <p style={{
            marginTop: 18, fontSize: 14, lineHeight: 1.55,
            color: "var(--sub)", textWrap: "pretty",
          }}>{emptyBody}</p>
        </>
      )}
    </div>
  );
}

// ── ServiceRow ─────────────────────────────────────────────────────────────
function ServiceRow({ service, rank, max, total }) {
  const pct = (service.amount / max) * 100;
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "28px minmax(240px, 2.4fr) minmax(120px, 3fr) auto",
      gap: 14, alignItems: "center", padding: "11px 0",
      borderBottom: "0.5px solid var(--hair)",
    }}>
      <span style={{
        fontFamily: "var(--ff-display)", fontStyle: "italic",
        fontSize: 14, color: "var(--sub)", fontVariantNumeric: "tabular-nums",
      }}>{String(rank).padStart(2, "0")}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)",
          lineHeight: 1.3, textWrap: "pretty" }}>{service.name}</div>
        <div style={{ fontSize: 11, color: "var(--sub)", marginTop: 3 }}>
          {service.dept} · {service.og}
        </div>
      </div>
      <div style={{ position: "relative", height: 18 }}>
        <div style={{
          position: "absolute", inset: "2px 0", width: `${pct}%`,
          background: "var(--accent-fg)", borderRadius: 2,
        }} />
      </div>
      <div style={{
        display: "flex", gap: 12, alignItems: "baseline",
        fontVariantNumeric: "tabular-nums", minWidth: 130, justifyContent: "flex-end",
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
          {fmt.shortDollar(service.amount)}
        </span>
        <span style={{ fontSize: 12, color: "var(--sub)" }}>{fmt.pct(service.amount, total)}</span>
      </div>
    </div>
  );
}

// ── §03 Departments — both sides per department ───────────────────────────
function DepartmentsSection({ mode }) {
  const [openId, setOpenId] = React.useState(null);
  const depts = DATA.departments;
  const open = depts.find((d) => d.id === openId);
  const [sort, setSort] = React.useState("spend");
  // sort options: spend (biggest first), earn (most self-funded first), subsidy (biggest gap)

  const sorted = [...depts].sort((a, b) => {
    if (sort === "spend") return b.spend - a.spend;
    if (sort === "earn") return (b.earned > 0 ? b.earned : 0) - (a.earned > 0 ? a.earned : 0);
    if (sort === "subsidy") return b.subsidy - a.subsidy;
    if (sort === "funded") return b.funded - a.funded;
    return 0;
  });

  const maxBar = Math.max(...depts.map(d => Math.max(d.earned, d.spend)));

  return (
    <section id="departments" data-screen-label="04 Departments"
             style={{ padding: "clamp(48px, 7vw, 96px) 0", borderTop: "0.5px solid var(--ink)" }}>
      <SectionHeader number={3} eyebrow="The match-up · departments"
        title="Who pays their own way — and who is taxpayer-funded?"
        lede="For each city department, here's what it brings in (revenue earned) and what it spends (operating budget). A department whose two bars match — like Water Utilities — pays for itself. A department with a tiny revenue bar and a huge spending bar — like Police — is funded by general tax dollars." />

      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
        marginBottom: 24,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--sub)", marginRight: 8,
        }}>Sort by</span>
        {[
          ["spend", "Spend"],
          ["earn", "Revenue earned"],
          ["funded", "Self-funded"],
          ["subsidy", "Tax subsidy"],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setSort(id)}
                  style={{
                    all: "unset", cursor: "pointer",
                    padding: "6px 14px", borderRadius: 99,
                    fontSize: 12, fontWeight: 600,
                    background: sort === id ? "var(--ink)" : "transparent",
                    color: sort === id ? "var(--paper)" : "var(--sub)",
                    border: "0.5px solid",
                    borderColor: sort === id ? "var(--ink)" : "var(--hair)",
                  }}>{label}</button>
        ))}
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
        gap: 16,
      }}>
        {sorted.map(d => (
          <DeptMatchupCard key={d.id} dept={d} maxBar={maxBar}
                           onClick={() => setOpenId(d.id)} />
        ))}
      </div>

      {open && <DeptDrillDown dept={open} onClose={() => setOpenId(null)} />}
    </section>
  );
}

function DeptMatchupCard({ dept, maxBar, onClick }) {
  const earnPct = (dept.earned / maxBar) * 100;
  const spendPct = (dept.spend / maxBar) * 100;

  // Self-funded label
  let badge, badgeColor;
  if (dept.spend === 0 && dept.earned > 0) {
    badge = "Revenue-only";
    badgeColor = "var(--sub)";
  } else if (dept.earned === 0 && dept.spend > 0) {
    badge = "Tax-funded";
    badgeColor = "var(--accent-fg)";
  } else if (dept.funded >= 0.85 && dept.funded <= 1.15) {
    badge = "Self-funded";
    badgeColor = "color-mix(in oklab, var(--ink) 80%, var(--accent-fg))";
  } else if (dept.funded > 1.15) {
    badge = `Surplus · ${Math.round(dept.funded * 100)}%`;
    badgeColor = "color-mix(in oklab, var(--ink) 60%, var(--accent-fg))";
  } else if (dept.funded > 0) {
    badge = `${Math.round(dept.funded * 100)}% self-funded`;
    badgeColor = "var(--accent-fg)";
  }

  return (
    <button onClick={onClick} style={{
      all: "unset", cursor: "pointer", display: "block",
      background: "var(--paper-2)", border: "0.5px solid var(--hair)",
      borderRadius: 6, padding: "18px 20px 18px",
      transition: "transform .15s, border-color .15s, box-shadow .15s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.borderColor = "var(--ink)";
      e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,.08)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "";
      e.currentTarget.style.borderColor = "var(--hair)";
      e.currentTarget.style.boxShadow = "";
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{dept.icon}</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{dept.name}</span>
        </div>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: badgeColor,
            padding: "3px 8px", borderRadius: 99,
            border: `0.5px solid ${badgeColor}`,
            whiteSpace: "nowrap",
          }}>{badge}</span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "70px 1fr auto", gap: 12, alignItems: "center", padding: "4px 0" }}>
        <span style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: "0.10em",
          textTransform: "uppercase", color: "var(--sub)",
        }}>Earned</span>
        <div style={{ position: "relative", height: 16 }}>
          <div style={{
            position: "absolute", inset: "2px 0",
            width: `${Math.max(0.5, earnPct)}%`,
            background: "color-mix(in oklab, var(--accent-fg) 55%, var(--paper))",
            borderRadius: 2,
          }} />
        </div>
        <span style={{
          fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums",
          color: "var(--ink)", minWidth: 64, textAlign: "right",
        }}>{dept.earned > 0 ? fmt.shortDollar(dept.earned) : "—"}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "70px 1fr auto", gap: 12, alignItems: "center", padding: "4px 0" }}>
        <span style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: "0.10em",
          textTransform: "uppercase", color: "var(--sub)",
        }}>Spent</span>
        <div style={{ position: "relative", height: 16 }}>
          <div style={{
            position: "absolute", inset: "2px 0",
            width: `${Math.max(0.5, spendPct)}%`,
            background: "var(--ink)",
            borderRadius: 2,
          }} />
        </div>
        <span style={{
          fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums",
          color: "var(--ink)", minWidth: 64, textAlign: "right",
        }}>{dept.spend > 0 ? fmt.shortDollar(dept.spend) : "—"}</span>
      </div>

      <div style={{
        marginTop: 12, paddingTop: 12,
        borderTop: "0.5px solid var(--hair)",
        fontSize: 12.5, color: "var(--sub)", lineHeight: 1.5,
        textWrap: "pretty",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>{dept.blurb}</div>
    </button>
  );
}

function DeptDrillDown({ dept, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const maxRev = dept.topRev.length ? Math.max(...dept.topRev.map(r => r.amount)) : 0;
  const maxSvc = dept.topSvcs.length ? Math.max(...dept.topSvcs.map(s => s.amount)) : 0;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(20,23,31,.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "clamp(16px, 4vw, 64px)", overflow: "auto",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--paper)", color: "var(--ink)",
        maxWidth: 960, width: "100%",
        borderRadius: 6, padding: "clamp(28px, 4vw, 56px)",
        boxShadow: "0 24px 80px rgba(0,0,0,.25)", position: "relative",
      }}>
        <button onClick={onClose} aria-label="Close" style={{
          all: "unset", position: "absolute", top: 16, right: 18,
          width: 32, height: 32, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: "var(--sub)", borderRadius: 99,
        }}>✕</button>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 32 }}>{dept.icon}</span>
        </div>
        <h3 style={{
          fontFamily: "var(--ff-display)", margin: "16px 0 12px",
          fontSize: "clamp(32px, 3.6vw, 50px)", lineHeight: 0.95,
          letterSpacing: "-0.02em", fontWeight: 400,
        }}>{dept.name}</h3>
        <p style={{ fontSize: 16, lineHeight: 1.55, maxWidth: 680,
          color: "var(--ink)", textWrap: "pretty", margin: 0 }}>{dept.blurb}</p>

        <div style={{
          marginTop: 28, display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 24, padding: "20px 0",
          borderTop: "0.5px solid var(--hair)",
          borderBottom: "0.5px solid var(--hair)",
        }}>
          <BigStat kicker="Revenue earned"
            value={dept.earned > 0 ? fmt.shortDollar(dept.earned) : "—"}
            sub={dept.earned > 0 ? fmt.full(dept.earned) : "No direct revenue"} size="sm" />
          <BigStat kicker="Operating spend"
            value={dept.spend > 0 ? fmt.shortDollar(dept.spend) : "—"}
            sub={dept.spend > 0 ? fmt.full(dept.spend) : "No operating spend"} size="sm" />
          {dept.spend > 0 && dept.subsidy > 0 && (
            <BigStat kicker="Tax-funded gap"
              value={fmt.shortDollar(dept.subsidy)}
              sub="paid by the General Fund"
              accent="var(--accent-fg)" size="sm" />
          )}
          {dept.spend > 0 && dept.spend > 0 && dept.funded >= 0.85 && (
            <BigStat kicker="Self-funded"
              value={Math.round(dept.funded * 100) + "%"}
              sub="covers its own costs" size="sm" />
          )}
        </div>

        {dept.topRev.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--sub)", marginBottom: 14 }}>
              How it earns revenue
            </div>
            {dept.topRev.map((r, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "minmax(220px, 2.5fr) minmax(120px, 3fr) auto",
                gap: 14, alignItems: "center", padding: "10px 0",
                borderBottom: "0.5px solid var(--hair)",
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)",
                    lineHeight: 1.3, textWrap: "pretty" }}>{r.pl || r.name}</div>
                  <div style={{ fontSize: 11, color: "var(--sub)", marginTop: 2 }}>{r.type}</div>
                </div>
                <div style={{ position: "relative", height: 16 }}>
                  <div style={{
                    position: "absolute", inset: "2px 0",
                    width: `${(r.amount / maxRev) * 100}%`,
                    background: "color-mix(in oklab, var(--accent-fg) 55%, var(--paper))",
                    borderRadius: 2,
                  }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums",
                  color: "var(--ink)", textAlign: "right", minWidth: 80 }}>{fmt.shortDollar(r.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {dept.topSvcs.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--sub)", marginBottom: 14 }}>
              What it spends on (top services)
            </div>
            {dept.topSvcs.map((s, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "minmax(220px, 2.5fr) minmax(120px, 3fr) auto",
                gap: 14, alignItems: "center", padding: "10px 0",
                borderBottom: "0.5px solid var(--hair)",
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)",
                    lineHeight: 1.3, textWrap: "pretty" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--sub)", marginTop: 2 }}>{s.og}</div>
                </div>
                <div style={{ position: "relative", height: 16 }}>
                  <div style={{
                    position: "absolute", inset: "2px 0",
                    width: `${(s.amount / maxSvc) * 100}%`,
                    background: "var(--ink)", borderRadius: 2,
                  }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums",
                  color: "var(--ink)", textAlign: "right", minWidth: 80 }}>{fmt.shortDollar(s.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── §04 Funds — both sides ────────────────────────────────────────────────
function FundsSection({ palette }) {
  const funds = DATA.funds;
  const [active, setActive] = React.useState(funds[0].name);
  const activeFund = funds.find((f) => f.name === active);
  const maxAmount = Math.max(...funds.map(f => Math.max(f.in, f.out)));

  return (
    <section id="funds" data-screen-label="05 Funds"
             style={{ padding: "clamp(48px, 7vw, 96px) 0", borderTop: "0.5px solid var(--ink)" }}>
      <SectionHeader number={4} eyebrow="Six pots of money"
        title="The funds, in & out"
        lede="The city keeps revenue in separate 'funds' because of what each is allowed to pay for. Each fund should roughly balance — money in equals money out. Click any fund for what's inside." />

      <div style={{
        display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: "clamp(28px, 4vw, 56px)",
      }}>
        <div>
          {funds.map((f, i) => {
            const isActive = active === f.name;
            return (
              <FundRow key={f.name} fund={f} max={maxAmount} active={isActive}
                       onClick={() => setActive(f.name)}
                       onHover={() => setActive(f.name)} />
            );
          })}
        </div>

        <div style={{
          position: "sticky", top: 88, alignSelf: "start",
          background: "var(--paper-2)", border: "0.5px solid var(--hair)",
          padding: "clamp(24px, 3vw, 36px)", borderRadius: 6,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 32 }}>{activeFund.icon}</span>
            <Pill accent>Fund</Pill>
          </div>
          <h3 style={{
            fontFamily: "var(--ff-display)", margin: "14px 0 10px",
            fontSize: "clamp(28px, 3vw, 42px)", lineHeight: 0.95,
            letterSpacing: "-0.02em", fontWeight: 400,
          }}>{activeFund.name}</h3>
          <div style={{
            fontFamily: "var(--ff-display)", fontStyle: "italic",
            fontSize: 18, color: "var(--accent-fg)",
            fontVariantNumeric: "tabular-nums",
          }}>
            In {fmt.shortDollar(activeFund.in)} · Out {fmt.shortDollar(activeFund.out)}
          </div>
          <p style={{
            marginTop: 16, fontSize: 14.5, lineHeight: 1.55,
            color: "var(--ink)", textWrap: "pretty",
          }}>{activeFund.blurb}</p>

          <div style={{ marginTop: 16, padding: "12px 14px",
            background: "var(--paper)", borderRadius: 5 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--sub)", marginBottom: 6 }}>Who pays</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{activeFund.paidBy}</div>
          </div>

          <div style={{ marginTop: 14, padding: "12px 14px",
            background: "var(--paper)", borderRadius: 5 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--sub)", marginBottom: 6 }}>Flexibility</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{activeFund.flexibility}</div>
          </div>

          {activeFund.topDeptsOut.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "var(--sub)", marginBottom: 8 }}>
                Top departments funded by this pot
              </div>
              {activeFund.topDeptsOut.map((d, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", gap: 12,
                  padding: "6px 0",
                  borderBottom: i < activeFund.topDeptsOut.length - 1 ? "0.5px solid var(--hair)" : "none",
                  fontSize: 12.5,
                }}>
                  <span style={{ flex: 1, color: "var(--ink)" }}>{d.name}</span>
                  <span style={{ color: "var(--sub)", fontVariantNumeric: "tabular-nums" }}>
                    {fmt.shortDollar(d.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FundRow({ fund, max, active, onClick, onHover }) {
  const inPct  = (fund.in  / max) * 100;
  const outPct = (fund.out / max) * 100;
  return (
    <button onClick={onClick} onMouseEnter={onHover}
            style={{
              all: "unset", cursor: "pointer", display: "block", width: "100%",
              marginBottom: 10, padding: "16px 18px", borderRadius: 6,
              background: active ? "var(--paper-2)" : "transparent",
              border: "0.5px solid",
              borderColor: active ? "var(--ink)" : "var(--hair)",
              transition: "background .15s, border-color .15s",
            }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>{fund.icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{fund.name}</div>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 10, alignItems: "center", padding: "3px 0" }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
          textTransform: "uppercase", color: "var(--sub)" }}>In</span>
        <div style={{ position: "relative", height: 14 }}>
          <div style={{
            position: "absolute", inset: "2px 0", width: `${inPct}%`,
            background: "color-mix(in oklab, var(--accent-fg) 55%, var(--paper))",
            borderRadius: 2,
          }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums",
          color: "var(--ink)", minWidth: 64, textAlign: "right" }}>{fmt.shortDollar(fund.in)}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 10, alignItems: "center", padding: "3px 0" }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
          textTransform: "uppercase", color: "var(--sub)" }}>Out</span>
        <div style={{ position: "relative", height: 14 }}>
          <div style={{
            position: "absolute", inset: "2px 0", width: `${outPct}%`,
            background: "var(--ink)", borderRadius: 2,
          }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums",
          color: "var(--ink)", minWidth: 64, textAlign: "right" }}>{fmt.shortDollar(fund.out)}</span>
      </div>
    </button>
  );
}

// ── §05 Glossary ──────────────────────────────────────────────────────────
function GlossarySection() {
  return (
    <section id="glossary" data-screen-label="06 Glossary"
             style={{ padding: "clamp(48px, 7vw, 96px) 0", borderTop: "0.5px solid var(--ink)" }}>
      <SectionHeader number={5} eyebrow="Plain-language glossary"
        title="What the words actually mean"
        lede="Budget documents use a lot of jargon. Here's what each term means — in plain English." />
      <div>
        {DATA.glossary.map((g) => (
          <Disclosure key={g.term} q={g.term} a={g.def} />
        ))}
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function FooterSection() {
  return (
    <footer style={{
      padding: "48px 0 32px", marginTop: 64,
      borderTop: "0.5px solid var(--ink)",
      display: "flex", justifyContent: "space-between", alignItems: "flex-end",
      flexWrap: "wrap", gap: 24,
    }}>
      <div>
        <div style={{
          fontFamily: "var(--ff-display)", fontSize: 24, lineHeight: 1,
          letterSpacing: "-0.02em",
        }}>City of Dallas · FY {DATA.fy} Budget</div>
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--sub)",
          maxWidth: 600, lineHeight: 1.5 }}>
          A citizen-facing view of the City of Dallas adopted budget — both the
          revenue side (money in) and the operating side (money out). Built from
          the city's Open Data Portal exports, with plain-language translations
          the city's data team wrote for each line item.
        </div>
      </div>
      <div style={{
        fontSize: 11, color: "var(--sub)", letterSpacing: "0.08em",
        textTransform: "uppercase", textAlign: "right",
      }}>
        <div>Source: Revenue + Operating Budget 2026-05-20</div>
        <div style={{ marginTop: 4 }}>Adopted Sep 2025 · Effective Oct 1 2025 – Sep 30 2026</div>
      </div>
    </footer>
  );
}

Object.assign(window, {
  Hero, IncomeSection, SpendingSection, DepartmentsSection,
  FundsSection, GlossarySection, FooterSection,
});

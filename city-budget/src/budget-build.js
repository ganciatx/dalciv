import REVSOURCE_TYPE_MAP from "../public/data/revsource-type-map.json";

let revsourceDisplayMap = {};


/**
 * Builds window.BUDGET_DATA for the Dallas Budget proto UI from API-normalized rows.
 */

/** Expand chart-of-accounts abbreviations when plain-language field is absent. */
function humanizeRevsource(raw) {
    const s = String(raw || "").trim();
    if (!s) return s;
    if (/^[A-Z][a-z]/.test(s) && s.includes(" ") && !/\.[A-Z]/.test(s)) return s;
    return s
      .replace(/^Prop\.Taxs-/i, "Property taxes — ")
      .replace(/^Chgs Serv-/i, "Service charges — ")
      .replace(/^Intfd-/i, "Interfund — ")
      .replace(/^Fines\/For-/i, "Fines and forfeitures — ")
      .replace(/^Fines\/Fro-/i, "Fines — ")
      .replace(/^Taxes-/i, "Taxes — ")
      .replace(/Real Est/gi, "real estate")
      .replace(/Rl Est/gi, "real estate")
      .replace(/\bTxs\b/gi, "taxes")
      .replace(/Est-/gi, "estate — ")
      .replace(/\bRev\b/gi, "revenue")
      .replace(/-/g, " · ")
      .replace(/\s+/g, " ")
      .trim();
}

function isAccountCode(s) {
    return /^\d+[A-Za-z]?$/.test(String(s || "").trim());
}

function revsourceLabel(r) {
    const displayMap = revsourceDisplayMap;
    let pl = String(r.revsource_pl || "").trim();
    if (isAccountCode(pl)) pl = "";
    const src = String(r.revsource || r.src || "").trim();
    const code = String(r.rsrc || r.code || "").trim();
    return pl
      || displayMap[src]
      || displayMap[code]
      || humanizeRevsource(src)
      || src
      || (isAccountCode(code) ? "" : code);
}

/** Prefer friendly labels; never show bare account codes in the UI. */
function revsourceLineLabel(r) {
    const src = String(r.src || r.revsource || "").trim();
    const code = String(r.code || r.rsrc || "").trim();
    let pl = String(r.pl || r.revsource_pl || "").trim();
    if (isAccountCode(pl)) pl = "";
    if (pl) return pl;
    return revsourceLabel({ revsource: src, revsource_pl: "", rsrc: code, src, code });
}



function inferRevType(src) {
    const s = String(src || "").toLowerCase();
    if (/property|tax rate|ad valorem/.test(s)) return "Property Taxes";
    if (/water|wastewater|stormwater|utility|sanitation/.test(s)) return "Utility Revenue";
    if (/sales tax|hotel|occupancy/.test(s)) return "Taxes";
    if (/franchise|electric|gas|telecom/.test(s)) return "Franchise & Licensing Revenue";
    if (/permit|license/.test(s)) return "Permits & Licenses";
    if (/fine|penalt|ticket/.test(s)) return "Fines & Penalties";
    if (/grant|intergovernmental|federal|state/.test(s)) return "Intergovernmental Revenue";
    if (/interest|investment/.test(s)) return "Investment & Interest Income";
    if (/rent|lease/.test(s)) return "Rents & Leases";
    if (/fee|charge|service/.test(s)) return "Service Fees";
    if (/transfer|interfund|internal/.test(s)) return "Internal/Interfund Revenue";
    return "Other Revenue";
}

function mapRevRow(r) {
    const src = String(r.revsource || "").trim();
    const plRaw = String(r.revsource_pl || "").trim();
    const code = String(r.rsrc || "").trim();
    const mapped = {
      type: r.revtype
        || REVSOURCE_TYPE_MAP[src]
        || REVSOURCE_TYPE_MAP[plRaw]
        || inferRevType(src || plRaw),
      fund: String(r.fundtype || "").trim(),
      dept: String(r.department || "").trim(),
      src,
      code,
      bud: Number(r.amount_budget) || 0,
      rev: Number(r.amount_revenue_fy) || 0,
    };
    mapped.pl = revsourceLineLabel(mapped);
    return mapped;
}

function mapOpRow(r) {
    return {
      og: String(r.objectgroup || "").trim(),
      svc: String(r.service || r.svc || "").trim(),
      dept: String(r.appropriation || r.appr || r.department || "").trim(),
      fund: String(r.fundtype || "").trim(),
      bud: Number(r.amount_budget) || 0,
      exp: Number(r.amount_expenditure) || 0,
      enc: Number(r.amount_encumbered) || 0,
    };
}

export function buildBudgetData (apiRevRows, apiOpRows, apiRevPrev, apiOpPrev, opts) {
    const POP = opts?.population ?? 1302868;
    const HOUSEHOLDS = opts?.households ?? 533450;
    const FY = String(opts?.fy ?? "2026");

    if (opts?.displayMap && typeof opts.displayMap === "object") {
      revsourceDisplayMap = opts.displayMap;
    }

    const revRows = (apiRevRows || []).map(mapRevRow);
    const opRows = (apiOpRows || []).map(mapOpRow);
    const revRowsPrev = (apiRevPrev || []).map(mapRevRow);
    const opRowsPrev = (apiOpPrev || []).map(mapOpRow);

// ── Plain-language for revenue TYPES ─────────────────────────────────────
const REVTYPE_INFO = {
    "Property Taxes": { icon: "🏠",
      blurb: "Taxes on the value of real estate and personal property in Dallas. The single largest source of city revenue.",
      paidBy: "Property owners. Renters pay it indirectly through rent.",
      educate: "Set per $100 of appraised value. The FY26 rate is $0.7251 — about $2,175 a year on a $300,000 home." },
    "Utility Revenue": { icon: "💧",
      blurb: "Money the city collects for water, wastewater, stormwater, and other utility services it operates.",
      paidBy: "Anyone with a Dallas water meter or stormwater fee.",
      educate: "Dallas Water Utilities is an 'enterprise' — it pays for itself through your water bill, not through taxes." },
    "Taxes": { icon: "🛍️",
      blurb: "Other taxes beyond property tax — mainly sales tax and hotel occupancy tax.",
      paidBy: "Shoppers, hotel guests, and anyone buying things in Dallas.",
      educate: "Dallas gets 1% of the 8.25% Texas state sales tax. Hotel occupancy tax is paid by visitors, not residents." },
    "Internal/Interfund Revenue": { icon: "🔁",
      blurb: "Money moving between different city departments and funds — one part of the city paying another for services.",
      paidBy: "City departments paying each other.",
      educate: "Counted as revenue in the receiving fund, but it doesn't bring in new outside dollars." },
    "Service Fees": { icon: "🧾",
      blurb: "Charges for specific services the city provides — ambulance rides, sanitation collection, aviation landing fees.",
      paidBy: "The people who use those services.",
      educate: "Fees recover the cost of service from users rather than spreading it across all taxpayers." },
    "Concessions & Commercial Revenue": { icon: "🏟️",
      blurb: "Money from businesses operating on city property — concession stands, parking garages, NTTA tollway concessions.",
      paidBy: "Concessionaires and tenants.",
      educate: "Most of this is generated at city-owned facilities like Love Field and the Convention Center." },
    "Franchise & Licensing Revenue": { icon: "⚡",
      blurb: "Fees paid by utilities (electric, gas, telecom) for the right to use the city's public rights-of-way.",
      paidBy: "Oncor, Atmos, AT&T, and other franchised utilities.",
      educate: "Utilities pass these fees on to you in your monthly bills." },
    "Rents & Leases": { icon: "🏢",
      blurb: "Rental income from city-owned property — terminals, retail space, ground leases.",
      paidBy: "Tenants of city property.",
      educate: "Dallas Love Field terminal rental is one of the largest single line items here." },
    "Permits & Licenses": { icon: "📋",
      blurb: "Fees for building permits, business licenses, food handler permits, and similar.",
      paidBy: "Builders, developers, and businesses.",
      educate: "Tied to construction activity — these revenues rise and fall with the economy." },
    "Investment & Interest Income": { icon: "💰",
      blurb: "Interest earned on the city's cash reserves and pooled investments.",
      paidBy: "Banks and US Treasury securities.",
      educate: "Higher interest rates have made this a much bigger line in recent years." },
    "Intergovernmental Revenue": { icon: "🏛️",
      blurb: "Money from other governments — state and federal grants for specific programs.",
      paidBy: "Texas and the federal government.",
      educate: "Usually restricted — has to be spent on a specific purpose." },
    "Fines & Penalties": { icon: "🚓",
      blurb: "Traffic tickets, code-violation fines, library fines, and similar penalties.",
      paidBy: "Whoever gets the ticket.",
      educate: "A small share of total revenue. Most goes to court operations." },
    "Other Revenue": { icon: "📦",
      blurb: "Miscellaneous revenue not captured by the other categories.",
      paidBy: "Various.",
      educate: "Includes insurance recoveries, sale of property, and one-time items." },
};

// ── Plain-language for object GROUPS (how money is spent) ────────────────
const OG_INFO = {
    "Personnel Services": { icon: "👥",
      blurb: "Salaries, benefits, overtime, and retirement contributions for the people who work for the city.",
      educate: "The single biggest cost category. Dallas employs roughly 14,000 people." },
    "Contractual & Other Services": { icon: "📑",
      blurb: "Outside contractors, professional services, leases, training, travel, insurance, utilities — anything the city pays another business to do.",
      educate: "Mowing, software licenses, consulting, lawyers, banking fees, and utility bills all live here." },
    "Transfers Out": { icon: "↪️",
      blurb: "Money moved from one city fund to another — like transferring savings to checking inside the city.",
      educate: "Often used to fund debt service or move General Fund support to a specific program." },
    "Supplies & Materials": { icon: "🧰",
      blurb: "Fuel, parts, office supplies, uniforms, ammunition, books, paint — the small physical things the city buys to do its work.",
      educate: "Smaller-ticket items, typically under the city's $5,000 capital threshold." },
    "Debt Svc-Principal": { icon: "📜",
      blurb: "Principal payments on the city's bonds — the actual loan amount being repaid.",
      educate: "Cities borrow long-term to build streets, parks, and libraries. This pays back the loan itself." },
    "Debt Svc-Interest On Bonds": { icon: "💸",
      blurb: "Interest payments on the city's bonds — the cost of borrowing.",
      educate: "Combined with principal, debt service is around 13% of the budget." },
    "Capital Outlay": { icon: "🚜",
      blurb: "Major equipment purchases — vehicles, machinery, IT systems over $5,000.",
      educate: "Most physical buildings + infrastructure go through a separate Capital Budget, not Operating." },
    "Interest On Notes-Debt Service": { icon: "💵",
      blurb: "Interest on short-term notes — a small line for short-duration borrowing.",
      educate: "Rarely a big number; used for very short-term cash management." },
    "Reimbursements": { icon: "↩️",
      blurb: "Negative offsets — money returning to a fund that was originally counted as spend.",
      educate: "Shows as negative because it cancels out double-counting between departments." },
};

// ── Plain-language for FUND types ────────────────────────────────────────
const FUND_INFO = {
    "General Fund": { icon: "🏛️",
      blurb: "The city's main checking account. Funded mostly by property and sales tax, it pays for police, fire, parks, libraries, streets — most day-to-day services everyone uses.",
      paidBy: "Property taxes, sales tax, franchise fees.",
      flexibility: "Most flexible. Council can spend it on almost any city service." },
    "Enterprise Operating Fund": { icon: "💧",
      blurb: "Self-supporting businesses inside the city — Water Utilities, Sanitation, Aviation, Convention Center. They earn their own revenue.",
      paidBy: "Water bills, sanitation fees, landing fees, hotel taxes.",
      flexibility: "Restricted — water revenue has to stay in water, etc." },
    "General Obligation Debt Service": { icon: "📜",
      blurb: "Money set aside to pay back bonds the voters approved (parks, streets, libraries). Cities pay these off over 20-30 years, like a mortgage.",
      paidBy: "A portion of property tax dedicated to debt repayment.",
      flexibility: "Restricted — can only pay bondholders." },
    "Internal Service Fund": { icon: "🔧",
      blurb: "Departments that exist to charge other city departments — fleet, IT, risk management. Money moves between funds but stays inside the city.",
      paidBy: "Other city departments.",
      flexibility: "Restricted — must support internal services." },
    "Other Operating Fund": { icon: "📦",
      blurb: "Various smaller restricted funds — grants, special revenue, dedicated tax districts.",
      paidBy: "Grants and dedicated revenue sources.",
      flexibility: "Restricted to specific programs." },
    "Other - State Reimbursements": { icon: "🤝",
      blurb: "State reimbursements for state-mandated programs the city runs.",
      paidBy: "The State of Texas.",
      flexibility: "Restricted to the reimbursed program." },
};

// ── Canonical departments ────────────────────────────────────────────────
// Both data files use slightly different names. Map them to a single
// "citizen-friendly" name so we can show revenue earned vs. operating spend
// side-by-side per department.
const DEPT_CATALOG = [
    { id: "police", name: "Police", icon: "🚔",
      blurb: "Patrol, investigations, dispatch, training, and the police academy.",
      rev: ["Dallas Police Department"], op: ["Police Department GF"] },
    { id: "fire", name: "Fire-Rescue", icon: "🚒",
      blurb: "Fire suppression, ambulance & paramedic response, hazmat, and prevention.",
      rev: ["Dallas Fire-Rescue"], op: ["Dallas Fire Rescue GF"] },
    { id: "water", name: "Water Utilities", icon: "💧",
      blurb: "Drinking water treatment, wastewater, and water billing.",
      rev: ["Dallas Water Utilities"], op: ["Water Utilities DWU"] },
    { id: "aviation", name: "Aviation", icon: "🛬",
      blurb: "Dallas Love Field and Dallas Executive Airport.",
      rev: ["Aviation"], op: ["Airport Operations AVI"] },
    { id: "sanitation", name: "Sanitation", icon: "🗑️",
      blurb: "Trash, recycling, bulky pickup, and the McCommas Bluff landfill.",
      rev: ["Sanitation Services"], op: ["Sanitation Operating Fund"] },
    { id: "convention", name: "Convention Center", icon: "🎤",
      blurb: "Kay Bailey Hutchison Convention Center and city event venues.",
      rev: ["Convention And Event Services"], op: ["Convention Center CCT"] },
    { id: "publicworks", name: "Public Works", icon: "🛣️",
      blurb: "Streets, sidewalks, traffic signals, capital construction.",
      rev: ["Transportation and Public Works"], op: ["Public Works GF", "Public Works - Office of the Bond Program"] },
    { id: "parks", name: "Park & Recreation", icon: "🌳",
      blurb: "381 parks, rec centers, athletics, golf, and Fair Park grounds.",
      rev: ["Park and Recreation"], op: ["Park and Recreation GF"] },
    { id: "library", name: "Library", icon: "📚",
      blurb: "29 branches plus the Central Library — books, internet, programs.",
      rev: ["Library"], op: ["Library GF"] },
    { id: "code", name: "Code Compliance", icon: "🏚️",
      blurb: "Building, weed-lot, and nuisance code enforcement.",
      rev: ["Code Compliance"], op: ["Code Compliance GF"] },
    { id: "court", name: "Municipal Court & Detention", icon: "⚖️",
      blurb: "Traffic court, city detention, and marshal services.",
      rev: ["Dallas Municipal Court"], op: ["Court and Detention Services GF"] },
    { id: "stormwater", name: "Stormwater Drainage", icon: "🌧️",
      blurb: "Drainage system, flood control, creek protection.",
      rev: ["Stormwater Drainage Management"], op: ["Storm Drainage Mgmt Operations"] },
    { id: "it", name: "Information Technology", icon: "💻",
      blurb: "Networks, software, data services for all city departments.",
      rev: ["Information and Technology Services"], op: ["Information Technology DSV", "Radio Services DSV"] },
    { id: "fleet", name: "Equipment & Fleet", icon: "🚚",
      blurb: "City vehicles, equipment, fuel — charges other departments for these services.",
      rev: ["Equipment and Fleet Management", "Equip & Bldg Svcs"], op: ["Equipment and Fleet Management"] },
    { id: "planning", name: "Planning & Development", icon: "🏗️",
      blurb: "Building permits, zoning, development review.",
      rev: ["Planning and Development", "Sustainable Development and Construction"], op: ["Planning and Development"] },
    { id: "animal", name: "Animal Services", icon: "🐾",
      blurb: "Animal shelter, field response, adoption.",
      rev: ["Dallas Animal Services"], op: ["Dallas Animal Services GF"] },
    { id: "housing", name: "Housing & Neighborhood", icon: "🏘️",
      blurb: "Affordable housing, down-payment assistance, neighborhood grants.",
      rev: ["Office of Housing & Community Empowerment", "Housing and Community Development"], op: ["Housing & Community Empowerment"] },
    { id: "facilities", name: "Facilities", icon: "🏢",
      blurb: "City buildings, real estate, leases.",
      rev: ["Facilities and Real Estate Management"], op: ["Facilities and Real Estate Management"] },
    { id: "attorney", name: "City Attorney", icon: "⚖️",
      blurb: "Legal services for the city.",
      rev: ["City Attorney's Office"], op: ["City Attorney's Office GF"] },
    { id: "arts", name: "Arts & Culture", icon: "🎭",
      blurb: "Cultural programs, public art, arts grants.",
      rev: ["Office of Arts and Culture"], op: ["Office of Cultural Affairs GF"] },
    { id: "transportation", name: "Transportation", icon: "🚦",
      blurb: "Mobility planning, transit coordination, traffic engineering.",
      rev: ["Transportation"], op: [] },
    { id: "econdev", name: "Economic Development", icon: "📈",
      blurb: "Business attraction, retention, and TIF districts.",
      rev: ["Office Of Economic Development"], op: [] },
    { id: "risk", name: "Risk Management", icon: "🛡️",
      blurb: "Workers' compensation and risk-related programs.",
      rev: ["Office of Risk Management"], op: [] },
    { id: "controller", name: "City Controller", icon: "📊",
      blurb: "Finance, accounting, payroll, tax billing.",
      rev: ["City Controller's Office"], op: ["City Controller's Office GF"] },
    { id: "hr", name: "Human Resources", icon: "👤",
      blurb: "Recruiting, benefits, training for city employees.",
      rev: ["Human Resources"], op: ["Human Resources GF"] },
    { id: "secretary", name: "City Secretary", icon: "📋",
      blurb: "City records, public meetings, elections.",
      rev: ["City Secretary's Office"], op: [] },
    { id: "civilservice", name: "Civil Service", icon: "📝",
      blurb: "Hiring rules for civilian and uniformed staff.",
      rev: ["Civil Service"], op: [] },
    { id: "procurement", name: "Procurement", icon: "🧾",
      blurb: "City purchasing and contracts.",
      rev: ["Procurement Services"], op: [] },
    { id: "mgmt", name: "Office of Management", icon: "🏛️",
      blurb: "City Manager's office and administrative coordination.",
      rev: ["Office of Management Services"], op: [] },
    { id: "central", name: "Central Tax Pool", icon: "🏦",
      blurb: "Where property tax, sales tax, and other general revenue are collected before being allocated to General Fund departments. Not a real 'department' — an accounting holding account.",
      rev: ["Office of Budget and Management Services"], op: [] },
    { id: "debtsvc", name: "Debt Service", icon: "📜",
      blurb: "Pays principal + interest on city bonds.",
      rev: [], op: ["Debt Service BMS"] },
    { id: "nondept", name: "Non-Departmental", icon: "📦",
      blurb: "Citywide expenses not attributable to a single department — pension contributions, TIF district payments, contingency.",
      rev: [], op: ["Non-Departmental"] },
    { id: "emergency", name: "Emergency Management & 911", icon: "📞",
      blurb: "911 dispatch and emergency-management coordination.",
      rev: [], op: ["9-1-1 System Operations", "Office of Emergency Management"] },
    { id: "jail", name: "Jail Contract", icon: "🔒",
      blurb: "Contract with Dallas County for inmate housing.",
      rev: [], op: ["Jail Contract"] },
    { id: "comms", name: "Communications & 311", icon: "📣",
      blurb: "City communications, 311 service requests.",
      rev: [], op: ["Communications and Customer Experience"] },
];

function buildAppropToFriendlyMap() {
    const map = {};
    DEPT_CATALOG.forEach((dc) => {
      dc.op.forEach((opName) => {
        map[opName] = dc.name;
      });
    });
    return map;
}

function friendlyDeptName(rawDept, appropMap) {
    const d = String(rawDept || "").trim();
    if (!d) return "Unassigned";
    if (appropMap[d]) return appropMap[d];
    return d
      .replace(/\s+(GF|DWU|AVI|CCT|DSV|OBP)$/i, "")
      .replace(/\s+Operating Fund$/i, "")
      .trim() || d;
}

const APPROP_TO_FRIENDLY = buildAppropToFriendlyMap();

// ── Aggregation helpers ──────────────────────────────────────────────────
function groupSum(rows, keyFn, valFn) {
    const acc = {};
    rows.forEach(r => {
      const k = keyFn(r);
      if (!acc[k]) acc[k] = { key: k, val: 0, rows: [] };
      acc[k].val += valFn(r);
      acc[k].rows.push(r);
    });
    return acc;
}

function sumBy(rows, valFn) {
    return rows.reduce((s, r) => s + valFn(r), 0);
}

const revTotal = sumBy(revRows, r => r.bud);
const revActual = sumBy(revRows, r => r.rev);
const revTotalPrev = sumBy(revRowsPrev, r => r.bud);

const opTotal = sumBy(opRows, r => r.bud);
const opExpended = sumBy(opRows, r => r.exp);
const opEncumbered = sumBy(opRows, r => r.enc);
const opTotalPrev = sumBy(opRowsPrev, r => r.bud);

// ── Revenue by TYPE ──────────────────────────────────────────────────────
const revByType = Object.values(groupSum(revRows, r => r.type, r => r.bud))
    .map(g => ({
      name: g.key, amount: g.val,
      actual: sumBy(g.rows, r => r.rev),
      count: g.rows.length,
      rows: g.rows.sort((a, b) => b.bud - a.bud).slice(0, 8),
      ...(REVTYPE_INFO[g.key] || { icon: "📦", blurb: "", paidBy: "", educate: "" }),
    }))
    .sort((a, b) => b.amount - a.amount);

// ── Operating by OBJECT GROUP ────────────────────────────────────────────
const opByOG = Object.values(groupSum(opRows, r => r.og, r => r.bud))
    .map(g => {
      const groupTotal = g.val;
      const byDept = Object.values(
        groupSum(g.rows, r => friendlyDeptName(r.dept, APPROP_TO_FRIENDLY), r => r.bud),
      )
        .filter(x => x.val !== 0)
        .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))
        .map(x => ({
          name: x.key,
          amount: x.val,
          share: groupTotal ? (x.val / groupTotal) * 100 : 0,
        }));
      const byService = Object.values(groupSum(g.rows, r => r.svc, r => r.bud))
        .filter(x => x.key && x.key !== "NONE" && x.val !== 0)
        .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))
        .slice(0, 8)
        .map(x => ({
          name: x.key,
          amount: x.val,
          dept: friendlyDeptName(x.rows[0]?.dept, APPROP_TO_FRIENDLY),
        }));
      const byFund = Object.values(groupSum(g.rows, r => r.fund || "Unknown", r => r.bud))
        .filter(x => x.val !== 0)
        .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))
        .map(x => ({
          name: x.key,
          amount: x.val,
          share: groupTotal ? (x.val / groupTotal) * 100 : 0,
        }));
      return {
        name: g.key, amount: g.val,
        expended: sumBy(g.rows, r => r.exp),
        count: g.rows.length,
        byDept,
        byService,
        byFund,
        ...(OG_INFO[g.key] || { icon: "📦", blurb: "", educate: "" }),
      };
    })
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

// ── FUNDS — both sides ───────────────────────────────────────────────────
const fundKeys = new Set([...revRows.map(r => r.fund), ...opRows.map(r => r.fund)]);
const funds = [...fundKeys]
    .filter(Boolean)
    .map(k => {
      const inRows  = revRows.filter(r => r.fund === k);
      const outRows = opRows.filter(r => r.fund === k);
      return {
        name: k,
        in: sumBy(inRows, r => r.bud),
        out: sumBy(outRows, r => r.bud),
        topDeptsIn: Object.values(groupSum(inRows, r => r.dept, r => r.bud))
          .sort((a, b) => b.val - a.val).slice(0, 5)
          .map(g => ({ name: g.key, amount: g.val })),
        topDeptsOut: Object.values(groupSum(outRows, r => r.dept, r => r.bud))
          .sort((a, b) => b.val - a.val).slice(0, 5)
          .map(g => ({ name: g.key, amount: g.val })),
        ...(FUND_INFO[k] || { icon: "📦", blurb: "", paidBy: "", flexibility: "" }),
      };
    })
    .filter(f => f.in > 0 || f.out > 0)
    .sort((a, b) => Math.max(b.in, b.out) - Math.max(a.in, a.out));

// ── Canonical DEPARTMENTS — revenue earned + operating spend ─────────────
const departments = DEPT_CATALOG.map(dc => {
    const inRows  = revRows.filter(r => dc.rev.includes(r.dept));
    const outRows = opRows.filter(r => dc.op.includes(r.dept));
    const earned  = sumBy(inRows, r => r.bud);
    const spend   = sumBy(outRows, r => r.bud);
    const subsidy = spend - earned;
    // Top revenue line items (with plain language)
    const topRev = Object.values(groupSum(inRows, r => r.src, r => r.bud))
      .sort((a, b) => b.val - a.val).slice(0, 5)
      .map(g => ({
        name: g.key, amount: g.val,
        pl: g.rows[0].pl, type: g.rows[0].type,
      }));
    // Top services within this department
    const topSvcs = Object.values(groupSum(outRows, r => r.svc, r => r.bud))
      .filter(g => g.key && g.key !== "NONE" && g.val > 0)
      .sort((a, b) => b.val - a.val).slice(0, 6)
      .map(g => ({ name: g.key, amount: g.val, og: g.rows[0].og }));
    // Object group breakdown of spending
    const ogBreakdown = Object.values(groupSum(outRows, r => r.og, r => r.bud))
      .filter(g => g.val !== 0)
      .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))
      .map(g => ({ name: g.key, amount: g.val }));
    // Fund mix
    const fundMix = Object.values(groupSum(
      [...inRows.map(r => ({ fund: r.fund, val: r.bud })),
       ...outRows.map(r => ({ fund: r.fund, val: r.bud }))],
      r => r.fund, r => r.val))
      .sort((a, b) => b.val - a.val)
      .map(g => ({ name: g.key, amount: g.val }));
    // Self-funded score: 1.0 = fully covers own costs; >1 = surplus; 0 = no revenue
    const funded = spend > 0 ? earned / spend : (earned > 0 ? Infinity : 0);
    return {
      ...dc, earned, spend, subsidy, funded,
      topRev, topSvcs, ogBreakdown, fundMix,
      hasData: earned > 0 || spend > 0,
    };
}).filter(d => d.hasData);

// ── Top revenue SOURCES (across all depts) ──────────────────────────────
const topSources = Object.values(groupSum(revRows, r => r.src, r => r.bud))
    .map(g => ({
      name: g.key, amount: g.val,
      actual: sumBy(g.rows, r => r.rev),
      type: g.rows[0].type,
      pl: g.rows[0].pl,
      fund: g.rows.reduce((m, r) => r.bud > m.bud ? r : m, g.rows[0]).fund,
      dept: g.rows.reduce((m, r) => r.bud > m.bud ? r : m, g.rows[0]).dept,
    }))
    .sort((a, b) => b.amount - a.amount);

// ── Top SERVICES across all depts ────────────────────────────────────────
const topServices = Object.values(groupSum(opRows, r => r.svc, r => r.bud))
    .filter(g => g.key && g.key !== "NONE" && g.val > 0)
    .map(g => ({
      name: g.key, amount: g.val,
      expended: sumBy(g.rows, r => r.exp),
      dept: g.rows[0].dept,
      og: g.rows[0].og,
      fund: g.rows[0].fund,
    }))
    .sort((a, b) => b.amount - a.amount);

// ── Glossary ────────────────────────────────────────────────────────────
const glossary = [
    { term: "Fiscal Year (FY)",
      def: "Dallas's budget year runs October 1 to September 30. FY 2026 means October 2025 through September 2026." },
    { term: "Revenue Budget",
      def: "The plan for what the city expects to collect — taxes, fees, water bills, grants, fines, and everything else. Sum total: $4.25B for FY26." },
    { term: "Operating Budget",
      def: "The plan for what the city expects to spend on day-to-day services. Sum total: $4.28B for FY26. Capital projects (buildings, big infrastructure) are budgeted separately." },
    { term: "Self-funded",
      def: "A department that brings in roughly as much revenue as it spends — Water Utilities, Aviation, Sanitation. Its operations don't rely on taxpayer subsidy." },
    { term: "Tax-funded",
      def: "A department that earns little direct revenue but spends a lot — Police, Fire, Library. Its operations are paid for by the General Fund (property + sales tax)." },
    { term: "Fund",
      def: "A pot of money the city keeps separately because of how it's allowed to be used. General Fund money is flexible; Enterprise Fund money usually has to stay with its source." },
    { term: "Revenue Type",
      def: "A broad category of where a dollar comes from — property tax, utility revenue, fees, grants, etc. There are 13 in the city's chart of accounts." },
    { term: "Object Group",
      def: "A broad category of what a dollar buys — personnel salaries, contractual services, supplies, debt payments, capital equipment. There are 9 main groups." },
    { term: "Service",
      def: "A specific program a department runs. Police Field Patrol, Wastewater Treatment Operations, Park Land Maintained, Police Academy — each is a service." },
    { term: "Property Tax Rate",
      def: "Set per $100 of appraised value. The FY 2026 rate is $0.7251 — about $2,175 a year on a $300,000 home." },
    { term: "Encumbered (ENCBFY)",
      def: "Money that's been promised to a contract or order but not yet paid out. Like a credit-card charge that hasn't posted yet." },
    { term: "Expended (EXPBFY)",
      def: "Money actually paid out so far this year." },
    { term: "Plain Language Translation",
      def: "Dallas's chart of accounts uses cryptic line names ('Chgs Serv-Tr Wat-Tot Rev Retai'). The Open Data team added plain-language descriptions for each, which we use throughout this app." },
    { term: "Enterprise",
      def: "A self-supporting government business — Water Utilities, Aviation, Sanitation. They earn their own revenue and don't depend on taxes." },
    { term: "Transfer / Interfund",
      def: "Money moving from one city fund to another. Counts as revenue in the receiving fund but isn't new outside money." },
];


    const payload = {
      fy: parseInt(FY, 10),
      population: POP,
      households: HOUSEHOLDS,
      revenueTotal: revTotal,
      revenueReceived: revActual,
      revenueTotalPrev: revTotalPrev,
      revenueYoY: revTotalPrev ? ((revTotal - revTotalPrev) / revTotalPrev) * 100 : 0,
      revenuePctReceived: revTotal ? (revActual / revTotal) * 100 : 0,
      operatingTotal: opTotal,
      operatingExpended: opExpended,
      operatingEncumbered: opEncumbered,
      operatingTotalPrev: opTotalPrev,
      operatingYoY: opTotalPrev ? ((opTotal - opTotalPrev) / opTotalPrev) * 100 : 0,
      operatingPctExpended: opTotal ? (opExpended / opTotal) * 100 : 0,
      revByType,
      opByOG,
      funds,
      departments,
      topSources,
      topServices,
      glossary,
      propertyTaxRate: opts?.propertyTaxRate ?? 0.7251,
      propertyTaxRatePrev: opts?.propertyTaxRatePrev ?? 0.7357,
      _source: opts?.source || "dallas-opendata-live",
      _fetchedAt: opts?.fetchedAt || null,
    };
    return payload;
}

export { revsourceLineLabel };

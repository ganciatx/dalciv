import Chart from "chart.js/auto";

const PAGE_SIZE = 50;
const VOTES_PAGE = 50;
let chartContrib = null;
let chartExpend = null;
let chartMonthly = null;
let chartCandidateMonthly = null;
let chartVoteYearly = null;
let chartVotingYearly = null;
let chartLobbyClients = null;
let lobbyOffset = 0;
let lobbyTotal = 0;
const LOBBY_PAGE = 40;
let tableOffset = 0;
let tableTotal = 0;
let tableRows = [];
let sortKey = "transaction_date";
let sortDir = -1;
let searchTimer = null;
let voteSearchTimer = null;
let votesOffset = 0;
let votesTotal = 0;
let votingViewMode = "member";
let agendaOffset = 0;
let agendaTotal = 0;
const AGENDA_PAGE = 50;
let selectedRollCallId = "";
let agendaSearchTimer = null;
let activeTab = "overview";
/** Tabs whose heavy API payloads have been loaded (Money transactions, Voting tables). */
const tabsLoaded = new Set(["overview"]);
let memberDirectory = [];
let selectedMemberId = "";

const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

const escapeHtml = (s) =>
  String(s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : d.toLocaleDateString();
}

function filterParams(refresh) {
  const p = new URLSearchParams();
  if (refresh) p.set("refresh", "true");
  const cand = document.getElementById("filter-candidate").value;
  const kind = document.getElementById("filter-kind").value;
  const rt = document.getElementById("filter-record-type").value;
  const q = document.getElementById("filter-q").value.trim();
  if (cand) p.set("candidate", cand);
  if (kind && kind !== "all") p.set("kind", kind);
  if (rt) p.set("record_type", rt);
  if (q) p.set("q", q);
  return p;
}

function setRefreshing(on) {
  document.getElementById("refresh-spin").hidden = !on;
}

function destroyCharts() {
  [chartContrib, chartExpend, chartMonthly].forEach((c) => c && c.destroy());
  chartContrib = chartExpend = chartMonthly = null;
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#94a3b8";
}

function renderBarChart(canvasId, items, labelKey, color) {
  const ctx = document.getElementById(canvasId);
  const labels = items.map((x) => x.candidate);
  const data = items.map((x) => x.total);
  const cfg = {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: labelKey,
        data,
        backgroundColor: color,
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => money(ctx.raw),
          },
        },
      },
      scales: {
        x: {
          ticks: {
            callback: (v) => "$" + (v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1e3 ? (v / 1e3).toFixed(0) + "k" : v),
          },
        },
      },
    },
  };
  if (canvasId === "chart-contrib") {
    if (chartContrib) chartContrib.destroy();
    chartContrib = new Chart(ctx, cfg);
  } else {
    if (chartExpend) chartExpend.destroy();
    chartExpend = new Chart(ctx, cfg);
  }
}

function renderMonthlyChart(series) {
  const ctx = document.getElementById("chart-monthly");
  const labels = series.map((x) => x.month);
  const cfg = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Contributions",
          data: series.map((x) => x.contributions),
          backgroundColor: cssVar("--good"),
          borderRadius: 3,
        },
        {
          label: "Expenditures",
          data: series.map((x) => x.expenditures),
          backgroundColor: cssVar("--warn"),
          borderRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${money(ctx.raw)}` },
        },
      },
      scales: {
        x: { stacked: false },
        y: {
          ticks: {
            callback: (v) => "$" + (v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1e3 ? (v / 1e3).toFixed(0) + "k" : v),
          },
        },
      },
    },
  };
  if (chartMonthly) chartMonthly.destroy();
  chartMonthly = new Chart(ctx, cfg);
}

function fillSelect(id, values, current) {
  const sel = document.getElementById(id);
  const first = sel.options[0].outerHTML;
  sel.innerHTML = first + values.map((v) =>
    `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`
  ).join("");
  if (values.includes(current)) sel.value = current;
}

function pct(share) {
  if (share == null || Number.isNaN(share)) return "—";
  return `${(share * 100).toFixed(1)}%`;
}

function pctRate(rate) {
  if (rate == null || Number.isNaN(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function voteParams(refresh) {
  const p = new URLSearchParams();
  if (refresh) p.set("refresh", "true");
  const mid = selectedMemberId || document.getElementById("filter-member").value;
  const from = document.getElementById("vote-from").value;
  const to = document.getElementById("vote-to").value;
  if (mid) p.set("member", mid);
  if (from) p.set("from_date", from);
  if (to) p.set("to_date", to);
  const q = document.getElementById("vote-q")?.value?.trim();
  if (q) p.set("q", q);
  const vote = document.getElementById("vote-filter")?.value;
  if (vote) p.set("vote", vote);
  return p;
}

function agendaDateParams() {
  const p = new URLSearchParams();
  const from = document.getElementById("vote-from").value;
  const to = document.getElementById("vote-to").value;
  if (from) p.set("from_date", from);
  if (to) p.set("to_date", to);
  const q = document.getElementById("agenda-q")?.value?.trim();
  if (q) p.set("q", q);
  return p;
}

function setVotingViewMode(mode) {
  votingViewMode = mode;
  document.querySelectorAll("[data-voting-view]").forEach((btn) => {
    btn.classList.toggle("on", btn.dataset.votingView === mode);
  });
  document.getElementById("voting-member-panel").hidden = mode !== "member";
  document.getElementById("voting-agenda-panel").hidden = mode !== "agenda";
  document.getElementById("voting-hint").hidden = mode !== "member";
  if (mode === "agenda") {
    agendaOffset = 0;
    selectedRollCallId = "";
    document.getElementById("agenda-detail").hidden = true;
    loadAgendaItems(false);
  } else {
    loadVotes(false);
  }
}

function renderAgendaItemsTable(items, total) {
  const body = document.getElementById("agenda-items-body");
  if (!items?.length) {
    body.innerHTML = `<tr><td colspan="7" style="color:var(--muted)">No agenda items match filters.</td></tr>`;
  } else {
    body.innerHTML = items.map((item) => {
      const t = item.tallies || {};
      const other = (t.abstain || 0) + (t.absent || 0) + (t.other || 0);
      const sel = item.roll_call_id === selectedRollCallId ? " selected" : "";
      return `<tr class="agenda-row${sel}" data-roll-call-id="${escapeHtml(item.roll_call_id)}">
        <td>${escapeHtml(formatDate(item.date))}</td>
        <td class="mono">${escapeHtml(item.agenda_item_number || item.agenda_id || "—")}</td>
        <td class="col-description">${escapeHtml(item.description_snippet || item.description || "—")}</td>
        <td>${t.yes ?? 0}</td>
        <td>${t.no ?? 0}</td>
        <td>${other}</td>
        <td>${escapeHtml(item.outcome_label || item.final_action_taken || "—")}</td>
      </tr>`;
    }).join("");
    body.querySelectorAll(".agenda-row").forEach((row) => {
      row.addEventListener("click", () => {
        selectedRollCallId = row.dataset.rollCallId;
        loadAgendaItemDetail(selectedRollCallId);
        body.querySelectorAll(".agenda-row").forEach((r) => {
          r.classList.toggle("selected", r.dataset.rollCallId === selectedRollCallId);
        });
      });
    });
  }
  agendaTotal = total;
  const start = agendaOffset + 1;
  const end = Math.min(agendaOffset + AGENDA_PAGE, total);
  document.getElementById("agenda-pager-info").textContent =
    total ? `Showing ${start}–${end} of ${total}` : "No rows";
  document.getElementById("agenda-prev").disabled = agendaOffset <= 0;
  document.getElementById("agenda-next").disabled = agendaOffset + AGENDA_PAGE >= total;
}

function renderAgendaDetail(body) {
  const panel = document.getElementById("agenda-detail");
  if (!body?.found) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  const itemLabel = body.agenda_item_number || body.agenda_id || "Item";
  document.getElementById("agenda-detail-title").textContent =
    `${formatDate(body.date)} · ${itemLabel}`;
  document.getElementById("agenda-detail-desc").textContent = body.description || "—";
  const t = body.tallies || {};
  document.getElementById("agenda-detail-tallies").innerHTML = `
    <span><strong>Yes</strong> ${t.yes ?? 0}</span>
    <span><strong>No</strong> ${t.no ?? 0}</span>
    <span><strong>Abstain</strong> ${t.abstain ?? 0}</span>
    <span><strong>Absent</strong> ${t.absent ?? 0}</span>
    <span><strong>Outcome</strong> ${escapeHtml(body.final_action_taken || body.outcome_label || "—")}</span>`;
  const members = body.members || [];
  const tbody = document.getElementById("agenda-detail-members");
  if (!members.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="color:var(--muted)">No member votes.</td></tr>`;
  } else {
    tbody.innerHTML = members.map((m) => `<tr>
      <td>${escapeHtml(m.member_name || "—")}</td>
      <td>${escapeHtml(m.district || "—")}</td>
      <td>${voteTagHtml(m.vote)}</td>
    </tr>`).join("");
  }
}

async function loadAgendaItems(refresh) {
  const p = agendaDateParams();
  if (refresh) p.set("refresh", "true");
  p.set("limit", String(AGENDA_PAGE));
  p.set("offset", String(agendaOffset));
  const res = await fetch(`/api/council-voting/agenda-items?${p}`);
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  renderAgendaItemsTable(body.items || [], body.meta?.total ?? 0);
}

async function loadAgendaItemDetail(rollCallId) {
  if (!rollCallId) return;
  const p = new URLSearchParams({ roll_call_id: rollCallId });
  const res = await fetch(`/api/council-voting/agenda-item?${p}`);
  if (!res.ok) throw new Error(await res.text());
  renderAgendaDetail(await res.json());
}

function fillVoteFilterOptions(options) {
  const sel = document.getElementById("vote-filter");
  if (!sel || !options?.length) return;
  const cur = sel.value;
  sel.innerHTML = options.map((o) =>
    `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`
  ).join("");
  if ([...sel.options].some((opt) => opt.value === cur)) sel.value = cur;
}

function setActiveTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.toggle("on", b.dataset.tab === tab);
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.toggle("on", p.id === `tab-${tab}`);
  });
  if (tab === "money" && !tabsLoaded.has("money")) {
    tabsLoaded.add("money");
    loadFinance(false);
  }
  if (tab === "voting" && !tabsLoaded.has("voting")) {
    tabsLoaded.add("voting");
    if (votingViewMode === "agenda") {
      loadAgendaItems(false);
    } else {
      loadVotes(false);
    }
  }
  if (tab === "lobbying" && !tabsLoaded.has("lobbying")) {
    tabsLoaded.add("lobbying");
    loadLobbyist(false);
  }
}

function renderOverlapCards(containerId, rows, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const compact = opts.compact === true;
  if (!rows?.length) {
    el.innerHTML = `<p class="hint" style="grid-column:1/-1">${escapeHtml(opts.empty || "No overlaps found.")}</p>`;
    return;
  }
  el.innerHTML = rows.map((r) => {
    const lobbyists = (r.lobbyists || []).slice(0, compact ? 1 : 2).join(", ");
    const cands = (r.candidates || []).slice(0, 3).join(", ");
    const contributed = r.campaign_contributed || 0;
    const received = r.campaign_received || 0;
    const memberAmt = r.campaign_amount;
    return `<article class="overlap-card">
      <div class="overlap-badges">
        <span class="overlap-badge lobby">Lobbies city</span>
        <span class="overlap-badge money">Campaign $</span>
      </div>
      <strong>${escapeHtml(r.entity)}</strong>
      <div class="overlap-meta">
        ${r.lobby_registrations ? `${r.lobby_registrations} registration(s)` : ""}
        ${lobbyists ? ` · via ${escapeHtml(lobbyists)}` : ""}
        ${memberAmt != null ? `<br/>To this member: ${money(memberAmt)} (${escapeHtml(r.campaign_kind || "")})` : ""}
        ${contributed || received ? `<br/>Campaign finance: ${contributed ? `gave ${money(contributed)}` : ""}${contributed && received ? " · " : ""}${received ? `received ${money(received)}` : ""}` : ""}
        ${cands && !compact ? `<br/>Candidates: ${escapeHtml(cands)}` : ""}
      </div>
    </article>`;
  }).join("");
}

function renderLobbyTeaser(summary) {
  const teaser = document.getElementById("lobby-teaser");
  const s = summary || {};
  const overlaps = s.influence_overlap || [];
  if (!s.registration_count) {
    teaser.hidden = true;
    return;
  }
  teaser.hidden = document.getElementById("combined-overview")?.hidden === false;
  document.getElementById("kpi-lobby-regs").textContent = s.registration_count ?? "—";
  const overlapN = s.overlap_count ?? overlaps.length;
  document.getElementById("kpi-lobby-overlap").textContent =
    overlapN == null ? "—" : overlapN;
  document.getElementById("lobby-teaser-meta").textContent =
    `${s.lobbyist_firm_count ?? "—"} lobbyist firms · ${s.client_count ?? "—"} clients`;
  renderOverlapCards("lobby-teaser-overlap", overlaps.slice(0, 4), {
    compact: true,
    empty: "No name matches between lobbying clients and campaign finance yet.",
  });
}

function renderLobbyTab(body) {
  const s = body.summary || {};
  document.getElementById("kpi-lobby-regs").textContent = s.registration_count ?? "—";
  document.getElementById("kpi-lobby-overlap").textContent = s.overlap_count ?? "—";
  const kpis = document.getElementById("lobby-kpis");
  kpis.innerHTML = `
    <div class="overview-kpi"><div class="label">Registrations</div><div class="value">${s.registration_count ?? "—"}</div></div>
    <div class="overview-kpi"><div class="label">Lobbyist firms</div><div class="value">${s.lobbyist_firm_count ?? "—"}</div></div>
    <div class="overview-kpi"><div class="label">Clients</div><div class="value">${s.client_count ?? "—"}</div></div>
    <div class="overview-kpi"><div class="label">New (30 days)</div><div class="value good">${s.registrations_last_30d ?? "—"}</div></div>`;
  renderOverlapCards("lobby-overlap-grid", s.influence_overlap || [], {
    empty: "No entities matched across both datasets.",
  });
  const clients = s.top_clients || [];
  const ctx = document.getElementById("chart-lobby-clients");
  if (chartLobbyClients) chartLobbyClients.destroy();
  if (clients.length && ctx) {
    chartLobbyClients = new Chart(ctx, {
      type: "bar",
      data: {
        labels: clients.map((c) => c.client),
        datasets: [{
          label: "Registrations",
          data: clients.map((c) => c.registrations),
          backgroundColor: cssVar("--accent"),
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    });
  }
  const tbody = document.getElementById("lobby-table-body");
  const rows = body.registrations || [];
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--muted)">No registrations.</td></tr>`;
  } else {
    tbody.innerHTML = rows.map((r) => `<tr>
      <td>${escapeHtml(formatDate(r.sworn_date))}</td>
      <td>${escapeHtml(r.lobbyist_name)}</td>
      <td>${escapeHtml(r.client_name)}</td>
      <td>${escapeHtml(r.report_description || "—")}</td>
      <td>${r.report_link ? `<a href="${escapeHtml(r.report_link)}" target="_blank" rel="noopener">PDF</a>` : "—"}</td>
    </tr>`).join("");
  }
  lobbyTotal = body.registrations_total ?? 0;
  const start = lobbyOffset + 1;
  const end = Math.min(lobbyOffset + LOBBY_PAGE, lobbyTotal);
  document.getElementById("lobby-pager-info").textContent =
    lobbyTotal ? `Showing ${start}–${end} of ${lobbyTotal}` : "No rows";
  document.getElementById("lobby-prev").disabled = lobbyOffset <= 0;
  document.getElementById("lobby-next").disabled = lobbyOffset + LOBBY_PAGE >= lobbyTotal;
}

function lobbyParams(refresh) {
  const p = new URLSearchParams();
  if (refresh) p.set("refresh", "true");
  const mid = selectedMemberId || document.getElementById("filter-member").value;
  if (mid) p.set("member", mid);
  const q = document.getElementById("lobby-q")?.value?.trim();
  if (q) p.set("q", q);
  p.set("limit", String(LOBBY_PAGE));
  p.set("offset", String(lobbyOffset));
  return p;
}

async function loadLobbyist(refresh) {
  const res = await fetch(`/api/lobbyist-registration/summary?${lobbyParams(refresh)}`);
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  renderLobbyTeaser(body.summary);
  if (activeTab === "lobbying" || tabsLoaded.has("lobbying")) {
    renderLobbyTab(body);
  }
  return body;
}

async function loadLobbyistSummaryOnly(refresh = false) {
  const p = new URLSearchParams();
  if (refresh) p.set("refresh", "true");
  p.set("lightweight", "true");
  p.set("limit", "1");
  p.set("offset", "0");
  const res = await fetch(`/api/lobbyist-registration/summary?${p}`);
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  renderLobbyTeaser(body.summary);
  return body;
}

function memberInitials(name) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function councilStatusHtml(m) {
  const active = m.council_status === "active";
  const cls = active ? "active" : "former";
  const label = active ? "Active Councilmember" : "Former Councilmember";
  return `<span class="council-status ${cls}">${label}</span>`;
}

/** @param opts - districtLink: when true, wrap photo in City Hall district URL (profile view only). */
function memberHeadshotHtml(m, sizeClass, opts = {}) {
  const cls = sizeClass ? ` ${sizeClass}` : "";
  const alt = escapeHtml(m.display_name || "Councilmember");
  const inner = m.headshot_url
    ? `<img class="member-headshot${cls}" src="${escapeHtml(m.headshot_url)}" alt="${alt}" loading="lazy" />`
    : `<div class="member-headshot placeholder${cls}" aria-hidden="true">${escapeHtml(memberInitials(m.display_name))}</div>`;
  if (opts.districtLink && m.district_page_url) {
    const distLabel = m.district_num || m.district || "";
    return `<a class="member-headshot-link" href="${escapeHtml(m.district_page_url)}" target="_blank" rel="noopener noreferrer" title="District ${escapeHtml(String(distLabel))} — Dallas City Hall">${inner}</a>`;
  }
  return inner;
}

function syncMemberToCandidate(memberId) {
  selectedMemberId = memberId || "";
  const entry = memberDirectory.find((m) => m.id === selectedMemberId);
  const cand = entry?.finance_candidate_name || "";
  document.getElementById("filter-member").value = selectedMemberId;
  document.getElementById("filter-candidate").value = cand;
}

function renderMemberDirectory(members) {
  memberDirectory = members || [];
  const sel = document.getElementById("filter-member");
  const cur = sel.value;
  const first = sel.options[0].outerHTML;
  sel.innerHTML = first + memberDirectory.map((m) => {
    const tags = [];
    if (m.has_finance) tags.push("$");
    if (m.has_voting) tags.push("vote");
    const label = tags.length ? `${m.display_name} (${tags.join(" · ")})` : m.display_name;
    return `<option value="${escapeHtml(m.id)}">${escapeHtml(label)}</option>`;
  }).join("");
  if (memberDirectory.some((m) => m.id === cur)) sel.value = cur;

  const wrap = document.getElementById("member-cards");
  const section = document.getElementById("member-index-section");
  if (!memberDirectory.length) {
    section.hidden = true;
    wrap.innerHTML = "";
    return;
  }
  section.hidden = selectedMemberId && document.getElementById("combined-overview")?.hidden === false;
  wrap.innerHTML = memberDirectory.map((m) => {
    const fs = m.finance_summary;
    const vs = m.voting_summary;
    const moneyLine = fs
      ? `Raised ${money(fs.total_raised)} · Spent ${money(fs.total_spent)}`
      : "No finance filings";
    const voteLine = vs
      ? `Yes ${pctRate(vs.yes_rate)} · ${vs.records || 0} votes`
      : "No voting data";
    const distNum = m.district_num || m.district;
    const dist = distNum ? `Dist ${escapeHtml(String(distNum))}` : "";
    const photo = memberHeadshotHtml(m, "");
    const activeCls = m.council_status === "active" ? " active-member" : "";
    return `<button type="button" class="candidate-card member-card${activeCls}" data-member="${escapeHtml(m.id)}">
      ${photo}
      <div class="member-card-body">
        ${councilStatusHtml(m)}
        <strong>${escapeHtml(m.display_name)}</strong>${dist ? `<span class="badge">${dist}</span>` : ""}
        <span class="line">${moneyLine}</span>
        <span class="line">${voteLine}</span>
      </div>
    </button>`;
  }).join("");
  wrap.querySelectorAll(".candidate-card").forEach((btn) => {
    btn.addEventListener("click", () => selectMember(btn.dataset.member));
  });
}

function selectMember(memberId) {
  syncMemberToCandidate(memberId);
  setActiveTab("overview");
  tableOffset = 0;
  votesOffset = 0;
  if (!memberId) {
    document.getElementById("combined-overview").hidden = true;
    document.getElementById("member-index-section").hidden = false;
    bootstrap(false, false);
    return;
  }
  bootstrap(false, false);
}

function voteTagHtml(vote) {
  const v = String(vote || "").toUpperCase();
  let cls = "other";
  if (v === "YES") cls = "yes";
  else if (v === "NO") cls = "no";
  else if (v === "ABST") cls = "abstain";
  else if (["ABSNT", "ABSNT_CB", "AWVT"].includes(v)) cls = "absent";
  return `<span class="vote-tag ${cls}">${escapeHtml(v || "—")}</span>`;
}

function renderVoteYearChart(canvasId, byYear) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const series = byYear || [];
  const cfg = {
    type: "bar",
    data: {
      labels: series.map((x) => x.year),
      datasets: [
        { label: "Yes", data: series.map((x) => x.yes), backgroundColor: cssVar("--good"), borderRadius: 3 },
        { label: "No", data: series.map((x) => x.no), backgroundColor: cssVar("--danger"), borderRadius: 3 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: { x: { stacked: true }, y: { stacked: true } },
    },
  };
  if (canvasId === "chart-vote-yearly") {
    if (chartVoteYearly) chartVoteYearly.destroy();
    chartVoteYearly = series.length ? new Chart(ctx, cfg) : null;
  } else {
    if (chartVotingYearly) chartVotingYearly.destroy();
    chartVotingYearly = series.length ? new Chart(ctx, cfg) : null;
  }
}

function renderVotingKpis(containerId, stats) {
  const el = document.getElementById(containerId);
  if (!el || !stats?.totals) {
    if (el) el.innerHTML = "";
    return;
  }
  const t = stats.totals;
  el.innerHTML = `
    <div class="overview-kpi"><div class="label">Yes</div><div class="value good">${t.yes}</div></div>
    <div class="overview-kpi"><div class="label">No</div><div class="value" style="color:var(--danger)">${t.no}</div></div>
    <div class="overview-kpi"><div class="label">Yes rate</div><div class="value">${pctRate(t.yes_rate)}</div></div>
    <div class="overview-kpi"><div class="label">Participation</div><div class="value">${pctRate(t.participation_rate)}</div></div>
    <div class="overview-kpi"><div class="label">Records</div><div class="value">${t.records}</div></div>`;
}

function renderRecentVotes(rows) {
  const body = document.getElementById("profile-recent-votes");
  if (!body) return;
  if (!rows?.length) {
    body.innerHTML = `<tr><td colspan="3" style="color:var(--muted)">No votes in range.</td></tr>`;
    return;
  }
  body.innerHTML = rows.map((r) => `<tr>
    <td>${escapeHtml(formatDate(r.date))}</td>
    <td>${voteTagHtml(r.vote)}</td>
    <td class="vote-desc">${escapeHtml(r.description || "—")}</td>
  </tr>`).join("");
}

function renderMemberProfile(body) {
  const panel = document.getElementById("combined-overview");
  const idx = document.getElementById("member-index-section");
  if (!body?.found) {
    panel.hidden = true;
    idx.hidden = false;
    return;
  }
  panel.hidden = false;
  idx.hidden = true;
  const m = body.member || {};
  document.getElementById("profile-name").textContent = m.display_name || m.id;
  const headSlot = document.getElementById("profile-headshot-slot");
  if (headSlot) headSlot.innerHTML = memberHeadshotHtml(m, "profile-size", { districtLink: true });
  const tags = [];
  tags.push(m.council_status === "active" ? "Active Councilmember" : "Former Councilmember");
  if (m.has_finance) tags.push("campaign finance");
  if (m.has_voting) tags.push("voting record");
  const distNum = m.district_num || m.district;
  if (distNum) tags.push(`district ${distNum}`);
  if (m.district_page_url) tags.push("photo → city hall district page");
  document.getElementById("profile-meta").innerHTML =
    `${councilStatusHtml(m)} <span class="hint" style="margin-left:0.35rem">${escapeHtml(tags.slice(1).join(" · ") || "")}</span>`;

  const fin = body.finance_overview;
  const vote = body.voting_stats;
  const pk = document.getElementById("profile-kpis");
  let kpiHtml = "";
  if (fin?.found) {
    const f = fin.financials || {};
    kpiHtml += `
      <div class="overview-kpi"><div class="label">Raised</div><div class="value good">${money(f.total_raised)}</div></div>
      <div class="overview-kpi"><div class="label">Spent</div><div class="value warn">${money(f.total_spent)}</div></div>
      <div class="overview-kpi"><div class="label">Net</div><div class="value">${money(f.net_cash)}</div></div>`;
  }
  if (vote?.totals) {
    kpiHtml += `
      <div class="overview-kpi"><div class="label">Yes rate</div><div class="value">${pctRate(vote.totals.yes_rate)}</div></div>
      <div class="overview-kpi"><div class="label">Participation</div><div class="value">${pctRate(vote.totals.participation_rate)}</div></div>`;
  }
  pk.innerHTML = kpiHtml;

  const vBlock = document.getElementById("profile-voting-block");
  if (vote?.found !== false && vote?.totals) {
    vBlock.hidden = false;
    renderVotingKpis("vote-stats-kpis", vote);
    renderVoteYearChart("chart-vote-yearly", vote.by_year || []);
    renderRecentVotes(body.recent_votes || []);
  } else {
    vBlock.hidden = true;
  }

  const wrap = document.getElementById("profile-finance-wrap");
  if (fin?.found) {
    const f = fin.fiscal_responsibility || {};
    wrap.innerHTML = `
      <h3 style="margin:.75rem 0 .35rem;font-size:.85rem">Campaign finance</h3>
      <div class="fiscal-card ${escapeHtml(f.status || "")}">
        <div class="fiscal-label">${escapeHtml(f.label || "—")}</div>
        <p>${escapeHtml(f.summary || "")}</p>
      </div>
      <p class="hint">Major donors, vendors, and charts are on the <strong>Money</strong> tab.</p>`;
    wrap.innerHTML = wrap.innerHTML.replace(/<div /g, "<div ");
  } else {
    wrap.innerHTML = `<p class="hint">No campaign finance filings linked to this member.</p>`;
  }

  const lobbyBlock = document.getElementById("profile-lobby-block");
  const overlaps = body.lobbyist_overlap || [];
  if (overlaps.length) {
    lobbyBlock.hidden = false;
    renderOverlapCards("profile-lobby-overlap", overlaps, {
      compact: true,
      empty: "No lobbying overlap for this member.",
    });
  } else {
    lobbyBlock.hidden = true;
  }
}

async function loadDirectory(refreshFinance, refreshVoting) {
  const p = new URLSearchParams();
  if (refreshFinance) p.set("refresh_finance", "true");
  if (refreshVoting) p.set("refresh_voting", "true");
  const res = await fetch(`/api/council-accountability/directory?${p}`);
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  renderMemberDirectory(body.members || []);
  const dr = (body.meta || {}).date_range_defaults || {};
  if (!document.getElementById("vote-from").value && dr.from) {
    document.getElementById("vote-from").value = dr.from.slice(0, 10);
  }
  if (!document.getElementById("vote-to").value && dr.to) {
    document.getElementById("vote-to").value = dr.to.slice(0, 10);
  }
  return body;
}

async function loadVotingSummary(refresh) {
  const p = voteParams(refresh);
  p.delete("vote");
  p.set("lightweight", "true");
  const res = await fetch(`/api/council-voting/summary?${p}`);
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  applyVotingOverview(body);
  return body;
}

async function loadMemberProfile(refresh) {
  const mid = selectedMemberId || document.getElementById("filter-member").value;
  if (!mid) {
    document.getElementById("combined-overview").hidden = true;
    document.getElementById("member-index-section").hidden = false;
    return;
  }
  const p = voteParams(false);
  if (refresh) {
    p.set("refresh_finance", "true");
    p.set("refresh_voting", "true");
  }
  const rt = document.getElementById("filter-record-type").value;
  const q = document.getElementById("filter-q").value.trim();
  if (rt) p.set("record_type", rt);
  if (q) p.set("q", q);
  const res = await fetch(`/api/council-accountability/member?${p}`);
  if (!res.ok) throw new Error(await res.text());
  renderMemberProfile(await res.json());
}

function renderVotesTable(rows, total) {
  const body = document.getElementById("votes-body");
  if (!rows?.length) {
    body.innerHTML = `<tr><td colspan="5" style="color:var(--muted)">No votes match filters.</td></tr>`;
  } else {
    body.innerHTML = rows.map((r) => `<tr>
      <td>${escapeHtml(formatDate(r.date))}</td>
      <td>${voteTagHtml(r.vote)}</td>
      <td>${escapeHtml(r.district || "—")}</td>
      <td class="col-description">${escapeHtml(r.description || "—")}</td>
      <td>${escapeHtml(r.final_action_taken || "—")}</td>
    </tr>`).join("");
  }
  votesTotal = total;
  const start = votesOffset + 1;
  const end = Math.min(votesOffset + VOTES_PAGE, total);
  document.getElementById("votes-pager-info").textContent =
    total ? `Showing ${start}–${end} of ${total}` : "No rows";
  document.getElementById("votes-prev").disabled = votesOffset <= 0;
  document.getElementById("votes-next").disabled = votesOffset + VOTES_PAGE >= total;
}

async function loadVotes(refresh) {
  const p = voteParams(refresh);
  p.set("limit", String(VOTES_PAGE));
  p.set("offset", String(votesOffset));
  const res = await fetch(`/api/council-voting/votes?${p}`);
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  fillVoteFilterOptions(body.vote_filter_options);
  renderVotesTable(body.votes || [], body.meta?.total ?? 0);
  const mid = selectedMemberId || document.getElementById("filter-member").value;
  if (mid) {
    const prof = await fetch(`/api/council-accountability/member?${voteParams(false)}`);
    if (prof.ok) {
      const pb = await prof.json();
      renderVotingKpis("voting-member-kpis", pb.voting_stats);
      renderVoteYearChart("chart-voting-yearly", pb.voting_stats?.by_year || []);
    }
  } else {
    renderVotingKpis("voting-member-kpis", null);
  }
}

function renderCounterpartyTable(tbodyId, rows, emptyMsg) {
  const body = document.getElementById(tbodyId);
  if (!rows?.length) {
    body.innerHTML = `<tr><td colspan="3" style="color:var(--muted)">${emptyMsg}</td></tr>`;
    return;
  }
  body.innerHTML = rows.map((r) => `<tr>
    <td>${escapeHtml(r.name)}</td>
    <td class="amt">${money(r.total)}</td>
    <td class="amt">${pct(r.share)}</td>
  </tr>`).join("");
}

function renderCandidateIndex(index) {
  const section = document.getElementById("candidate-index-section");
  const wrap = document.getElementById("candidate-cards");
  if (!index?.length) {
    section.hidden = true;
    wrap.innerHTML = "";
    return;
  }
  section.hidden = false;
  wrap.innerHTML = index.map((c) => `
    <button type="button" class="candidate-card" data-candidate="${escapeHtml(c.candidate)}">
      <strong>${escapeHtml(c.candidate)}</strong>
      <span class="line">Raised ${money(c.total_raised)} · Spent ${money(c.total_spent)}</span>
      <span class="line">Net ${money(c.net_cash)}</span>
    </button>`).join("");
  wrap.querySelectorAll(".candidate-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("filter-candidate").value = btn.dataset.candidate;
      onFilterChange();
    });
  });
}

function renderCandidateMonthly(series) {
  const ctx = document.getElementById("chart-candidate-monthly");
  const labels = (series || []).map((x) => x.month);
  const cfg = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Raised",
          data: (series || []).map((x) => x.contributions),
          backgroundColor: cssVar("--good"),
          borderRadius: 3,
        },
        {
          label: "Spent",
          data: (series || []).map((x) => x.expenditures),
          backgroundColor: cssVar("--warn"),
          borderRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${money(ctx.raw)}` },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (v) => "$" + (v >= 1e3 ? (v / 1e3).toFixed(0) + "k" : v),
          },
        },
      },
    },
  };
  if (chartCandidateMonthly) chartCandidateMonthly.destroy();
  chartCandidateMonthly = labels.length ? new Chart(ctx, cfg) : null;
}

function renderCandidateOverview(ov) {
  const panel = document.getElementById("candidate-overview");
  const idxSection = document.getElementById("candidate-index-section");
  if (!ov?.found) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  idxSection.hidden = true;

  document.getElementById("ov-candidate-name").textContent = ov.candidate;
  const fin = ov.financials || {};
  const rts = fin.record_types || [];
  document.getElementById("ov-meta").textContent = [
    fin.latest_transaction_date
      ? `Latest activity ${formatDate(fin.latest_transaction_date)}` : null,
    rts.length ? `Filing periods: ${rts.slice(0, 3).join("; ")}${rts.length > 3 ? "…" : ""}` : null,
    `${fin.contribution_count || 0} contributions · ${fin.expenditure_count || 0} expenditures`,
  ].filter(Boolean).join(" · ");

  const f = ov.fiscal_responsibility || {};
  const fiscalEl = document.getElementById("ov-fiscal");
  fiscalEl.className = `fiscal-card ${escapeHtml(f.status || "")}`;
  document.getElementById("ov-fiscal-label").textContent = f.label || "—";
  document.getElementById("ov-fiscal-summary").textContent = f.summary || "";
  const flags = f.flags || [];
  document.getElementById("ov-fiscal-flags").innerHTML = flags.length
    ? flags.map((x) => `<li>${escapeHtml(x)}</li>`).join("")
    : "";

  const burn = f.burn_rate != null ? pct(Math.min(f.burn_rate, 9.99)) : "—";
  const reserve = f.reserve_pct != null ? pct(f.reserve_pct) : "—";
  document.getElementById("ov-kpis").innerHTML = `
    <div class="overview-kpi"><div class="label">Raised</div><div class="value good">${money(fin.total_raised)}</div></div>
    <div class="overview-kpi"><div class="label">Spent</div><div class="value warn">${money(fin.total_spent)}</div></div>
    <div class="overview-kpi"><div class="label">Net cash</div><div class="value">${money(fin.net_cash)}</div></div>
    <div class="overview-kpi"><div class="label">Burn rate</div><div class="value">${burn}</div></div>
    <div class="overview-kpi"><div class="label">Reserve</div><div class="value">${reserve}</div></div>
  `;

  renderCounterpartyTable("ov-donors", ov.major_donors, "No contributions reported.");
  renderCounterpartyTable("ov-expend", ov.major_expenditures, "No expenditures reported.");
  renderCandidateMonthly(ov.monthly || []);

  const ow = document.getElementById("ov-watch");
  const flags2 = ov.watch_list || [];
  if (!flags2.length) {
    ow.innerHTML = "<p class=\"hint\" style=\"margin:0\">No flags for this candidate in the current filter.</p>";
  } else {
    ow.innerHTML = flags2.map((s) => {
      const sev = escapeHtml(s.severity || "low");
      return `<div class="watch-card ${sev}">
        <strong>${escapeHtml(s.title)}</strong>
        ${escapeHtml(s.detail || "")}
      </div>`;
    }).join("");
  }
}

function formatSupportList(candidates) {
  return (candidates || [])
    .map((c) => `${escapeHtml(c.candidate)} (${money(c.total)})`)
    .join(" · ");
}

function renderInsights(insights) {
  if (!insights) return;

  const wl = document.getElementById("watch-list");
  const flags = insights.watch_list || [];
  if (!flags.length) {
    wl.innerHTML = "<p class=\"hint\" style=\"margin:0\">No flags in the current filter set.</p>";
  } else {
    wl.innerHTML = flags.map((s) => {
      const sev = escapeHtml(s.severity || "low");
      let chips = "";
      if (s.candidates?.length) {
        chips = `<div class="chips">${formatSupportList(s.candidates)}</div>`;
      } else if (s.gave_to?.length || s.paid_by?.length) {
        const gave = s.gave_to?.length ? `Gave to: ${formatSupportList(s.gave_to)}` : "";
        const paid = s.paid_by?.length ? `Paid by: ${formatSupportList(s.paid_by)}` : "";
        chips = `<div class="chips">${gave}${gave && paid ? " | " : ""}${paid}</div>`;
      }
      return `<div class="watch-card ${sev}">
        <strong>${escapeHtml(s.title)}</strong>
        ${escapeHtml(s.detail || "")}
        ${chips}
      </div>`;
    }).join("");
  }

  const spend = insights.spending_breakdown || [];
  document.getElementById("spending-body").innerHTML = spend.length
    ? spend.map((r) => `<tr>
        <td>${escapeHtml(r.candidate)}</td>
        <td>${escapeHtml(r.vendor)}</td>
        <td class="amt">${money(r.total)}</td>
      </tr>`).join("")
    : `<tr><td colspan="3" style="color:var(--muted)">No expenditures in filter.</td></tr>`;

  const donors = insights.donor_bankroll || [];
  document.getElementById("donors-body").innerHTML = donors.length
    ? donors.map((r) => `<tr>
        <td>${escapeHtml(r.donor)}</td>
        <td class="amt">${money(r.total)}</td>
        <td>${formatSupportList(r.candidates)}</td>
      </tr>`).join("")
    : `<tr><td colspan="3" style="color:var(--muted)">No contributions in filter.</td></tr>`;

  const vendors = insights.top_vendors || [];
  const vw = document.getElementById("vendors-wrap");
  if (!vendors.length) {
    vw.innerHTML = "<p class=\"hint\" style=\"margin:0\">No vendor data.</p>";
  } else {
    vw.innerHTML = `<table class="mini-table"><thead><tr>
      <th>Vendor</th><th class="amt">Total received</th><th>Paid by candidates</th>
    </tr></thead><tbody>${vendors.map((v) => `<tr>
      <td>${escapeHtml(v.vendor)}</td>
      <td class="amt">${money(v.total)}</td>
      <td>${formatSupportList(v.candidates)}</td>
    </tr>`).join("")}</tbody></table>`;
  }
}

function applyFinanceKpis(body) {
  const meta = body.meta || {};
  const kpis = body.kpis || {};
  document.getElementById("kpi-raised").textContent = money(kpis.total_contributions);
  document.getElementById("kpi-spent").textContent = money(kpis.total_expenditures);
  document.getElementById("kpi-txns").textContent =
    (kpis.contribution_transactions || 0) + (kpis.expenditure_transactions || 0);
  document.getElementById("kpi-candidates").textContent = kpis.unique_candidates ?? "—";
  const sub = [
    `${meta.filtered_count ?? 0} rows match filters (${meta.row_count ?? 0} total)`,
    meta.fetched_at ? `cached ${new Date(meta.fetched_at).toLocaleString()}` : null,
  ].filter(Boolean).join(" • ");
  document.getElementById("header-sub").textContent = sub;
}

function applySummary(body) {
  applyFinanceKpis(body);
  if (body.meta?.lightweight) return;

  const charts = body.charts || {};
  renderBarChart("chart-contrib", charts.top_contributions || [], "Contributions", cssVar("--good"));
  renderBarChart("chart-expend", charts.top_expenditures || [], "Expenditures", cssVar("--warn"));
  renderMonthlyChart(charts.by_month || []);

  const opts = body.options || {};
  const candNow = document.getElementById("filter-candidate").value;
  const rtNow = document.getElementById("filter-record-type").value;
  fillSelect("filter-candidate", opts.candidates || [], candNow);
  fillSelect("filter-record-type", opts.record_types || [], rtNow);

  renderInsights(body.insights);

  const cand = document.getElementById("filter-candidate").value;
  if (cand && body.candidate_overview?.found) {
    renderCandidateOverview(body.candidate_overview);
  } else {
    document.getElementById("candidate-overview").hidden = true;
    renderCandidateIndex(body.candidate_index || []);
  }
}

function applyVotingOverview(body) {
  fillVoteFilterOptions(body.vote_filter_options);
  const g = body.global_kpis || {};
  document.getElementById("kpi-vote-records").textContent = g.total_records ?? "—";
  document.getElementById("kpi-yes-rate").textContent = pctRate(g.yes_rate);
  const dr = body.date_range_defaults || {};
  if (!document.getElementById("vote-from").value && dr.from) {
    document.getElementById("vote-from").value = dr.from.slice(0, 10);
  }
  if (!document.getElementById("vote-to").value && dr.to) {
    document.getElementById("vote-to").value = dr.to.slice(0, 10);
  }
}

async function loadBootstrap(refreshFinance, refreshVoting) {
  const p = new URLSearchParams();
  if (refreshFinance) p.set("refresh_finance", "true");
  if (refreshVoting) p.set("refresh_voting", "true");
  const res = await fetch(`/api/council-accountability/bootstrap?${p}`);
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  const dir = body.directory || {};
  renderMemberDirectory(dir.members || []);
  const dr = (dir.meta || {}).date_range_defaults || {};
  if (!document.getElementById("vote-from").value && dr.from) {
    document.getElementById("vote-from").value = dr.from.slice(0, 10);
  }
  if (!document.getElementById("vote-to").value && dr.to) {
    document.getElementById("vote-to").value = dr.to.slice(0, 10);
  }
  applyVotingOverview(body.voting || {});
  applyFinanceKpis(body.finance || {});
  const lobby = body.lobbyist || {};
  renderLobbyTeaser(lobby.summary || {});
  return body;
}

function sortRows(rows) {
  const key = sortKey;
  const dir = sortDir;
  return [...rows].sort((a, b) => {
    let av = a[key];
    let bv = b[key];
    if (key === "amount_num") {
      av = av ?? -1;
      bv = bv ?? -1;
    } else {
      av = String(av || "").toLowerCase();
      bv = String(bv || "").toLowerCase();
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

function renderTable(rows, total) {
  tableRows = sortRows(rows);
  const body = document.getElementById("tx-body");
  if (!tableRows.length) {
    body.innerHTML = `<tr><td colspan="7" style="color:var(--muted)">No transactions match filters.</td></tr>`;
  } else {
    body.innerHTML = tableRows.map((r) => `
      <tr>
        <td>${escapeHtml(formatDate(r.transaction_date))}</td>
        <td>${escapeHtml(r.candidate_name)}</td>
        <td>${escapeHtml(r.counterparty_name || r.payee_name)}</td>
        <td><span class="kind-tag ${escapeHtml(r.kind)}">${escapeHtml(r.kind)}</span></td>
        <td>${escapeHtml(r.schedule_type)}</td>
        <td class="amt">${r.amount_num != null ? money(r.amount_num) : escapeHtml(r.amount || "—")}</td>
        <td>${r.file_url ? `<a href="${escapeHtml(r.file_url)}" target="_blank" rel="noopener">PDF</a>` : "—"}</td>
      </tr>`).join("");
  }
  document.getElementById("table-count").textContent = `(${total} total)`;
  const start = tableOffset + 1;
  const end = Math.min(tableOffset + PAGE_SIZE, total);
  document.getElementById("pager-info").textContent =
    total ? `Showing ${start}–${end} of ${total}` : "No rows";
  document.getElementById("btn-prev").disabled = tableOffset <= 0;
  document.getElementById("btn-next").disabled = tableOffset + PAGE_SIZE >= total;
}

async function loadTransactions(refresh) {
  const p = filterParams(refresh);
  p.set("limit", String(PAGE_SIZE));
  p.set("offset", String(tableOffset));
  const res = await fetch(`/api/campaign-finance/transactions?${p}`);
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  tableTotal = body.meta?.total ?? 0;
  renderTable(body.transactions || [], tableTotal);
}

async function loadFinanceSummaryOnly(refresh = false, lightweight = false) {
  const p = filterParams(refresh);
  if (lightweight) p.set("lightweight", "true");
  const res = await fetch(`/api/campaign-finance/summary?${p}`);
  if (!res.ok) throw new Error(await res.text());
  applySummary(await res.json());
}

async function loadFinance(refresh = false) {
  await loadFinanceSummaryOnly(refresh);
  tabsLoaded.add("money");
  await loadTransactions(refresh);
}

async function bootstrap(refreshFinance = false, refreshVoting = false) {
  setRefreshing(true);
  document.getElementById("refresh-text").textContent = refreshFinance || refreshVoting
    ? "Fetching from Socrata…" : "Updating…";
  try {
    tabsLoaded.clear();
    tabsLoaded.add("overview");
    await loadBootstrap(refreshFinance, refreshVoting);
    if (selectedMemberId || document.getElementById("filter-member").value) {
      await loadMemberProfile(refreshFinance || refreshVoting);
    }
    if (activeTab === "money") {
      tabsLoaded.add("money");
      await loadTransactions(refreshFinance);
    }
    if (activeTab === "voting") {
      tabsLoaded.add("voting");
      if (votingViewMode === "agenda") {
        await loadAgendaItems(refreshVoting);
      } else {
        await loadVotes(false);
      }
    }
    if (activeTab === "lobbying") {
      tabsLoaded.add("lobbying");
      await loadLobbyist(refreshFinance || refreshVoting);
    }
    document.getElementById("refresh-text").textContent =
      `Updated ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    console.error(err);
    document.getElementById("refresh-text").textContent = "Update failed";
    document.getElementById("header-sub").textContent = String(err);
  } finally {
    setRefreshing(false);
  }
}

function onFilterChange() {
  tableOffset = 0;
  votesOffset = 0;
  const mid = document.getElementById("filter-member").value;
  if (mid) selectedMemberId = mid;
  const entry = memberDirectory.find((m) => m.id === selectedMemberId);
  if (entry?.finance_candidate_name) {
    document.getElementById("filter-candidate").value = entry.finance_candidate_name;
  }
  bootstrap(false, false);
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
});

document.getElementById("filter-member").addEventListener("change", () => {
  selectMember(document.getElementById("filter-member").value);
});

document.getElementById("filter-candidate").addEventListener("change", onFilterChange);
document.getElementById("filter-kind").addEventListener("change", onFilterChange);
document.getElementById("filter-record-type").addEventListener("change", onFilterChange);
document.getElementById("filter-q").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(onFilterChange, 350);
});

document.getElementById("vote-from").addEventListener("change", () => {
  votesOffset = 0;
  agendaOffset = 0;
  loadVotingSummary(false);
  if (votingViewMode === "agenda") {
    loadAgendaItems(false);
  } else {
    loadVotes(false);
    loadMemberProfile(false);
  }
});
document.getElementById("vote-to").addEventListener("change", () => {
  votesOffset = 0;
  agendaOffset = 0;
  loadVotingSummary(false);
  if (votingViewMode === "agenda") {
    loadAgendaItems(false);
  } else {
    loadVotes(false);
    loadMemberProfile(false);
  }
});
document.getElementById("vote-q").addEventListener("input", () => {
  clearTimeout(voteSearchTimer);
  voteSearchTimer = setTimeout(() => {
    votesOffset = 0;
    loadVotes(false);
  }, 350);
});
document.getElementById("vote-filter").addEventListener("change", () => {
  votesOffset = 0;
  loadVotes(false);
});

document.getElementById("btn-refresh-finance").addEventListener("click", () => bootstrap(true, false));
document.getElementById("btn-refresh-voting").addEventListener("click", () => bootstrap(false, true));
document.getElementById("btn-refresh-lobbyist").addEventListener("click", async () => {
  setRefreshing(true);
  try {
    await loadLobbyist(true);
    document.getElementById("refresh-text").textContent =
      `Updated ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    console.error(err);
    document.getElementById("header-sub").textContent = String(err);
  } finally {
    setRefreshing(false);
  }
});
document.getElementById("btn-open-lobby-tab")?.addEventListener("click", () => setActiveTab("lobbying"));
document.getElementById("btn-lobby-search")?.addEventListener("click", () => {
  lobbyOffset = 0;
  loadLobbyist(false);
});
document.getElementById("lobby-q")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    lobbyOffset = 0;
    loadLobbyist(false);
  }
});
document.getElementById("lobby-prev")?.addEventListener("click", () => {
  lobbyOffset = Math.max(0, lobbyOffset - LOBBY_PAGE);
  loadLobbyist(false);
});
document.getElementById("lobby-next")?.addEventListener("click", () => {
  lobbyOffset += LOBBY_PAGE;
  loadLobbyist(false);
});
document.getElementById("btn-prev").addEventListener("click", () => {
  tableOffset = Math.max(0, tableOffset - PAGE_SIZE);
  loadTransactions(false);
});
document.getElementById("btn-next").addEventListener("click", () => {
  if (tableOffset + PAGE_SIZE < tableTotal) {
    tableOffset += PAGE_SIZE;
    loadTransactions(false);
  }
});

document.querySelectorAll("th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (sortKey === key) sortDir *= -1;
    else {
      sortKey = key;
      sortDir = key === "amount_num" ? -1 : 1;
    }
    renderTable(tableRows, tableTotal);
  });
});

document.getElementById("votes-prev").addEventListener("click", () => {
  votesOffset = Math.max(0, votesOffset - VOTES_PAGE);
  loadVotes(false);
});
document.getElementById("votes-next").addEventListener("click", () => {
  if (votesOffset + VOTES_PAGE < votesTotal) {
    votesOffset += VOTES_PAGE;
    loadVotes(false);
  }
});

document.getElementById("btn-vote-view-member").addEventListener("click", () => {
  setVotingViewMode("member");
});
document.getElementById("btn-vote-view-agenda").addEventListener("click", () => {
  setVotingViewMode("agenda");
});
document.getElementById("agenda-q").addEventListener("input", () => {
  clearTimeout(agendaSearchTimer);
  agendaSearchTimer = setTimeout(() => {
    agendaOffset = 0;
    selectedRollCallId = "";
    document.getElementById("agenda-detail").hidden = true;
    loadAgendaItems(false);
  }, 350);
});
document.getElementById("agenda-prev").addEventListener("click", () => {
  agendaOffset = Math.max(0, agendaOffset - AGENDA_PAGE);
  loadAgendaItems(false);
});
document.getElementById("agenda-next").addEventListener("click", () => {
  if (agendaOffset + AGENDA_PAGE < agendaTotal) {
    agendaOffset += AGENDA_PAGE;
    loadAgendaItems(false);
  }
});

bootstrap(false, false);

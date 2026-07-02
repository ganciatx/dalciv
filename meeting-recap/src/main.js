const DEFAULT_DATE = "2026-06-24";
const DEFAULT_BODY = "City Council";

const root = document.getElementById("root");

const escapeHtml = (s) =>
  String(s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || res.statusText || "Request failed");
  }
  return data;
}

function voteChips(vote) {
  if (!vote) return "";
  const chips = [];
  if (vote.favor_count != null) {
    chips.push(
      `<span class="mr-vote-chip yes">${vote.favor_count} in favor</span>`
    );
  }
  if (vote.oppose_count) {
    chips.push(
      `<span class="mr-vote-chip no">${vote.oppose_count} opposed</span>`
    );
  }
  if (vote.yes?.length) {
    chips.push(
      `<span class="mr-vote-chip yes">Yes: ${escapeHtml(vote.yes.join(", "))}</span>`
    );
  }
  if (vote.no?.length) {
    chips.push(
      `<span class="mr-vote-chip no">No: ${escapeHtml(vote.no.join(", "))}</span>`
    );
  }
  return chips.length ? `<div class="mr-vote">${chips.join("")}</div>` : "";
}

function renderItem(item) {
  const bullets = (item.bullets || [])
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join("");
  const speakerNote = item.public_speaker_count
    ? `<p class="mr-speakers">${item.public_speaker_count} residents signed up to speak on this item.</p>`
    : "";

  return `
    <article class="mr-item-card">
      <div class="mr-item-head">
        <span class="mr-item-num">Item ${escapeHtml(item.item_number)}</span>
        <span class="mr-item-num">${escapeHtml(item.matter_id || "")}</span>
      </div>
      <h3 class="mr-item-title">${escapeHtml(item.title)}</h3>
      <p class="mr-item-summary">${escapeHtml(item.summary)}</p>
      ${bullets ? `<ul class="mr-bullets">${bullets}</ul>` : ""}
      ${voteChips(item.vote)}
      ${speakerNote}
    </article>
  `;
}

function renderRecap(recap) {
  const duration = recap.duration || {};
  const highlights = (recap.highlights || [])
    .map((h) => `<li>${escapeHtml(h)}</li>`)
    .join("");
  const attendees = (recap.attendees || [])
    .map((name) => `<span class="mr-pill">${escapeHtml(name)}</span>`)
    .join("");
  const pulls = (recap.consent_pulls || [])
    .slice(0, 12)
    .map(
      (p) =>
        `<div>Item ${escapeHtml(p.item_number)} pulled by ${escapeHtml(p.pulled_by)}</div>`
    )
    .join("");
  const items = (recap.featured_items || []).map(renderItem).join("");

  return `
    <section class="mr-meta-grid">
      <div class="mr-meta-card"><span>Duration</span><strong>${duration.hours ? `${duration.hours}h` : "—"}</strong></div>
      <div class="mr-meta-card"><span>Start</span><strong>${escapeHtml(recap.start_time || duration.start || "—")}</strong></div>
      <div class="mr-meta-card"><span>Agenda items parsed</span><strong>${recap.agenda_item_count ?? "—"}</strong></div>
      <div class="mr-meta-card"><span>Record votes</span><strong>${recap.record_vote_count ?? "—"}</strong></div>
    </section>

    ${
      highlights
        ? `<section class="mr-section"><h2>Worth knowing</h2><ul class="mr-highlights">${highlights}</ul></section>`
        : ""
    }

    <section class="mr-section">
      <h2>Who was there</h2>
      <div class="mr-attendees">${attendees || "<span class='mr-pill'>Attendance not parsed</span>"}</div>
    </section>

    ${
      pulls
        ? `<section class="mr-section"><h2>Consent agenda changes</h2><div class="mr-pulls">${pulls}${
            recap.consent_pulls.length > 12
              ? `<div>…and ${recap.consent_pulls.length - 12} more pulls</div>`
              : ""
          }</div></section>`
        : ""
    }

    <section class="mr-section">
      <h2>Key agenda items</h2>
      ${items || "<p>No featured items summarized yet.</p>"}
    </section>

    <p class="mr-footer-note">
      Summaries are generated from the official meeting transcript.
      Method: <strong>${escapeHtml(recap.summary_method || "extractive")}</strong>.
      Set <code>ANTHROPIC_API_KEY</code> on the server for Claude summaries
      (or <code>OPENAI_API_KEY</code> as fallback).
      Cross-check votes on <a href="/council-accountability">Council Watch</a>.
    </p>
  `;
}

function renderShell({ meetings, recap, status, error, loading, date, body }) {
  const meetingOptions = (meetings || [])
    .map((m) => {
      const selected = m.date === date && m.body === body ? "selected" : "";
      return `<option value="${escapeHtml(m.date)}|${escapeHtml(m.body)}" ${selected}>${formatDate(m.date)} — ${escapeHtml(m.body)}</option>`;
    })
    .join("");

  root.innerHTML = `
    <div class="mr-app">
      <header class="mr-hero">
        <p class="mr-kicker">Dallas civic briefing</p>
        <h1>Meeting Recap</h1>
        <p class="mr-lede">What happened at City Council — who showed up, what was debated, and how members voted — without sitting through the full video.</p>
      </header>

      <div class="mr-toolbar">
        <div class="mr-field">
          <label for="meeting-select">Meeting</label>
          <select id="meeting-select">${meetingOptions || `<option value="${DEFAULT_DATE}|${DEFAULT_BODY}">${formatDate(DEFAULT_DATE)}</option>`}</select>
        </div>
        <button type="button" class="mr-btn" id="btn-load" ${loading ? "disabled" : ""}>Load recap</button>
        <button type="button" class="mr-btn mr-btn-ghost" id="btn-refresh" ${loading ? "disabled" : ""}>Regenerate</button>
      </div>

      ${error ? `<div class="mr-error">${escapeHtml(error)}</div>` : ""}
      ${status?.running ? `<div class="mr-status">Analyzing transcript… ${status.done || 0}/${status.total || "—"}</div>` : ""}
      ${loading ? `<div class="mr-status">Loading…</div>` : ""}
      ${recap ? renderRecap(recap) : ""}
    </div>
  `;

  document.getElementById("btn-load")?.addEventListener("click", () => {
    const sel = document.getElementById("meeting-select");
    const [d, b] = (sel?.value || `${DEFAULT_DATE}|${DEFAULT_BODY}`).split("|");
    loadRecap(d, b, false);
  });

  document.getElementById("btn-refresh")?.addEventListener("click", () => {
    const sel = document.getElementById("meeting-select");
    const [d, b] = (sel?.value || `${DEFAULT_DATE}|${DEFAULT_BODY}`).split("|");
    loadRecap(d, b, true);
  });
}

let pollTimer = null;

async function loadRecap(date, body, refresh) {
  clearInterval(pollTimer);
  renderShell({
    meetings: state.meetings,
    recap: refresh ? null : state.recap,
    status: state.status,
    error: "",
    loading: true,
    date,
    body,
  });

  try {
    const recap = await fetchJson(
      `/api/meeting-recap/recap?date=${encodeURIComponent(date)}&body=${encodeURIComponent(body)}${refresh ? "&refresh=true" : ""}`
    );
    state.recap = recap;
    state.error = "";
    renderShell({
      meetings: state.meetings,
      recap,
      status: state.status,
      error: "",
      loading: false,
      date,
      body,
    });
  } catch (err) {
    state.error = err.message;
    renderShell({
      meetings: state.meetings,
      recap: null,
      status: state.status,
      error: err.message,
      loading: false,
      date,
      body,
    });
  }
}

const state = {
  meetings: [],
  recap: null,
  status: null,
  error: "",
};

async function init() {
  renderShell({
    meetings: [],
    recap: null,
    status: null,
    error: "",
    loading: true,
    date: DEFAULT_DATE,
    body: DEFAULT_BODY,
  });

  try {
    const { meetings } = await fetchJson("/api/meeting-recap/meetings");
    state.meetings = meetings || [];
    const first = state.meetings[0];
    const date = first?.date || DEFAULT_DATE;
    const body = first?.body || DEFAULT_BODY;
    await loadRecap(date, body, false);
  } catch (err) {
    state.error = err.message;
    renderShell({
      meetings: [],
      recap: null,
      status: null,
      error: err.message,
      loading: false,
      date: DEFAULT_DATE,
      body: DEFAULT_BODY,
    });
  }
}

init();

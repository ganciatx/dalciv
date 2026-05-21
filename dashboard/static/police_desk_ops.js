/**
 * DPD Desk Ops — live map UI (vanilla JS + Leaflet).
 * Wired to GET /api/police/active-calls; styled per hi-fi mockup.
 */
(function () {
  "use strict";

  const POLL_MS = 90000;
  const SEARCH_DEBOUNCE_MS = 250;
  /** Per poll: geocode uncached addresses (US Census, parallel). */
  const POLL_GEOCODE_BUDGET = 12;
  const MANUAL_REFRESH_GEOCODE_BUDGET = 30;
  const DALLAS_CENTER = [32.81, -96.78];
  const PIN_KEY = "dpd_desk_pins";
  const NOTES_KEY = "dpd_desk_notes";
  const WATCH_KEY = "dpd_desk_watch";
  const PREF_CLUSTERS = "dpd_show_clusters";
  const PREF_LEGEND = "dpd_show_legend";
  const PREF_RAIL = "dpd_show_rail";

  const state = {
    calls: [],
    meta: {},
    selectedId: null,
    query: "",
    sort: "newsworthy",
    tab: "feed",
    priorities: [1, 2, 3, 4],
    division: "",
    hideRoutine: true,
    dismissedAlerts: [],
    refreshing: false,
    lastFetchedAt: null,
    pins: loadJson(PIN_KEY, []),
    notes: loadJson(NOTES_KEY, []),
    watchlist: loadJson(WATCH_KEY, []),
    showClusters: loadBoolPref(PREF_CLUSTERS, true),
    showLegend: loadBoolPref(PREF_LEGEND, true),
    showRail: loadBoolPref(PREF_RAIL, true),
  };

  let map;
  let markers = {};
  let clusterLayerGroup = null;
  let pollTimer = null;
  let clockTimer = null;
  let searchDebounceTimer = null;
  let mapFitDone = false;

  /* ── helpers ───────────────────────────────────────────── */
  function loadJson(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "null");
      return Array.isArray(v) ? v : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function loadBoolPref(key, defaultVal) {
    try {
      const v = localStorage.getItem(key);
      if (v === null) return defaultVal;
      return v !== "0" && v !== "false";
    } catch {
      return defaultVal;
    }
  }

  function saveBoolPref(key, val) {
    try {
      localStorage.setItem(key, val ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function escAttr(s) {
    return esc(s);
  }

  function parseDispatch(date, time) {
    if (!date && !time) return new Date().toISOString();
    const d = String(date || "").trim();
    const t = String(time || "00:00:00").trim();
    // Socrata date is often "YYYY-MM-DDTHH:mm:ss.sss" with time stuck at midnight;
    // the real dispatch clock time lives in the separate `time` field (HH:mm:ss).
    const datePart = d.includes("T") ? d.slice(0, 10) : d.slice(0, 10);
    const timePart = t.includes("T") ? t.split("T").pop() : t;
    const iso = `${datePart}T${timePart}`;
    const dt = new Date(iso);
    return Number.isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
  }

  const fmt = {
    timeHm(iso) {
      const d = new Date(iso);
      return Number.isNaN(d.getTime())
        ? "—"
        : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
    timeShort(iso) {
      return fmt.timeHm(iso);
    },
    elapsed(iso) {
      const ms = Date.now() - new Date(iso).getTime();
      if (ms < 0) return "0m";
      const m = Math.floor(ms / 60000);
      if (m < 60) return `${m}m`;
      const h = Math.floor(m / 60);
      return `${h}h ${m % 60}m`;
    },
    clock() {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    },
  };

  function callCode(nature) {
    const n = String(nature || "");
    const idx = n.indexOf(" - ");
    return idx > 0 ? n.slice(0, idx).trim() : n;
  }

  function toViewModel(c) {
    const pri = parseInt(String(c.priority), 10) || 4;
    const unitList = Array.isArray(c.units) ? c.units : [];
    const units = unitList.map((u) => ({
      call: String(u),
      type: /^(UAS|AIR)/i.test(u) ? "air" : "patrol",
    }));
    const unitCount = c.unit_count ?? units.length;
    const isHot = pri === 1 || unitCount >= 5;
    return {
      id: c.id,
      code: callCode(c.nature_of_call),
      type: c.nature_of_call || "Unknown",
      typeDesc: c.nature_of_call_description || "",
      desc: c.nature_of_call_description || c.nature_of_call || "",
      addr: `${c.block || ""} ${c.location || ""}`.trim(),
      div: c.division || "—",
      pri,
      status: c.status || "atscene",
      units,
      unitCount,
      dispatchedAt: c.dispatched_at || parseDispatch(c.date, c.time),
      lat: c.lat,
      lng: c.lon,
      mapped: c.lat != null && c.lon != null,
      geocodeStatus: c.geocode_status || (c.lat != null ? "ok" : "pending"),
      flag: isHot ? "hot" : null,
      pinned: state.pins.includes(c.id),
      raw: c,
    };
  }

  function newsworthyScore(inc) {
    let s = 0;
    if (inc.pri === 1) s += 1000;
    if (inc.pri === 2) s += 200;
    if (inc.flag === "hot") s += 500;
    s += inc.unitCount * 15;
    if (inc.units.some((u) => u.type === "air")) s += 80;
    if (inc.type.toLowerCase().includes("shoot")) s += 200;
    if (inc.pinned) s += 300;
    return s;
  }

  function isHot(inc) {
    return inc.flag === "hot" || inc.pri === 1 || inc.unitCount >= 5;
  }

  function visibleIncidents() {
    const q = state.query.trim().toLowerCase();
    return state.calls.filter((inc) => {
      if (state.priorities.length && !state.priorities.includes(inc.pri)) return false;
      if (state.hideRoutine && inc.pri >= 4) return false;
      if (state.division && inc.div !== state.division) return false;
      if (
        q &&
        ![
          inc.id,
          inc.code,
          inc.type,
          inc.addr,
          inc.div,
          ...inc.units.map((u) => u.call),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });
  }

  function sortedIncidents(list) {
    const arr = list.slice();
    if (state.sort === "newsworthy") {
      arr.sort((a, b) => newsworthyScore(b) - newsworthyScore(a));
    } else if (state.sort === "time") {
      arr.sort((a, b) => new Date(b.dispatchedAt) - new Date(a.dispatchedAt));
    } else if (state.sort === "units") {
      arr.sort((a, b) => b.unitCount - a.unitCount);
    }
    return arr;
  }

  function stats() {
    const totalActive = state.calls.length;
    const totalUnits = state.calls.reduce((n, c) => n + c.unitCount, 0);
    const unmapped = state.calls.filter((c) => !c.mapped).length;
    let lagSec = 0;
    if (state.lastFetchedAt) {
      lagSec = Math.round((Date.now() - state.lastFetchedAt) / 1000);
    }
    return {
      totalActive,
      totalUnits,
      unmapped,
      lagSec,
      fetchedAt: state.lastFetchedAt
        ? new Date(state.lastFetchedAt).toLocaleTimeString()
        : "—",
    };
  }

  /* ── icons (inline SVG) ────────────────────────────────── */
  const Ic = {
    svg(path, size = 14) {
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">${path}</svg>`;
    },
    search: () => Ic.svg('<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>'),
    refresh: () => Ic.svg('<path d="M13 3a5 5 0 00-7 7M3 13a5 5 0 007-7"/><path d="M3 6V3h3M13 10v3h-3"/>'),
    bell: () => Ic.svg('<path d="M4 6a4 4 0 018 0v3l1 2H3l1-2V6"/><path d="M7 13a1.5 1.5 0 003 0"/>'),
    gear: () => Ic.svg('<circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3"/>'),
    close: () => Ic.svg('<path d="M4 4l8 8M12 4l-8 8"/>'),
    plus: () => Ic.svg('<path d="M8 3v10M3 8h10"/>'),
    minus: () => Ic.svg('<path d="M3 8h10"/>'),
    star: (filled) =>
      filled
        ? `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5l2 4 4.5.7-3.2 3.2.8 4.5L8 11.8 4 14l.8-4.5L1.5 6.2 6 5.5z"/></svg>`
        : Ic.svg('<path d="M8 1.5l2 4 4.5.7-3.2 3.2.8 4.5L8 11.8 4 14l.8-4.5L1.5 6.2 6 5.5z"/>'),
    chevron: () => Ic.svg('<path d="M4 6l4 4 4-4"/>'),
    layers: () => Ic.svg('<path d="M8 2L2 5l6 3 6-3-6-3zM2 8l6 3 6-3M2 11l6 3 6-3"/>'),
    scope: () => Ic.svg('<circle cx="8" cy="8" r="5"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/>'),
    map: () => Ic.svg('<path d="M2 4l4-2 4 2 4-2v10l-4 2-4-2-4 2V4z"/><path d="M6 2v10M10 4v10"/>'),
    copy: () => Ic.svg('<rect x="5" y="5" width="8" height="8" rx="1"/><path d="M3 11V3h8"/>'),
    note: () => Ic.svg('<path d="M4 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v4h4"/>'),
    alert: () => Ic.svg('<path d="M8 2l6 10H2z"/><path d="M8 7v2M8 12h.01"/>'),
  };

  function priChip(p) {
    const cls = `solid-p${p}`;
    return `<span class="chip ${cls}">P${p}</span>`;
  }

  function unitBadge(u) {
    const air = u.type === "air";
    return `<span class="chip ${air ? "solid-air" : "ghost"}">${esc(u.call)}</span>`;
  }

  function mapChip(inc) {
    if (inc.mapped) return "";
    if (inc.geocodeStatus === "pending") {
      return ' <span class="chip ghost" title="Pin will appear shortly">locating…</span>';
    }
    return ' <span class="chip ghost" title="Could not place address on map">unmapped</span>';
  }

  function callTypeTip(inc) {
    const tip = escAttr(inc.typeDesc || "No description for this call type.");
    return `<span class="call-type-line">${esc(inc.type)}<button type="button" class="call-type-tip" aria-label="About call type" data-tip="${tip}">i</button></span>`;
  }

  /* ── map ─────────────────────────────────────────────── */
  function initMap() {
    map = L.map("map", {
      center: DALLAS_CENTER,
      zoom: 11,
      zoomControl: false,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &middot; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 19,
      pane: "shadowPane",
    }).addTo(map);
    clusterLayerGroup = L.layerGroup().addTo(map);
  }

  /** Sync cluster/legend/rail toggles to DOM (persists in localStorage). */
  function applyMapChrome() {
    document.getElementById("toggle-clusters")?.classList.toggle("on", state.showClusters);
    document.getElementById("toggle-legend")?.classList.toggle("on", state.showLegend);
    const legend = document.getElementById("map-legend");
    if (legend) legend.hidden = !state.showLegend;
    document.querySelector(".main-grid")?.classList.toggle("map-only", !state.showRail);
    const rail = document.getElementById("right-rail");
    if (rail) rail.hidden = !state.showRail;
    const railBtn = document.getElementById("toggle-rail");
    if (railBtn) {
      railBtn.textContent = state.showRail ? "Hide panel" : "Show panel";
      railBtn.setAttribute("aria-expanded", String(state.showRail));
    }
    const showRailFab = document.getElementById("show-rail-fab");
    if (showRailFab) showRailFab.hidden = state.showRail;
  }

  function markerHtml(inc, selected) {
    const size =
      inc.unitCount >= 5 ? 22 : inc.unitCount >= 3 ? 16 : inc.pri <= 2 ? 12 : 9;
    const hot = isHot(inc);
    const ringColor = inc.pri === 1 ? "var(--p1)" : "var(--p2)";
    return `
      <div style="position:relative;width:0;height:0;">
        <div class="mk p${inc.pri}" style="width:${size}px;height:${size}px;"></div>
        ${hot ? `<div class="mk-halo" style="color:var(--p1);width:${size + 18}px;height:${size + 18}px;left:50%;top:50%;transform:translate(-50%,-50%);"></div>` : ""}
        ${selected ? `<div class="mk-ring" style="color:${ringColor};width:${size + 14}px;height:${size + 14}px;left:50%;top:50%;transform:translate(-50%,-50%);"></div>` : ""}
      </div>`;
  }

  function makeMarkerIcon(inc, selected) {
    return L.divIcon({
      className: "",
      html: markerHtml(inc, selected),
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  /** Incremental marker sync — add/update/remove by incident id (avoids full rebuild). */
  function renderMarkers(list) {
    const mapped = list.filter((i) => i.mapped);
    const nextIds = new Set(mapped.map((i) => i.id));

    Object.keys(markers).forEach((id) => {
      if (!nextIds.has(id)) {
        map.removeLayer(markers[id]);
        delete markers[id];
      }
    });

    mapped.forEach((inc) => {
      const selected = inc.id === state.selectedId;
      const latLng = [inc.lat, inc.lng];
      const existing = markers[inc.id];
      if (existing) {
        existing.setLatLng(latLng);
        existing.setIcon(makeMarkerIcon(inc, selected));
        return;
      }
      const marker = L.marker(latLng, { icon: makeMarkerIcon(inc, selected) }).addTo(map);
      marker.on("click", () => selectIncident(inc.id));
      markers[inc.id] = marker;
    });

    if (clusterLayerGroup) clusterLayerGroup.clearLayers();

    // Cluster hint: division with 2+ P1/P2 mapped calls (stroke only; one LayerGroup)
    if (state.showClusters && clusterLayerGroup) {
      const groups = {};
      mapped
        .filter((i) => i.pri <= 2)
        .forEach((i) => {
          groups[i.div] = groups[i.div] || [];
          groups[i.div].push([i.lat, i.lng]);
        });
      Object.values(groups).forEach((pts) => {
        if (pts.length < 2) return;
        const lats = pts.map((p) => p[0]);
        const lngs = pts.map((p) => p[1]);
        const ring = [
          [Math.min(...lats) - 0.006, Math.min(...lngs) - 0.006],
          [Math.min(...lats) - 0.006, Math.max(...lngs) + 0.006],
          [Math.max(...lats) + 0.006, Math.max(...lngs) + 0.006],
          [Math.max(...lats) + 0.006, Math.min(...lngs) - 0.006],
        ];
        L.polygon(ring, {
          color: "#f0d452",
          weight: 1.4,
          dashArray: "5 5",
          fill: false,
        }).addTo(clusterLayerGroup);
      });
    }
  }

  function fitMap(list) {
    const mapped = list.filter((i) => i.mapped);
    if (!mapped.length) {
      map.setView(DALLAS_CENTER, 11);
      return;
    }
    if (mapped.length === 1) {
      map.setView([mapped[0].lat, mapped[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(mapped.map((i) => [i.lat, i.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
  }

  /* ── render UI sections ──────────────────────────────── */
  function renderTopBar() {
    const s = stats();
    const alertN = buildAlerts().filter((a) => !state.dismissedAlerts.includes(a.id)).length;
    document.getElementById("topbar").innerHTML = `
      <div class="row gap-2" style="align-items:center">
        <div style="width:22px;height:22px;background:var(--fg-0);color:var(--bg-0);border-radius:4px;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700">D</div>
        <span class="t-display" style="font-size:14px">desk ops</span>
        <span style="width:1px;height:16px;background:var(--br-2);margin:0 4px"></span>
        <span class="t-mono" style="color:var(--fg-2)">Dallas</span>
        <span style="color:var(--fg-4)">·</span>
        <span class="t-mono" id="live-clock">${fmt.clock()}</span>
      </div>
      <div style="flex:1"></div>
      <div class="row gap-3" style="align-items:center">
        <span class="row gap-1" style="align-items:center"><span class="sdot live ${state.refreshing ? "" : "dim"}"></span><span class="t-mono" style="color:var(--fg-0);font-weight:600">LIVE</span></span>
        <span class="t-mono">${s.totalActive} active</span>
        <span style="color:var(--fg-4)">·</span>
        <span class="t-mono">${s.totalUnits} units</span>
        <span style="color:var(--fg-4)">·</span>
        <span class="t-mono" style="color:${alertN ? "var(--warn)" : "var(--fg-3)"}">${alertN} alert${alertN === 1 ? "" : "s"}</span>
      </div>
      <span style="width:1px;height:16px;background:var(--br-2)"></span>
      <button type="button" class="btn ghost sm" id="btn-refresh" title="Refresh">${Ic.refresh()}</button>
      <a class="btn ghost sm" href="/">Apps</a>
      <a class="btn ghost sm" href="https://cityofdallas.legistar.com/Calendar.aspx" target="_blank" rel="noopener noreferrer">Meetings</a>
      <a class="btn ghost sm" href="/council-accountability">Council</a>
      <a class="btn ghost sm" href="/city-budget">Budget</a>
      <button type="button" class="btn ghost sm" id="btn-fit">${Ic.scope()} Fit</button>
    `;
    document.getElementById("btn-refresh")?.addEventListener("click", () =>
      loadCalls({ force: true })
    );
    document.getElementById("btn-fit")?.addEventListener("click", () => fitMap(visibleIncidents()));
  }

  function buildAlerts() {
    const hot = state.calls.filter(isHot).slice(0, 3);
    return hot.map((inc) => ({
      id: `alert-${inc.id}`,
      kind: inc.pri === 1 ? "danger" : "warn",
      ruleLabel: inc.pri === 1 ? "Auto · P1" : "High activity",
      title: `${inc.code} — ${inc.type}`,
      where: inc.addr,
      meta: `${inc.unitCount} unit${inc.unitCount === 1 ? "" : "s"} · ${inc.div} · ${fmt.elapsed(inc.dispatchedAt)}`,
      incId: inc.id,
    }));
  }

  function renderAlerts() {
    const alerts = buildAlerts().filter((a) => !state.dismissedAlerts.includes(a.id));
    const el = document.getElementById("alert-ribbon");
    if (!alerts.length) {
      el.innerHTML = "";
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.innerHTML = alerts
      .map(
        (a) => `
      <div class="alert-row ${a.kind}">
        <span class="chip" style="background:${a.kind === "danger" ? "var(--p1)" : "var(--warn)"};color:${a.kind === "danger" ? "#1a0606" : "#1a1503"};border:0;font-weight:700">${esc(a.ruleLabel)}</span>
        <span class="t-h1" style="font-size:14px;color:var(--fg-0)">${esc(a.title)}</span>
        ${a.where ? `<span class="t-mono">· ${esc(a.where)}</span>` : ""}
        <span class="t-mono" style="color:var(--fg-2)">${esc(a.meta)}</span>
        <div style="flex:1"></div>
        <button type="button" class="btn sm" data-jump="${esc(a.incId)}">${Ic.map()} Jump</button>
        <button type="button" class="btn ghost icon sm" data-dismiss="${esc(a.id)}">${Ic.close()}</button>
      </div>`
      )
      .join("");
    el.querySelectorAll("[data-jump]").forEach((btn) => {
      btn.addEventListener("click", () => selectIncident(btn.dataset.jump));
    });
    el.querySelectorAll("[data-dismiss]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.dismissedAlerts.push(btn.dataset.dismiss);
        renderAlerts();
        renderTopBar();
      });
    });
  }

  function renderFeed() {
    const ranked = sortedIncidents(visibleIncidents());
    const hot = ranked.filter(isHot);
    const hotIds = new Set(hot.map((h) => h.id));
    const rest = ranked.filter((i) => !hotIds.has(i.id));
    const body = document.getElementById("rail-body");

    const rowHtml = (inc) => {
      const sel = inc.id === state.selectedId;
      const flagged = isHot(inc);
      return `
        <div class="inc-row ${sel ? "active" : ""} ${flagged ? "flagged" : ""} ${inc.pinned ? "pinned" : ""}" data-id="${esc(inc.id)}" tabindex="0">
          <div class="row gap-2" style="justify-content:space-between;align-items:flex-start">
            <div class="row gap-2" style="min-width:0;flex:1;align-items:center">
              ${priChip(inc.pri)}
              <span class="t-mono" style="color:var(--fg-0);font-weight:600">${esc(inc.id)}</span>
              <span class="t-h1" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(inc.type)}</span>
            </div>
            <span class="t-mono" style="white-space:nowrap">${fmt.timeHm(inc.dispatchedAt)} · ${fmt.elapsed(inc.dispatchedAt)}</span>
          </div>
          <div class="t-body-sm" style="margin-top:4px">${esc(inc.addr)}${mapChip(inc)}</div>
          <div class="row gap-2" style="margin-top:6px;flex-wrap:wrap;align-items:center">
            <span class="chip ghost" title="Units at scene">${inc.unitCount} unit${inc.unitCount === 1 ? "" : "s"}</span>
            <span class="t-mono">${esc(inc.div)}</span>
            <span style="color:var(--fg-4)">·</span>
            ${inc.units.slice(0, 4).map(unitBadge).join("")}
            ${inc.unitCount > 4 ? `<span class="t-mono" style="color:var(--fg-3)">+${inc.unitCount - 4}</span>` : ""}
            ${inc.unitCount >= 5 ? '<span class="chip solid-p1" style="margin-left:auto">BIG</span>' : ""}
          </div>
        </div>`;
    };

    body.innerHTML = `
      <div style="padding:8px 14px;border-bottom:1px solid var(--br-1);display:flex;align-items:center;gap:8px;justify-content:space-between">
        <div class="row gap-1">
          <span class="t-label">Sort</span>
          ${["newsworthy", "time", "units"]
            .map(
              (k) =>
                `<button type="button" class="btn ghost sm sort-btn ${state.sort === k ? "on" : ""}" data-sort="${k}">${k === "newsworthy" ? "Newsworthy" : k === "time" ? "Time" : "Units"}</button>`
            )
            .join("")}
        </div>
        <span class="t-mono" style="color:var(--fg-3)">${ranked.length} shown</span>
      </div>
      <div class="hide-scrollbar" style="overflow-y:auto;flex:1">
        ${
          hot.length
            ? `<div class="section-hdr danger"><span class="sdot live"></span><span class="t-label" style="color:var(--p1)">Newsworthy · ${hot.length}</span></div>${hot.map(rowHtml).join("")}`
            : ""
        }
        ${
          rest.length
            ? `<div class="section-hdr"><span class="t-label">Active · ${rest.length}</span></div>${rest.map(rowHtml).join("")}`
            : ranked.length
              ? ""
              : `<p class="t-mono" style="padding:14px;color:var(--fg-3)">No incidents match filters.</p>`
        }
      </div>`;

    body.querySelectorAll(".sort-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.sort = btn.dataset.sort;
        renderFeed();
      });
    });
    body.querySelectorAll(".inc-row").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest(".call-type-tip")) return;
        selectIncident(el.dataset.id);
      });
    });
    body.querySelectorAll(".call-type-tip").forEach((btn) => {
      btn.addEventListener("click", (e) => e.stopPropagation());
    });

    document.getElementById("tab-count-feed").textContent = state.calls.length;
  }

  function renderStubTab(name, label, itemsHtml) {
    document.getElementById("rail-body").innerHTML = `
      <div style="padding:12px 14px;overflow-y:auto;flex:1" class="hide-scrollbar">
        <div class="row gap-2" style="justify-content:space-between;margin-bottom:10px">
          <span class="t-label">${label}</span>
        </div>
        ${itemsHtml || `<p class="t-mono" style="color:var(--fg-3)">Nothing saved yet. ${name === "notes" ? "Select an incident and use Pin/Note in the inspector." : "Local storage only in this build."}</p>`}
      </div>`;
  }

  function renderRail() {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.toggle("on", t.dataset.tab === state.tab);
    });
    if (state.tab === "feed") renderFeed();
    else if (state.tab === "watch") {
      renderStubTab(
        "watch",
        "Watchlist",
        state.watchlist
          .map(
            (w) =>
              `<div class="surface-2" style="padding:10px 12px;margin-bottom:8px"><span class="t-h1">${esc(w.label || w)}</span></div>`
          )
          .join("")
      );
      document.getElementById("tab-count-watch").textContent = state.watchlist.length;
    } else if (state.tab === "notes") {
      renderStubTab(
        "notes",
        "Notes",
        state.notes
          .map(
            (n) =>
              `<div class="surface-2" style="padding:10px 12px;margin-bottom:8px;cursor:pointer" data-goto="${esc(n.incId)}"><span class="t-mono">#${esc(n.incId)}</span><div class="t-body-sm" style="margin-top:4px">${esc(n.body)}</div></div>`
          )
          .join("")
      );
      document.getElementById("rail-body").querySelectorAll("[data-goto]").forEach((el) => {
        el.addEventListener("click", () => selectIncident(el.dataset.goto));
      });
      document.getElementById("tab-count-notes").textContent = state.notes.length;
    } else {
      renderPatternsTab();
    }
  }

  function renderPatternsTab() {
    const byDiv = {};
    state.calls.forEach((c) => {
      byDiv[c.div] = (byDiv[c.div] || 0) + 1;
    });
    const rows = Object.entries(byDiv)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([div, n]) =>
          `<div class="surface-2" style="padding:10px 12px;margin-bottom:8px"><span class="t-h1">${esc(div)}</span><span class="t-mono" style="float:right">${n} incidents</span></div>`
      )
      .join("");
    renderStubTab("patterns", "Patterns (by division)", rows);
    document.getElementById("tab-count-patt").textContent = Object.keys(byDiv).length;
  }

  function renderInspector() {
    const el = document.getElementById("inspector");
    const inc = state.calls.find((c) => c.id === state.selectedId);
    if (!inc) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    const p1 = inc.pri === 1;
    el.innerHTML = `
      <div class="surface" style="width:380px;padding:0;box-shadow:var(--shadow-glow)">
        <div style="padding:12px 14px 10px;border-bottom:1px solid var(--br-1);${p1 ? "background:linear-gradient(180deg,var(--p1-soft),transparent)" : ""}">
          <div class="row gap-2" style="align-items:center">
            ${priChip(inc.pri)}
            <span class="t-mono" style="color:var(--fg-2)">#${esc(inc.id)}</span>
            <div style="flex:1"></div>
            <button type="button" class="btn ghost icon sm" id="insp-close">${Ic.close()}</button>
          </div>
          <div style="margin-top:8px" class="t-display" style="font-size:17px">${esc(inc.code)} — ${callTypeTip(inc)}</div>
          <div class="row gap-2" style="margin-top:6px;flex-wrap:wrap">
            ${inc.unitCount >= 5 ? `<span class="chip solid-p1">${inc.unitCount} UNITS</span>` : ""}
            ${inc.units.some((u) => u.type === "air") ? '<span class="chip solid-air">AIR</span>' : ""}
          </div>
        </div>
        <div style="padding:12px 14px">
          <div class="t-h1" style="font-size:14px">${esc(inc.addr)}</div>
          <div class="t-mono" style="margin-top:4px;color:var(--fg-2)">${esc(inc.div)} · ${esc(inc.status)}</div>
          <div class="t-body" style="margin-top:8px;font-style:italic;color:var(--fg-1)">${esc(inc.desc)}</div>
          <div class="div-h" style="margin:12px 0"></div>
          <div class="t-label">Units on scene</div>
          <div class="row gap-1" style="margin-top:6px;flex-wrap:wrap">${inc.units.map(unitBadge).join("")}</div>
        </div>
        <div style="padding:10px 14px;border-top:1px solid var(--br-1);background:var(--bg-2);display:flex;gap:6px;border-radius:0 0 var(--r-3) var(--r-3)">
          <button type="button" class="btn primary sm" id="insp-pin">${Ic.star(inc.pinned)} ${inc.pinned ? "Unpin" : "Pin"}</button>
          <button type="button" class="btn sm" id="insp-note">${Ic.note()} Note</button>
        </div>
      </div>`;
    document.getElementById("insp-close").onclick = () => {
      state.selectedId = null;
      renderMarkers(visibleIncidents());
      el.hidden = true;
      renderRail();
    };
    document.getElementById("insp-pin").onclick = () => togglePin(inc.id);
    document.getElementById("insp-note").onclick = () => addNote(inc.id);
    el.querySelectorAll(".call-type-tip").forEach((btn) => {
      btn.addEventListener("click", (e) => e.stopPropagation());
    });
  }

  function renderMapStats() {
    const s = stats();
    document.getElementById("map-stats").innerHTML = `
      <span class="row gap-1"><span class="sdot live"></span><span class="t-mono">LIVE</span></span>
      <span class="t-mono">${s.totalActive} active</span>
      <span style="color:var(--fg-4)">·</span>
      <span class="t-mono">${s.totalUnits} units</span>
      <span style="color:var(--fg-4)">·</span>
      <span class="t-mono" style="color:var(--fg-3)">${s.unmapped} unmapped</span>
      <span style="color:var(--fg-4)">·</span>
      <span class="t-mono" style="color:var(--fg-3)">fetched ${s.fetchedAt} (${s.lagSec}s)</span>
    `;
  }

  function fillDivisionSelect() {
    const sel = document.getElementById("filter-division");
    const cur = state.division;
    const divs = [...new Set(state.calls.map((c) => c.div).filter(Boolean))].sort();
    sel.innerHTML =
      '<option value="">All divisions</option>' +
      divs.map((d) => `<option value="${escAttr(d)}">${esc(d)}</option>`).join("");
    sel.value = cur;
  }

  function renderAll() {
    renderTopBar();
    renderAlerts();
    renderMarkers(visibleIncidents());
    renderRail();
    renderInspector();
    renderMapStats();
    fillDivisionSelect();
  }

  /** Lighter path for 90s polls — skip alerts/division rebuild when data shape unchanged. */
  function renderPollLight() {
    renderTopBar();
    renderMapStats();
    renderMarkers(visibleIncidents());
    renderRail();
    if (state.selectedId && state.calls.some((c) => c.id === state.selectedId)) {
      renderInspector();
    } else if (state.selectedId) {
      state.selectedId = null;
    }
  }

  /** Filters/search — markers + rail + stats only (debounced for search input). */
  function renderFilterLight() {
    renderMarkers(visibleIncidents());
    renderRail();
    renderMapStats();
    if (state.selectedId) renderInspector();
  }

  function scheduleFilterRender() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(renderFilterLight, SEARCH_DEBOUNCE_MS);
  }

  function renderSelectionLight() {
    renderMarkers(visibleIncidents());
    renderInspector();
    renderRail();
  }

  function selectIncident(id) {
    state.selectedId = id;
    const inc = state.calls.find((c) => c.id === id);
    if (inc?.mapped) {
      map.setView([inc.lat, inc.lng], 15);
    }
    renderSelectionLight();
    const row = [...document.querySelectorAll(".inc-row")].find((el) => el.dataset.id === id);
    row?.scrollIntoView({ block: "nearest" });
  }

  function togglePin(id) {
    const i = state.pins.indexOf(id);
    if (i >= 0) state.pins.splice(i, 1);
    else state.pins.push(id);
    saveJson(PIN_KEY, state.pins);
    state.calls = state.calls.map((c) =>
      c.id === id ? { ...c, pinned: state.pins.includes(id) } : c
    );
    renderSelectionLight();
  }

  function addNote(incId) {
    const body = window.prompt("Note for incident " + incId);
    if (!body) return;
    state.notes.unshift({ id: String(Date.now()), incId, body, at: new Date().toLocaleString() });
    saveJson(NOTES_KEY, state.notes);
    renderRail();
  }

  function togglePriority(p) {
    const set = new Set(state.priorities);
    if (set.has(p)) set.delete(p);
    else set.add(p);
    state.priorities = [...set].sort();
    document.querySelectorAll(".pri-btn").forEach((btn) => {
      const pv = parseInt(btn.dataset.pri, 10);
      const on = state.priorities.includes(pv);
      btn.style.opacity = on ? "1" : "0.4";
      btn.style.background = on ? "var(--bg-3)" : "transparent";
    });
    renderFilterLight();
  }

  function activeCallsUrl(options) {
    const params = new URLSearchParams();
    if (options.force) {
      params.set("refresh", "true");
      params.set("geocode_budget", String(MANUAL_REFRESH_GEOCODE_BUDGET));
    } else {
      params.set("geocode_budget", String(POLL_GEOCODE_BUDGET));
    }
    const q = params.toString();
    return q ? `/api/police/active-calls?${q}` : "/api/police/active-calls";
  }

  async function loadCalls(options) {
    options = options || {};
    state.refreshing = true;
    renderTopBar();
    try {
      const res = await fetch(activeCallsUrl(options));
      if (!res.ok) throw new Error(await res.text());
      const body = await res.json();
      state.meta = body.meta || {};
      state.lastFetchedAt = Date.now();
      state.calls = (body.calls || []).map(toViewModel);
      if (!state.selectedId && state.calls.length) {
        const first = sortedIncidents(state.calls).find(isHot) || state.calls[0];
        state.selectedId = first?.id || null;
      }
      if (!mapFitDone) {
        renderAll();
        fitMap(visibleIncidents());
        mapFitDone = true;
      } else if (options.force) {
        renderAll();
      } else {
        renderPollLight();
      }
    } catch (err) {
      console.error(err);
      document.getElementById("map-stats").innerHTML = `<span class="t-mono" style="color:var(--p1)">${esc(String(err))}</span>`;
    } finally {
      state.refreshing = false;
      renderTopBar();
    }
  }

  /* ── boot ────────────────────────────────────────────── */
  function bindUi() {
    document.getElementById("search-input").addEventListener("input", (e) => {
      state.query = e.target.value;
      scheduleFilterRender();
    });
    document.getElementById("filter-division").addEventListener("change", (e) => {
      state.division = e.target.value;
      renderFilterLight();
    });
    document.getElementById("hide-routine").addEventListener("click", () => {
      state.hideRoutine = !state.hideRoutine;
      document.getElementById("hide-routine").classList.toggle("on", state.hideRoutine);
      renderFilterLight();
    });
    document.getElementById("toggle-clusters")?.addEventListener("click", () => {
      state.showClusters = !state.showClusters;
      saveBoolPref(PREF_CLUSTERS, state.showClusters);
      applyMapChrome();
      renderMarkers(visibleIncidents());
    });
    document.getElementById("toggle-legend")?.addEventListener("click", () => {
      state.showLegend = !state.showLegend;
      saveBoolPref(PREF_LEGEND, state.showLegend);
      applyMapChrome();
    });
    const toggleRail = () => {
      state.showRail = !state.showRail;
      saveBoolPref(PREF_RAIL, state.showRail);
      applyMapChrome();
      if (state.showRail) map.invalidateSize();
    };
    document.getElementById("toggle-rail")?.addEventListener("click", toggleRail);
    document.getElementById("show-rail-fab")?.addEventListener("click", toggleRail);
    document.querySelectorAll(".pri-btn").forEach((btn) => {
      btn.addEventListener("click", () => togglePriority(parseInt(btn.dataset.pri, 10)));
    });
    document.getElementById("zoom-in").addEventListener("click", () => map.zoomIn());
    document.getElementById("zoom-out").addEventListener("click", () => map.zoomOut());
    document.querySelectorAll(".tab").forEach((t) => {
      t.addEventListener("click", () => {
        state.tab = t.dataset.tab;
        renderRail();
      });
    });
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("search-input").focus();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initMap();
    bindUi();
    applyMapChrome();
    loadCalls();
    pollTimer = setInterval(() => loadCalls(), POLL_MS);
    clockTimer = setInterval(() => {
      const c = document.getElementById("live-clock");
      if (c) c.textContent = fmt.clock();
    }, 1000);
  });
})();

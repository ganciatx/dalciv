# Issue: Police map — cluster fill bug + map UI toggles

**Type:** `bug` + `feature` • **Priority:** `normal` • **Effort:** `small` • **Status:** open

## TL;DR

Fix yellow **cluster** boxes stacking/darkening on click; add filter-bar toggles for **clusters**, **legend**, and **right details rail** so users can run a full-width map-only view.

## Current vs expected

| # | Current | Expected |
|---|---------|----------|
| 1 | Yellow dashed cluster polygons use `fillColor` + `fillOpacity: 0.07`. Each click re-runs `renderMarkers()`; **only the last** `lassoLayer` is removed while **multiple** `L.polygon` layers remain → fills stack and look darker. | Cluster boxes are **stroke-only** (no fill, ever). Re-renders must not accumulate layers. |
| 2 | Cluster boxes always on when 2+ P1/P2 calls share a division; no user control. | Toggle next to **P1–P4** in `#filter-bar` (e.g. **Clusters**) to show/hide cluster polygons. |
| 3 | `#map-legend` always visible bottom-right. | Toggle next to other map controls (e.g. **Legend**) to show/hide legend. |
| 4 | `#right-rail` (Feed / Watch / Notes / Patterns) always visible; grid is `1fr 440px`. | Control on the **right rail** (or filter bar) to **collapse/hide** the rail → map uses full width; restore when needed. |

## Root cause (item 1)

In `renderMarkers()` (`police_desk_ops.js`):

```javascript
Object.values(groups).forEach((pts) => {
  // ...
  lassoLayer = L.polygon(ring, {
    fillColor: "#f0d452",
    fillOpacity: 0.07,
    // ...
  }).addTo(map);
});
```

- Single `lassoLayer` variable overwritten in a loop → prior polygons not removed on refresh.
- `selectIncident()` → `renderAll()` → `renderMarkers()` on every click.

**Fix direction:** `fill: false` (or `fillOpacity: 0`); track layers in `lassoLayers[]` or `L.layerGroup()` and `clearLayers()` before redraw.

## Proposed UX

**Filter bar** (`police_map.html` `#filter-bar`, after P4 / before division):

- `Clusters` — `btn sm` toggle, default **on**; mirrors `pri-btn` active styling.
- `Legend` — toggle `#map-legend` visibility.

**Right rail:**

- Collapse control (e.g. `◀ Hide panel` / `▶ Show panel`) in rail header or top-right of rail; sets `.main-grid` to single column when hidden.
- Optional: persist `localStorage` keys (`dpd_show_clusters`, `dpd_show_legend`, `dpd_show_rail`).

## Files

- `dashboard/static/police_desk_ops.js` — `renderMarkers`, `state` flags, toggle handlers, layer cleanup
- `dashboard/static/police_desk_ops.css` — `.main-grid.map-only`, hidden legend/rail, cluster stroke-only if needed
- `dashboard/templates/police_map.html` — new toggle buttons in `#filter-bar`; rail collapse affordance

## Acceptance criteria

1. Clicking map markers / feed rows near clusters does **not** change cluster fill opacity or add visible fill.
2. **Clusters** off → no yellow dashed boxes; on → boxes return (stroke only).
3. **Legend** off → `#map-legend` hidden; on → visible.
4. **Hide rail** → map full width; feed accessible again via show control; layout usable on desktop.
5. P1–P4, division, hide-routine behavior unchanged.

## Risks / notes

- Mobile (`@media max-width: 900px`) already stacks rail below map — collapse behavior should not break small screens.
- Legend and `#map-stats` overlap bottom corners; toggling legend may free space (no change required unless overlap reported).
- Unrelated: `ISSUE-council-police-slow-load.md` (performance).

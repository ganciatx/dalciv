# Issue: Police map — cluster fill bug + map UI toggles

**Type:** `bug` + `feature` • **Priority:** `normal` • **Effort:** `small` • **Status:** fixed ✅

## TL;DR

Fix yellow **cluster** boxes stacking/darkening on click; add filter-bar toggles for **clusters**, **legend**, and **right details rail** so users can run a full-width map-only view.

## Resolution

| # | Fix |
|---|-----|
| 1 | `clusterLayerGroup.clearLayers()` before redraw; polygons use `fill: false` (stroke-only). |
| 2 | **Clusters** toggle in `#filter-bar` (`#toggle-clusters`), default on. |
| 3 | **Legend** toggle (`#toggle-legend`); `#map-legend` `hidden` when off. |
| 4 | **Hide panel** on rail (`#toggle-rail`); **Show panel** FAB (`#show-rail-fab`); `.main-grid.map-only` for full-width map. |
| 5 | Preferences: `dpd_show_clusters`, `dpd_show_legend`, `dpd_show_rail` in `localStorage`. |

## Files changed

- `dashboard/static/police_desk_ops.js` — layer group, toggles, `applyMapChrome()`
- `dashboard/static/police_desk_ops.css` — `.map-only`, `.map-toggle.on`, `.rail-top`, `.show-rail-fab`, cluster stroke-only
- `dashboard/templates/police_map.html` — toggle buttons, rail header, show-panel FAB

## Acceptance criteria

1. ✅ Clicking markers / feed rows does not stack cluster fill.
2. ✅ **Clusters** off → no dashed boxes; on → stroke-only boxes.
3. ✅ **Legend** off → hidden; on → visible.
4. ✅ **Hide rail** → full-width map; **Show panel** restores rail.
5. ✅ P1–P4, division, hide-routine unchanged.

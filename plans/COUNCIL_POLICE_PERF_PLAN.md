# Council + Police load performance

**Overall progress: 100%**

| Step | Status |
|------|--------|
| Police 90s response cache (skip Socrata on poll) | ✅ |
| Police geocode: cache-only on poll (`geocode_budget=0`) | ✅ |
| Police manual refresh: `geocode_budget=5` only when user clicks Refresh | ✅ |
| Police map: incremental Leaflet markers (no full rebuild) | ✅ |
| Police map: debounced search (250ms) + light filter/poll render paths | ✅ |
| Council parallel `bootstrap()` (`Promise.all`) | ✅ |
| Council lazy Money/Voting tab loads | ✅ |
| Directory includes `date_range_defaults` (no extra summary fetch) | ✅ |
| Voting summary `lightweight=true` for overview KPIs | ✅ |
| CHANGELOG + issue notes | ✅ |

## Tradeoffs

- **Police**: Map may show unmapped pins until geocode cache warms. Polls never call Nominatim. Manual Refresh runs up to 5 new geocodes (~5s max). Full cache rebuild: `?refresh=true&geocode_budget=25`.
- **Council**: First open of Money/Voting tabs fetches data on demand; Overview no longer loads transaction rows or vote tables upfront.

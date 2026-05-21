# Issue: Council and Police pages slow to load — explore optimizations

**Type:** `improvement` • **Priority:** `normal` • **Effort:** `medium` • **Status:** done (see `COUNCIL_POLICE_PERF_PLAN.md`)

## TL;DR

`/campaign-finance` (Council Accountability) and `/police` feel sluggish on first visit and sometimes on refresh. Investigate server-side caching, payload size, sequential API waterfalls, and geocoding bottlenecks; ship the highest-impact wins without changing public UX goals.

## Current vs expected

| | |
|---|---|
| **Current** | Council: cold cache or `refresh_voting=true` can block for minutes while ~189k voting rows paginate from Socrata; bootstrap runs several large API calls **in series**. Police: every `GET /api/police/active-calls` hits Socrata live, then geocodes up to 25 addresses via Nominatim (~1 req/s). |
| **Expected** | First paint in a few seconds with cached/stale-while-revalidate data; background refresh optional; police map usable before geocoding finishes. |

## Likely bottlenecks (from codebase)

### Council (`/campaign-finance`)

- **`council_voting.fetch_voting_records()`** — paginates full dataset (`PAGE_SIZE` pages, `time.sleep(0.25)` between pages, 180s timeout per request). Writes ~157MB cache on first build.
- **`get_cached_rows(force_refresh=True)`** — triggered on first deploy, empty volume, or user clicking **Refresh voting**.
- **Client waterfall** — `bootstrap()` awaits in order: `loadDirectory` → `loadVotingSummary` → `loadFinance` → optional member/votes (`campaign_finance.html`).
- **Duplicate work** — directory + summary both touch finance/voting caches; member profile may refetch when filters change.
- **Large JSON** — summary/votes payloads sent whole to browser even when only Overview tab is visible.

### Police (`/police`)

- **No response cache** — unlike finance/voting, active calls are fetched from Socrata on every request (`police_calls.get_active_calls_payload`).
- **Geocoding on critical path** — `enrich_with_geocodes()` runs during the API request (max 25 new Nominatim lookups × ~1s each).
- **Extra upstream call** — `fetch_dataset_meta()` per request for staleness hints.

## Optimization directions to explore

1. **Police short-TTL server cache** (e.g. 30–90s JSON file or in-memory) so map polls don’t re-hit Socrata + geocode every 90s.
2. **Split police API** — return calls immediately with `lat`/`lon` from cache only; optional `POST /api/police/geocode-batch` or second poll for missing pins.
3. **Council parallel fetch** — `Promise.all` for independent endpoints in `bootstrap()` (directory, voting summary, finance summary).
4. **Lazy tab loading** — don’t call `loadVotes` / transactions until user opens Money or Voting tab.
5. **Warm cache on deploy** — background job or Docker entrypoint to build voting cache once; show “cache warming” in UI instead of blocking.
6. **Pre-aggregated voting index** — store member roll-call summaries separately so Overview doesn’t require scanning full `rows` in Python on every summary request.
7. **Socrata query limits** — confirm whether summary KPIs can use `$select` / aggregation endpoints instead of loading all rows for charts.
8. **CDN / gzip** — ensure large cache files aren’t re-read from disk unnecessarily; consider compressed on-disk cache.
9. **Production sizing** — KVM 1 (4GB) + full voting cache in memory may add latency; measure with `/command` (planned) or simple timing logs.

## Files

- `dashboard/council_voting.py` — full-dataset fetch, cache TTL, pagination
- `dashboard/campaign_finance.py` — finance cache, summary aggregation
- `dashboard/council_accountability.py` — directory/member joins both caches
- `dashboard/police_calls.py` — live Socrata fetch, geocode path
- `dashboard/templates/campaign_finance.html` — sequential `bootstrap()`, tab loads
- `dashboard/static/police_desk_ops.js` — 90s poll to `/api/police/active-calls`

## Acceptance criteria (when implemented)

- Cold visit to `/police`: interactive map or feed within **≤5s** on production VPS (with warm geocode cache).
- Cold visit to `/campaign-finance`: Overview usable within **≤5s** when voting cache file exists; first-ever cache build may show explicit progress, not a hung page.
- Repeat visits / tab switches: no full Socrata re-download unless user clicks Refresh.
- Document tradeoffs in `CHANGELOG.md` or plan file.

## Risks / notes

- Stale data vs freshness — police wants ~90s freshness; voting cache is 24h TTL today.
- Nominatim ToS — batch geocoding must stay rate-limited; don’t parallelize blindly.
- Don’t break `refresh=true` semantics for operators who need a forced Socrata pull.
- Any cache change must survive Docker volume mounts on Hostinger (`scraper_dashboard_data`).

## Related

- `COMMAND_PORTAL_PLAN.md` — ops view of cache age / API usage (helps measure before/after)
- `HOSTINGER_DEPLOY_PLAN.md` — KVM 1 memory constraint on production

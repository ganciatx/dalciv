# Issue: Council accountability 500 + URL slug `/council-accountability`

**Type:** `bug` • **Priority:** `high` • **Effort:** `small` • **Status:** fixed ✅

## TL;DR

`/campaign-finance` returned **500 Internal Server Error** for some directory payloads; rename public URL to **`/council-accountability`** (keep `/campaign-finance` as redirect).

## Root cause

1. **Jinja2 parse error** — JSDoc in `campaign_finance.html` used `{{ districtLink?: boolean }}`; Jinja treated `{{` as template syntax → **500 on every page load**.
2. `build_member_directory()` could **`AttributeError`** on `display_name.lower()` for edge-case rows (API directory).
3. Production Docker image did not **`COPY images/`** (headshots missing after deploy).

## Fix

- Removed `{{ ... }}` from JS JSDoc in `campaign_finance.html` (Jinja was parsing the page as a template).
- Safe sort keys: `(str(m.get("display_name") or "")).lower()`.
- Safe `district_num` parsing in `sort_member_directory`.
- `GET /council-accountability` → Council Accountability UI; `GET /campaign-finance` → **308** redirect.
- Nav links updated; `Dockerfile` copies `images/`.

## Acceptance criteria

1. ✅ `/council-accountability` loads without 500.
2. ✅ `/campaign-finance` redirects to `/council-accountability`.
3. ✅ `/api/council-accountability/*` unchanged.

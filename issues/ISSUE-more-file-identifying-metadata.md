# Issue: richer identifying metadata per captured Legistar file

**Type:** `feature` • **Priority:** `normal` • **Effort:** `medium` • **Status:** fixed ✅

## TL;DR

Manifest rows and UI summaries only exposed **`type` / `label` / `url` / `saved_to`**, which was ambiguous when filenames collided or when auditing *which meeting* a PDF came from. Add stable, sortable fields so each download is identifiable (meeting context, source context, network provenance).

## Resolution

Manifest columns (see `dallas_legistar_scraper.py` docstring):

| Field | Purpose |
|-------|---------|
| `meeting_title`, `meeting_detail_url`, `source` | Meeting context (existing; retained) |
| `legistar_id` | Document/file id from `View.ashx` `ID=` |
| `legistar_event_id` | Event id from `MeetingDetail.aspx?ID=` |
| `matter_id` | `MatterID` / `MID` when present on URL |
| `calendar_row_context` | Calendar table row text for calendar-sourced files |
| `http_status`, `content_type`, `bytes_written`, `scraped_at` | Download provenance |
| `sha256` | File integrity / dedupe |

- `download_file()` captures response metadata; `clusterLayerGroup`-style cleanup N/A — single manifest rewrite per run.
- Dashboard file table: **Meeting**, **Source**, **Legistar ID** columns; path cell tooltip shows URL, scrape time, bytes, hash.
- `dashboard/supervisor.py` backfills missing columns for legacy CSVs.

## Acceptance criteria

1. ✅ New columns in `download_manifest.csv` for runs after the change.
2. ✅ UI shows meeting context + source + Legistar id where available.
3. ✅ Dashboard works when manifest lacks new columns.

See **`MANIFEST_METADATA_PLAN.md`**.

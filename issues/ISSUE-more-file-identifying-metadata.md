# Issue: richer identifying metadata per captured Legistar file

**Type:** `feature` • **Priority:** `normal` • **Effort:** `medium`

## TL;DR

Manifest rows and UI summaries only expose **`type` / `label` / `url` / `saved_to`**, which is ambiguous when filenames collide or when auditing *which meeting* a PDF came from. Add stable, sortable fields so each download is identifiable (meeting context, source context, network provenance).

## Current behavior

- `dallas_legistar_scraper.py` appends records with four keys; filenames are derived from link text + optional meeting `h1`, not Legistar IDs.
- `download_manifest.csv` is the single source of truth for the dashboard file table; `dashboard/supervisor.py` only adds `file_exists` / display helpers.
- Duplicate or generic labels (e.g. multiple “Agenda”) produce non-unique `saved_to` patterns and weak traceability.

## Expected outcome

- Each manifest row includes **enough metadata to uniquely explain the file** without opening the PDF, e.g. (pick what fits product needs):
  - **`meeting_detail_url`** (when discovered on a detail page)
  - **`calendar_row_context`** or **`meeting_title`** (normalized from detail `h1` or calendar cell)
  - **`source`** enum: `calendar` | `meeting_detail`
  - **`legistar_event_id` / `matter_id`** if parseable from `MeetingDetail.aspx` or `View.ashx` query params
  - **`http_status`**, **`content_type`** (or infer from response), **`bytes_written`**, **`scraped_at` (ISO)**
  - Optional **`sha256`** of saved bytes for dedupe/integrity
- Dashboard table gains columns (or expandable detail) for the new fields; CSV remains machine-readable.
- Backward compatibility: old manifests without new columns still load (treat missing keys as empty).

## Relevant files (primary)

- `dallas_legistar_scraper.py` — extend `records.append(...)` and `download_file` to capture response + URL parsing metadata.
- `dashboard/supervisor.py` — `summarize_files` / CSV reader tolerates extra columns; optionally surface in API payload.
- `dashboard/templates/index.html` — render additional columns or a details row.

## Risks / notes

- **CSV schema change:** consumers of `download_manifest.csv` must tolerate new headers (pandas already does if keyed by name).
- **PII / size:** hashing large PDFs costs CPU; make optional or sample first *n* bytes if needed.
- **URL stability:** Legistar query strings are the right place to extract IDs; add unit-less parsing helpers with tests for one sample URL each.
- **Concurrency:** single-process scraper today; no locking change required unless parallel downloads are added later.

## Acceptance criteria (suggested)

1. New columns appear in `download_manifest.csv` for runs after the change (documented in module docstring).
2. UI shows at least **meeting context + source + one Legistar id** where available.
3. Existing dashboard still works if manifest is missing new columns (older files).

---

*Captured via `/create-issue`. Implementation: switch to Agent mode or implement in a dedicated PR.*

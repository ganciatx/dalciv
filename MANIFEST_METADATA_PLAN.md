# Manifest identifying metadata — implementation plan

**Overall Progress:** `100%`

## TLDR

Extend `download_manifest.csv` and the council-meetings file table with network provenance, Legistar IDs, and meeting context so each PDF is identifiable without opening it. Older manifests without new columns keep working.

## Tasks

- [x] 🟩 **Step 1: Scraper** — `download_file` returns `http_status`, `content_type`, `bytes_written`, `scraped_at`, `sha256`; URL parsers for `legistar_event_id` / `matter_id`; `calendar_row_context` from calendar row text.
- [x] 🟩 **Step 2: Supervisor** — `MANIFEST_OPTIONAL_COLUMNS` + `legistar_id_display` for API/UI.
- [x] 🟩 **Step 3: Dashboard** — file table columns: Meeting, Source, Legistar ID, Exists, Path (+ type/label).
- [x] 🟩 **Step 4: Tests** — sample Dallas Legistar URL parsing.
- [x] 🟩 **Step 5: Docs** — module docstring, issue marked fixed, README/CHANGELOG.

## Manifest columns (post-change)

`type`, `label`, `url`, `saved_to`, `meeting_title`, `meeting_detail_url`, `source`, `legistar_id`, `legistar_event_id`, `matter_id`, `calendar_row_context`, `http_status`, `content_type`, `bytes_written`, `scraped_at`, `sha256`

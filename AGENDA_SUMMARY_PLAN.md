# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

After PDFs are downloaded, users **read a short summary and bullet key points** per file in the dashboard, grouped with **meeting context** (name, date, detail URL when known). Meeting metadata is persisted in the manifest; summaries are generated on demand via extractive PDF parsing (no API key).

## Critical Decisions

- **Decision 1: Meeting metadata first (scraper)** — Manifest columns **`meeting_title`**, **`meeting_detail_url`**, **`source`**, **`legistar_id`**; unique filenames via Legistar ID/GUID suffix (no more colliding `Agenda.pdf`).

- **Decision 2: Summarize on demand, not inside scrape** — `POST /api/summarize` runs a background batch; scraper subprocess unchanged.

- **Decision 3: v1 = extractive summaries (no API key required)** — `dashboard/content.py` uses **pypdf** + heading/bullet heuristics.

- **Decision 4: Persist summaries separately from manifest** — **`scraper_dashboard_data/summaries.json`** keyed by `saved_to`.

- **Decision 5: UI = meeting-centric list** — “Agenda summaries” panel grouped by **`meeting_display`**; bundled in **`GET /api/overview`**.

## Tasks:

- [x] 🟩 **Step 1: Persist meeting metadata at scrape time**
  - [x] 🟩 Detail pages attach **`meeting_title`** + **`meeting_detail_url`** on each file row.
  - [x] 🟩 Calendar rows use **`source=calendar`** with empty meeting fields.
  - [x] 🟩 Manifest columns + **`unique_pdf_filename()`** via Legistar ID/GUID.
  - [x] 🟩 **`normalize_manifest_row()`** in `dashboard/supervisor.py` for legacy CSVs.

- [x] 🟩 **Step 2: PDF text extraction**
  - [x] 🟩 **`dashboard/content.py`**: `extract_text()`, statuses `ok` / `empty` / `error`.
  - [x] 🟩 **`pypdf`** in `requirements.txt` + README.

- [x] 🟩 **Step 3: Summary + key points generation**
  - [x] 🟩 **`build_summary()`** extractive summary + key points.
  - [x] 🟩 **`dashboard/summaries.py`**: batch job + **`summaries.json`** store.
  - [x] 🟩 **`POST /api/summarize`**, **`POST /api/summarize/one`**, **`GET /api/summarize/status`**.

- [x] 🟩 **Step 4: API + dashboard UI**
  - [x] 🟩 **`GET /api/summaries`** + overview bundle **`summaries`** + **`summarize_job`**.
  - [x] 🟩 Summaries panel: meeting headers, metadata link, file cards, Generate button + progress pill.

- [x] 🟩 **Step 5: Docs & acceptance**
  - [x] 🟩 **`README.md`** + **`CHANGELOG.md`** updated.
  - [x] 🟩 Verified extractive summary on **`Meeting_Details_Board_Packet_May_11_2026.pdf`** (text + key points).

## Out of scope (this plan)

- Full-text search across all PDFs.
- LLM summarization (optional follow-up only).
- Changing Legistar scrape scope (pagination, date filters).
- Public/hosted deployment or auth.

## Dependencies / risks

- **Scanned PDFs**: image-only agendas return `empty` unless OCR added later.
- **Legacy manifest**: re-run scraper to populate meeting columns; summaries still work with filename fallbacks.
- **Runtime**: large batches run in background; UI shows `done/total` while job runs.

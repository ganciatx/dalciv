# Issue: Generate Summaries unavailable after scrape

**Type:** `bug` • **Priority:** `high` • **Effort:** `medium` • **Status:** fixed in tree

## TL;DR

After a scrape, new PDFs appeared on disk but **Generate summaries** looked empty or returned **nothing pending**. Manifest paths, on-disk files, and `summaries.json` were out of sync (duplicate `saved_to` keys + stale summary entries).

## Root cause

1. **Manifest collisions** — Many manifest rows pointed at the same path (e.g. `Agenda.pdf`) while the scraper had already written uniquely named files (`Agenda_<legistar_id>.pdf`).
2. **Summary store keyed by `saved_to`** — One summarized `Agenda.pdf` entry caused `summarize_pending` to skip every duplicate manifest row.
3. **UI messaging** — Empty-state copy implied “no scrape yet” even when files existed on disk but were not summarizable per manifest.

## Fix (implemented)

- Build summarizable file list from **manifest + `*.pdf` on disk** (deduped by path).
- **Prune** `summaries.json` when a scrape finishes; drop keys not in current manifest or download folder.
- **Dedupe** batch summarization by `saved_to`.
- UI: show **ready / pending / on disk** counts; **Regenerate all** (`force=true`); clearer empty states.

## Files

- `dashboard/summaries.py`
- `dashboard/supervisor.py`
- `dashboard/templates/index.html`

# Feature Implementation Plan

**Overall Progress:** `92%` *(baseline scrape ✅ • supervisory dashboard ✅ • optional per-request HTTP logging 🔜)*

## TLDR

Add a minimal local UI to **start/stop** the Dallas Legistar scraper, persist an **audit log** of runs (timing, outcome, coarse stats), and show a **summary of retrieved files** with **download status** derived from `download_manifest.csv` plus verifying files still exist on disk.

## Critical Decisions

- **Decision 1: Run isolation via subprocess** — Start/stop maps to spawning the scraper in a **child process** and **terminating** that process on “Stop”. This avoids refactoring Playwright’s sync APIs for thread cancellation while still matching “kill the run” UX. Cooperative “graceful cancel” stays out of scope unless required later.

- **Decision 2: Thin wrapper over existing script** — Keep `dallas_legistar_scraper.py` behavior as the core; expose a small **CLI/runner hook** invoked by the UI server so manifests and CSV output paths stay **`dallas_legistar_downloads/`** as today.

- **Decision 3: Audit persistence = append-only JSONL (or SQLite single table)** — One line per **run**: `run_id`, `started_at`, `ended_at`, `status` (`completed` / `stopped` / `failed`), `exit_code` if subprocess, optional `error_message`, `files_recorded`. Pick **JSONL** for simplest inspection without migrations; SQLite is acceptable if filtering grows.

- **Decision 4: File status = manifest + filesystem** — Treat each manifest row’s `saved_to` as authoritative; derive **present**/`missing`/ **HTTP failed** where the latter comes from augmenting scraper rows with `download_ok`/`error` (optional minimal change) or infer **present**/missing-only in v1 to limit scope.

- **Decision 5: Stack for UI** — One small **FastAPI + Jinja + HTMX or plain fetch**, or **Streamlit**. Prefer **single-process local app** binding `127.0.0.1` only; auth out of scope (same machine/trusted).

## Tasks:

- [x] 🟩 **Step 0: Scraping baseline (already in repo)**
  - [x] 🟩 `dallas_legistar_scraper.py` downloads PDFs/`View.ashx` and writes `dallas_legistar_downloads/download_manifest.csv` on completion or interruption (`finally`-backed CSV write).

- [x] 🟩 **Step 1: Runner contract**
  - [x] 🟩 `dallas_legistar_scraper.py` now exposes `run_scrape()`, `main_cli()`, and `raise SystemExit(main_cli())` when executed directly so supervisors see **0 / 1 / 130** exit semantics.
  - [x] 🟩 Audit `started` events snapshot `PLAYWRIGHT_BROWSERS_PATH` (empty string when unset).

- [x] 🟩 **Step 2: Supervisor + start/stop**
  - [x] 🟩 `dashboard/supervisor.py` launches the scraper with `subprocess.Popen`, tracks `active_run.json`, records PID, and refuses concurrent starts.
  - [x] 🟩 `stop()` issues **SIGTERM**, escalates to **SIGKILL**, and final audit status becomes `stopped`.
  - [x] 🟩 Dashboard buttons disable start while a live PID is tracked.

- [x] 🟩 **Step 3: Audit log**
  - [x] 🟩 Append-only `scraper_dashboard_data/audit_log.jsonl` captures paired `started`/`finished` payloads with duration, exit codes, manifest counts, and stderr/stdout tail snippets for non-success runs (logs under `scraper_dashboard_data/logs/`).
  - [x] 🟩 UI accordion lists newest runs first with status filter + expandable tails.

- [x] 🟩 **Step 4: File summary & status**
  - [x] 🟩 `/api/files` + `/api/overview` hydrate manifest rows, resolve relative paths from the project root, and mark `file_exists`.
  - [x] 🟩 **Manifest provenance:** `http_status`, `content_type`, `bytes_written`, `scraped_at`, `sha256`, Legistar IDs (`MANIFEST_METADATA_PLAN.md`).

- [x] 🟩 **Step 5: Minimal UI**
  - [x] 🟩 FastAPI + Jinja template at `dashboard/templates/index.html`, bound to `127.0.0.1:8765` via `python -m dashboard`.
  - [x] 🟩 Client polls `/api/overview` (~3.2s cadence) plus manual refresh triggers after start/stop.

## How to run

```bash
cd "/path/to/Sivic Scraper"
python3 -m venv .venv && source .venv/bin/activate   # once
pip install -r requirements.txt
playwright install chromium
python -m dashboard          # open http://127.0.0.1:8765
```

If Chromium cannot launch because a sandbox rewired `PLAYWRIGHT_BROWSERS_PATH`, prefix the dashboard command with `env -u PLAYWRIGHT_BROWSERS_PATH`.

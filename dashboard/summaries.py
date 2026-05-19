"""
Persist and batch-generate per-file summaries under ``scraper_dashboard_data/summaries.json``.
"""
from __future__ import annotations

import json
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Optional
from urllib.parse import unquote

from .content import build_summary, extract_text
from .supervisor import read_manifest_rows, summarize_files

DOWNLOADS_DIR = "dallas_legistar_downloads"


def utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def summaries_path(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / "summaries.json"


def load_store(project_root: Path) -> dict[str, Any]:
    path = summaries_path(project_root)
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def save_store(project_root: Path, store: dict[str, Any]) -> None:
    path = summaries_path(project_root)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(store, ensure_ascii=False, indent=2), encoding="utf-8")


def downloads_dir(project_root: Path) -> Path:
    return project_root / DOWNLOADS_DIR


def list_disk_pdfs(project_root: Path) -> list[Path]:
    folder = downloads_dir(project_root)
    if not folder.is_dir():
        return []
    return sorted(p for p in folder.glob("*.pdf") if p.is_file())


def prune_summary_store(project_root: Path) -> int:
    """
    Drop summary entries whose ``saved_to`` is not in the current manifest or
    download folder. Returns number of keys removed.
    """
    manifest_paths = {
        str(r.get("saved_to", "") or "")
        for r in read_manifest_rows(project_root)
        if r.get("saved_to")
    }
    root = project_root.resolve()
    disk_paths = {
        str(p.relative_to(root)) for p in list_disk_pdfs(project_root)
    }
    valid = manifest_paths | disk_paths

    store = load_store(project_root)
    removed = [k for k in store if k not in valid]
    if not removed:
        return 0
    for k in removed:
        del store[k]
    save_store(project_root, store)
    return len(removed)


def on_scrape_finished(project_root: Path) -> dict[str, Any]:
    """Called when scrape subprocess exits — refresh summary bookkeeping."""
    removed = prune_summary_store(project_root)
    return {"pruned_summary_keys": removed}


def build_summarizable_rows(project_root: Path) -> list[dict[str, Any]]:
    """
    Rows we can summarize: manifest entries that exist on disk, plus any PDF on
    disk not referenced by manifest (e.g. after filename collision fixes).
    """
    manifest_rows, _ = summarize_files(project_root)
    root = project_root.resolve()
    by_saved: dict[str, dict[str, Any]] = {}

    for row in manifest_rows:
        saved = str(row.get("saved_to", "") or "")
        if not saved or not row.get("file_exists"):
            continue
        by_saved[saved] = row

    for pdf in list_disk_pdfs(project_root):
        rel = str(pdf.relative_to(root))
        if rel in by_saved:
            continue
        by_saved[rel] = {
            "type": "On disk",
            "label": pdf.stem.replace("_", " "),
            "url": "",
            "saved_to": rel,
            "meeting_title": "",
            "meeting_detail_url": "",
            "source": "disk",
            "legistar_id": "",
            "saved_to_display": rel,
            "file_exists": True,
            "basename": pdf.name,
        }

    return list(by_saved.values())


def resolve_pdf_path(project_root: Path, saved_to: str) -> Path:
    path = Path(saved_to)
    if not path.is_absolute():
        path = project_root / path
    return path.resolve()


def summarize_manifest_row(
    project_root: Path, row: dict[str, Any], *, force: bool = False
) -> dict[str, Any]:
    """Build one summary record; does not persist (caller saves store)."""
    saved_to = str(row.get("saved_to", "") or "")
    meeting_title = str(row.get("meeting_title", "") or "")
    pdf_path = resolve_pdf_path(project_root, saved_to)

    base: dict[str, Any] = {
        "saved_to": saved_to,
        "meeting_title": meeting_title,
        "meeting_detail_url": str(row.get("meeting_detail_url", "") or ""),
        "label": str(row.get("label", "") or ""),
        "source": str(row.get("source", "") or ""),
        "legistar_id": str(row.get("legistar_id", "") or ""),
        "extracted_at": utc_now_iso(),
    }

    if not pdf_path.is_file():
        return {**base, "status": "error", "error": "file missing", "summary": "", "key_points": []}

    text, extract_status = extract_text(pdf_path)
    if extract_status.startswith("error"):
        return {
            **base,
            "status": "error",
            "error": extract_status.replace("error:", "", 1) or "read failed",
            "summary": "",
            "key_points": [],
        }
    if extract_status == "empty" or not text.strip():
        return {**base, "status": "empty", "summary": "", "key_points": []}

    built = build_summary(text)
    return {
        **base,
        "status": "ok",
        "summary": built["summary"],
        "key_points": built["key_points"],
    }


class SummaryJob:
    """Background batch summarization with coarse progress for the UI."""

    def __init__(self, project_root: Path):
        self.project_root = project_root.resolve()
        self._lock = threading.Lock()
        self._running = False
        self.progress: dict[str, Any] = {
            "running": False,
            "done": 0,
            "total": 0,
            "current": "",
        }

    def status(self) -> dict[str, Any]:
        with self._lock:
            return dict(self.progress)

    def summarize_one(self, saved_to: str, *, force: bool = False) -> dict[str, Any]:
        saved_to = unquote(saved_to)
        rows = read_manifest_rows(self.project_root)
        row = next((r for r in rows if r.get("saved_to") == saved_to), None)
        if row is None:
            raise FileNotFoundError(f"No manifest row for {saved_to}")

        store = load_store(self.project_root)
        if not force and saved_to in store and store[saved_to].get("status") in ("ok", "empty"):
            return store[saved_to]

        record = summarize_manifest_row(self.project_root, row, force=force)
        store[saved_to] = record
        save_store(self.project_root, store)
        return record

    def summarize_pending(self, *, force: bool = False) -> dict[str, Any]:
        with self._lock:
            if self._running:
                raise RuntimeError("summarize_already_running")

        rows = build_summarizable_rows(self.project_root)
        pending = []
        seen_saved: set[str] = set()
        store = load_store(self.project_root)
        for row in rows:
            saved = str(row.get("saved_to", "") or "")
            if not saved or saved in seen_saved:
                continue
            seen_saved.add(saved)
            if force or saved not in store:
                pending.append(row)
            elif store[saved].get("status") not in ("ok", "empty", "error"):
                pending.append(row)

        if not pending:
            return {
                "ok": True,
                "processed": 0,
                "message": "nothing pending",
                "summarizable_on_disk": len(rows),
            }

        thread = threading.Thread(
            target=self._run_batch,
            args=(pending, force),
            daemon=True,
        )
        with self._lock:
            self._running = True
            self.progress = {
                "running": True,
                "done": 0,
                "total": len(pending),
                "current": "",
            }
        thread.start()
        return {"ok": True, "queued": len(pending)}

    def _run_batch(self, rows: list[dict[str, Any]], force: bool) -> None:
        store = load_store(self.project_root)
        done = 0
        try:
            for row in rows:
                saved = str(row.get("saved_to", "") or "")
                with self._lock:
                    self.progress["current"] = saved

                record = summarize_manifest_row(self.project_root, row, force=force)
                store[saved] = record
                save_store(self.project_root, store)

                done += 1
                with self._lock:
                    self.progress["done"] = done
        finally:
            with self._lock:
                self._running = False
                self.progress["running"] = False
                self.progress["current"] = ""


def meeting_display_name(row: dict[str, Any]) -> str:
    title = (row.get("meeting_title") or "").strip()
    if title:
        return title
    source = (row.get("source") or "").strip()
    if source == "calendar":
        return "Calendar — unknown meeting"
    label = (row.get("label") or row.get("basename") or "").strip()
    return label or "Unknown meeting"


def join_manifest_summaries(
    project_root: Path,
    *,
    meeting_title_filter: Optional[str] = None,
) -> dict[str, Any]:
    """Manifest + on-disk PDFs enriched with summary store, grouped for the UI."""
    manifest_rows, manifest_stats = summarize_files(project_root)
    rows = build_summarizable_rows(project_root)
    store = load_store(project_root)

    enriched: list[dict[str, Any]] = []
    for row in rows:
        saved = str(row.get("saved_to", "") or "")
        summary_row = store.get(saved, {})
        item = {
            **row,
            "meeting_display": meeting_display_name(row),
            "summary_status": summary_row.get("status", "pending"),
            "summary": summary_row.get("summary", ""),
            "key_points": summary_row.get("key_points", []),
            "summary_error": summary_row.get("error", ""),
            "extracted_at": summary_row.get("extracted_at", ""),
        }
        if meeting_title_filter:
            needle = meeting_title_filter.lower()
            if needle not in item["meeting_display"].lower():
                continue
        enriched.append(item)

    groups: dict[str, list[dict[str, Any]]] = {}
    for item in enriched:
        key = item["meeting_display"]
        groups.setdefault(key, []).append(item)

    grouped = [
        {
            "meeting_title": title,
            "meeting_detail_url": next(
                (f.get("meeting_detail_url") for f in files if f.get("meeting_detail_url")),
                "",
            ),
            "files": files,
        }
        for title, files in sorted(groups.items(), key=lambda kv: kv[0].lower())
    ]

    summary_stats = {
        "with_summary": sum(1 for r in enriched if r["summary_status"] == "ok"),
        "empty": sum(1 for r in enriched if r["summary_status"] == "empty"),
        "pending": sum(1 for r in enriched if r["summary_status"] == "pending"),
        "error": sum(1 for r in enriched if r["summary_status"] == "error"),
        "summarizable_on_disk": len(rows),
    }

    return {
        "groups": grouped,
        "rows": enriched,
        "stats": {**manifest_stats, **summary_stats},
    }

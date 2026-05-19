"""
Runs ``dallas_legistar_scraper.py`` as a subprocess, persists active-run PID,
handles SIGTERM/SIGKILL shutdown, and appends audit events to JSONL.
"""
from __future__ import annotations

import csv
import json
import os
import signal
import threading
import time
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from subprocess import Popen, STDOUT
from typing import Any, Optional


def utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def manifest_row_count(project_root: Path) -> int:
    path = project_root / "dallas_legistar_downloads" / "download_manifest.csv"
    if not path.is_file():
        return 0
    try:
        with path.open(newline="", encoding="utf-8") as fh:
            return sum(1 for _ in csv.DictReader(fh))
    except Exception:
        return 0


MANIFEST_OPTIONAL_COLUMNS = (
    "meeting_title",
    "meeting_detail_url",
    "source",
    "legistar_id",
)


def normalize_manifest_row(row: dict[str, Any]) -> dict[str, Any]:
    """Backfill keys missing from pre-metadata manifests."""
    out = dict(row)
    for col in MANIFEST_OPTIONAL_COLUMNS:
        out.setdefault(col, "")
    return out


def read_manifest_rows(project_root: Path) -> list[dict[str, Any]]:
    path = project_root / "dallas_legistar_downloads" / "download_manifest.csv"
    if not path.is_file():
        return []
    with path.open(newline="", encoding="utf-8") as fh:
        return [normalize_manifest_row(r) for r in csv.DictReader(fh)]


def audit_entries_from_jsonl(audit_path: Path, limit_finished: int = 80) -> list[dict[str, Any]]:
    """Return newest ``finished`` audit rows first."""
    if not audit_path.is_file():
        return []
    lines = audit_path.read_text(encoding="utf-8").splitlines()
    finished: list[dict[str, Any]] = []
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if row.get("event") == "finished":
            finished.append(row)
            if len(finished) >= limit_finished:
                break
    return finished


def pid_alive(pid: int) -> bool:
    if pid <= 0:
        return False
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


@dataclass
class SupervisorState:
    running: bool
    run_id: Optional[str]
    pid: Optional[int]
    started_at: Optional[str]


class ScraperSupervisor:
    """Thread-safe subprocess lifecycle plus JSONL audit trail."""

    def __init__(
        self,
        project_root: Path,
        data_relative: Path = Path("scraper_dashboard_data"),
    ):
        self.project_root = project_root.resolve()
        self.data_dir = self.project_root / data_relative
        self.logs_dir = self.data_dir / "logs"
        self.active_path = self.data_dir / "active_run.json"
        self.audit_path = self.data_dir / "audit_log.jsonl"
        self._lock = threading.Lock()
        self._proc: Optional[Popen[Any]] = None
        self._stopped_by_user = False
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        self._reconcile_active_file()

    def _reconcile_active_file(self) -> None:
        """Clears stale active_run.json if its PID no longer exists."""
        if not self.active_path.is_file():
            return
        try:
            data = json.loads(self.active_path.read_text(encoding="utf-8"))
            pid = int(data.get("pid", 0))
        except Exception:
            self.active_path.unlink(missing_ok=True)
            return
        if not pid_alive(pid):
            self.active_path.unlink(missing_ok=True)

    def state(self) -> SupervisorState:
        with self._lock:
            handle_running = self._proc is not None and self._proc.poll() is None
            pid_from_handle = self._proc.pid if handle_running else None

        rid: Optional[str] = None
        started_at: Optional[str] = None
        pid_file = 0
        if self.active_path.is_file():
            try:
                data = json.loads(self.active_path.read_text(encoding="utf-8"))
                rid = data.get("run_id")
                started_at = data.get("started_at")
                pid_file = int(data.get("pid", 0))
            except Exception:
                self.active_path.unlink(missing_ok=True)
                return SupervisorState(False, None, None, None)

            ext_alive = bool(pid_file) and pid_alive(pid_file)
            running = bool(handle_running or ext_alive)
            display_pid = pid_from_handle if handle_running else (pid_file if ext_alive else None)

            # Clear stale bookkeeping if nothing is alive anymore.
            if pid_file and not running:
                self.active_path.unlink(missing_ok=True)
                return SupervisorState(False, None, None, None)

            return SupervisorState(running=running, run_id=rid, pid=display_pid, started_at=started_at)

        if handle_running:
            # active file absent but handle present — regenerate minimal metadata unavailable
            return SupervisorState(
                True, run_id=rid, pid=pid_from_handle, started_at=started_at
            )

        return SupervisorState(False, None, None, None)

    def _append_audit(self, payload: dict[str, Any]) -> None:
        line = json.dumps(payload, ensure_ascii=False)
        self.audit_path.parent.mkdir(parents=True, exist_ok=True)
        with self.audit_path.open("a", encoding="utf-8") as fh:
            fh.write(line + "\n")

    def _write_active(
        self, run_id: str, pid: int, started_at: str, log_rel: str
    ) -> None:
        body = {
            "run_id": run_id,
            "pid": pid,
            "started_at": started_at,
            "playwright_browsers_path": os.environ.get("PLAYWRIGHT_BROWSERS_PATH", ""),
            "scraped_via": str(self.script_path.relative_to(self.project_root)),
            "log_rel": log_rel,
        }
        self.active_path.parent.mkdir(parents=True, exist_ok=True)
        self.active_path.write_text(json.dumps(body, indent=2), encoding="utf-8")

    @property
    def script_path(self) -> Path:
        return self.project_root / "dallas_legistar_scraper.py"

    def start(self) -> dict[str, Any]:
        """Spawn scraper subprocess. Raises RuntimeError when a live run appears active."""
        with self._lock:
            handle_running = self._proc is not None and self._proc.poll() is None
            if handle_running:
                raise RuntimeError("already_running")

            if self.active_path.is_file():
                try:
                    prior = json.loads(self.active_path.read_text(encoding="utf-8"))
                    prior_pid = int(prior.get("pid", 0))
                except Exception:
                    prior_pid = 0
                if prior_pid and pid_alive(prior_pid):
                    raise RuntimeError("already_running")
                self.active_path.unlink(missing_ok=True)

            script = self.script_path
            if not script.is_file():
                raise FileNotFoundError(f"Missing scraper script: {script}")

            run_id = str(uuid.uuid4())
            started_at = utc_now_iso()
            log_path = self.logs_dir / f"{run_id}.log"
            log_handle = log_path.open("w", encoding="utf-8", buffering=1)

            self._proc = Popen(
                [os.sys.executable, str(script)],
                cwd=str(self.project_root),
                stdout=log_handle,
                stderr=STDOUT,
                text=True,
            )
            pid = int(self._proc.pid if self._proc.pid is not None else 0)
            self._stopped_by_user = False
            log_rel = str(log_path.relative_to(self.project_root))
            self._write_active(run_id, pid, started_at, log_rel)

            started_payload = {
                "event": "started",
                "run_id": run_id,
                "started_at": started_at,
                "pid": pid,
                "playwright_browsers_path": os.environ.get(
                    "PLAYWRIGHT_BROWSERS_PATH", ""
                ),
                "log_rel": log_rel,
            }
            self._append_audit(started_payload)

            monitor = threading.Thread(
                target=self._watch_process,
                args=(run_id, started_at, log_path, log_handle),
                daemon=True,
            )
            monitor.start()

            return {"ok": True, "run_id": run_id, "pid": pid}

    def _watch_process(self, run_id: str, started_at: str, log_path: Path, log_handle: Any) -> None:
        proc: Optional[Popen[Any]] = None
        with self._lock:
            proc = self._proc

        exit_code = 1
        try:
            if proc:
                exit_code = int(proc.wait())
        finally:
            try:
                log_handle.flush()
                log_handle.close()
            except Exception:
                pass

            duration_sec = round(
                (
                    datetime.now(tz=UTC)
                    - datetime.fromisoformat(started_at.replace("Z", "+00:00"))
                ).total_seconds(),
                2,
            )

            with self._lock:
                stopped_by_user = bool(self._stopped_by_user)
                self._stopped_by_user = False

            manifest_count = manifest_row_count(self.project_root)

            sig_termish = exit_code == 143 or (
                exit_code < 0 and abs(exit_code) == signal.SIGTERM
            )
            sig_killish = exit_code == 137 or (
                exit_code < 0 and abs(exit_code) == signal.SIGKILL
            )

            if stopped_by_user or sig_termish or sig_killish:
                norm_status = "stopped"
            elif exit_code == 130:
                norm_status = "stopped"
            elif exit_code == 0:
                norm_status = "completed"
            else:
                norm_status = "failed"

            finished_payload: dict[str, Any] = {
                "event": "finished",
                "run_id": run_id,
                "started_at": started_at,
                "ended_at": utc_now_iso(),
                "status": norm_status,
                "exit_code": exit_code,
                "duration_seconds": duration_sec,
                "files_recorded_manifest": manifest_count,
                "log_rel": str(log_path.relative_to(self.project_root)),
            }
            tail = self._read_tail(log_path)
            if norm_status != "completed" and tail:
                finished_payload["log_tail"] = tail

            with self._lock:
                self.active_path.unlink(missing_ok=True)
                if self._proc is proc:
                    self._proc = None

            self._append_audit(finished_payload)
            try:
                from .summaries import on_scrape_finished

                on_scrape_finished(self.project_root)
            except Exception:
                pass

    def _read_tail(self, path: Path, limit: int = 4000) -> str:
        if not path.is_file():
            return ""
        raw = path.read_bytes()
        snippet = raw[-limit:] if len(raw) > limit else raw
        return snippet.decode("utf-8", errors="replace")

    def stop(self) -> dict[str, Any]:
        """SIGTERM child; escalate to SIGKILL while still alive."""
        snapshot: Optional[dict[str, Any]] = None
        with self._lock:
            proc = self._proc
            controlled = proc is not None and proc.poll() is None

        if controlled:
            if proc is None or proc.pid is None:
                raise RuntimeError("internal_error")
            target_pid = int(proc.pid)
            with self._lock:
                self._stopped_by_user = True
            self._signal_shutdown(target_pid)
            return {"ok": True, "pid": target_pid}

        # Dashboard restarted mid-run — no subprocess handle — stop via PID snapshot.
        if self.active_path.is_file():
            try:
                snapshot = json.loads(self.active_path.read_text(encoding="utf-8"))
                pid_from_disk = int(snapshot.get("pid", 0))
            except Exception:
                pid_from_disk = 0
        else:
            pid_from_disk = 0

        if not pid_from_disk or not pid_alive(pid_from_disk):
            raise RuntimeError("not_running")

        with self._lock:
            self._stopped_by_user = True

        self._signal_shutdown(pid_from_disk)

        if snapshot:
            threading.Thread(
                target=self._finalize_external_stop,
                args=(snapshot,),
                daemon=True,
            ).start()

        return {"ok": True, "pid": pid_from_disk}

    def _finalize_external_stop(self, snapshot: dict[str, Any]) -> None:
        """Wait for orphaned PIDs (no in-memory ``Popen``) to exit, then finalize audit."""
        run_id = str(snapshot.get("run_id", ""))
        pid = int(snapshot.get("pid", 0))
        started_at = str(snapshot.get("started_at", utc_now_iso()))
        log_rel = str(snapshot.get("log_rel", ""))
        log_path = self.project_root / log_rel if log_rel else self.logs_dir / f"{run_id}.log"

        while pid and pid_alive(pid):
            time.sleep(0.35)

        started_dt = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
        duration_sec = round((datetime.now(tz=UTC) - started_dt).total_seconds(), 2)
        manifest_count = manifest_row_count(self.project_root)

        finished_payload: dict[str, Any] = {
            "event": "finished",
            "run_id": run_id or "unknown-run",
            "started_at": started_at,
            "ended_at": utc_now_iso(),
            "status": "stopped",
            "exit_code": -int(signal.SIGTERM),
            "duration_seconds": duration_sec,
            "files_recorded_manifest": manifest_count,
            "log_rel": str(log_path.relative_to(self.project_root)),
        }
        tail = self._read_tail(log_path)
        if tail:
            finished_payload["log_tail"] = tail

        with self._lock:
            self.active_path.unlink(missing_ok=True)
            self._stopped_by_user = False

        self._append_audit(finished_payload)
        try:
            from .summaries import on_scrape_finished

            on_scrape_finished(self.project_root)
        except Exception:
            pass

    def _signal_shutdown(self, pid: int, term_timeout: float = 8.0) -> None:
        try:
            os.kill(pid, signal.SIGTERM)
        except OSError:
            return

        deadline = time.monotonic() + term_timeout
        while time.monotonic() < deadline:
            if not pid_alive(pid):
                return
            time.sleep(0.2)

        try:
            os.kill(pid, signal.SIGKILL)
        except OSError:
            pass


def summarize_files(project_root: Path) -> tuple[list[dict[str, Any]], dict[str, int]]:
    rows = read_manifest_rows(project_root)
    root = project_root.resolve()
    summary = []
    for row in sorted(rows, key=lambda r: r.get("saved_to", "")):
        saved = row.get("saved_to", "") or ""
        path = Path(saved)
        if not path.is_absolute():
            path = root / path
        exists = path.is_file()
        summary.append(
            {
                **row,
                "saved_to_display": saved,
                "file_exists": exists,
                "basename": path.name if path.name else "",
            }
        )

    stats = {
        "rows": len(summary),
        "present": sum(1 for r in summary if r["file_exists"]),
    }
    stats["missing"] = stats["rows"] - stats["present"]
    return summary, stats

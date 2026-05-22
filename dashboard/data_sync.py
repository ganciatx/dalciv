"""
Background refresh of Socrata-backed JSON caches (stale-while-revalidate).

API handlers serve the last on-disk payload immediately and schedule refresh
when TTL expires. A daemon thread runs periodic sync jobs when enabled.
"""
from __future__ import annotations

import json
import logging
import os
import threading
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Callable, Optional

logger = logging.getLogger(__name__)

JOB_POLICE = "police_active_calls"
JOB_FINANCE = "campaign_finance"
JOB_VOTING = "council_voting"
JOB_BUDGET = "city_budget"

SYNC_STATE_FILE = "sync_state.json"
DEFAULT_TICK_SEC = 15

_scheduler: Optional["DataSyncScheduler"] = None
_scheduler_lock = threading.Lock()


def utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def sync_enabled() -> bool:
    return os.environ.get("DATA_SYNC_ENABLED", "1").strip().lower() in (
        "1",
        "true",
        "yes",
        "on",
    )


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        return max(1, int(raw))
    except ValueError:
        return default


def sync_state_path(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / SYNC_STATE_FILE


def load_sync_state(project_root: Path) -> dict[str, Any]:
    path = sync_state_path(project_root)
    if not path.is_file():
        return {"jobs": {}, "updated_at": None}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {"jobs": {}, "updated_at": None}
    except Exception:
        return {"jobs": {}, "updated_at": None}


def save_sync_state(project_root: Path, state: dict[str, Any]) -> None:
    path = sync_state_path(project_root)
    path.parent.mkdir(parents=True, exist_ok=True)
    state["updated_at"] = utc_now_iso()
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def _update_job_state(
    project_root: Path,
    job_id: str,
    *,
    status: str,
    duration_ms: Optional[int] = None,
    row_count: Optional[int] = None,
    error: Optional[str] = None,
) -> None:
    state = load_sync_state(project_root)
    jobs = state.setdefault("jobs", {})
    entry = jobs.setdefault(job_id, {})
    entry["last_status"] = status
    entry["updated_at"] = utc_now_iso()
    if status == "running":
        entry["last_started_at"] = utc_now_iso()
    if status in ("success", "error"):
        entry["last_finished_at"] = utc_now_iso()
    if duration_ms is not None:
        entry["duration_ms"] = duration_ms
    if row_count is not None:
        entry["row_count"] = row_count
    if error:
        entry["last_error"] = error[:500]
    elif status == "success":
        entry.pop("last_error", None)
    save_sync_state(project_root, state)


@dataclass(frozen=True)
class SyncJob:
    job_id: str
    interval_sec: int
    run: Callable[[Path], dict[str, Any]]


def _run_police(project_root: Path) -> dict[str, Any]:
    from .police_calls import refresh_response_cache

    payload = refresh_response_cache(project_root, limit=500, geocode_budget=40)
    return {"row_count": len(payload.get("calls") or [])}


def _run_finance(project_root: Path) -> dict[str, Any]:
    from .campaign_finance import refresh_cache

    doc = refresh_cache(project_root)
    return {"row_count": len(doc.get("rows") or [])}


def _run_voting(project_root: Path) -> dict[str, Any]:
    from .council_voting import refresh_cache, refresh_voting_summary_sidecar

    doc = refresh_cache(project_root)
    refresh_voting_summary_sidecar(project_root)
    return {"row_count": len(doc.get("rows") or [])}


def _run_budget(project_root: Path) -> dict[str, Any]:
    from .city_budget import refresh_all_budget_caches

    return refresh_all_budget_caches(project_root)


def build_jobs() -> list[SyncJob]:
    return [
        SyncJob(
            JOB_POLICE,
            _env_int("POLICE_SYNC_INTERVAL_SEC", 90),
            _run_police,
        ),
        SyncJob(
            JOB_FINANCE,
            _env_int("FINANCE_SYNC_INTERVAL_SEC", 3600),
            _run_finance,
        ),
        SyncJob(
            JOB_VOTING,
            _env_int("VOTING_SYNC_INTERVAL_SEC", 86400),
            _run_voting,
        ),
        SyncJob(
            JOB_BUDGET,
            _env_int("BUDGET_SYNC_INTERVAL_SEC", 86400),
            _run_budget,
        ),
    ]


def warming_rows_document(dataset: str) -> dict[str, Any]:
    return {
        "fetched_at": None,
        "row_count": 0,
        "rows": [],
        "meta": {
            "cache_warming": True,
            "dataset": dataset,
            "source": "data_sync",
        },
    }


class DataSyncScheduler:
    def __init__(self, project_root: Path) -> None:
        self.project_root = project_root
        self.jobs = {j.job_id: j for j in build_jobs()}
        self._job_locks: dict[str, threading.Lock] = {
            jid: threading.Lock() for jid in self.jobs
        }
        self._stop = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._pending: set[str] = set()
        self._pending_lock = threading.Lock()

    def job_is_due(self, job_id: str) -> bool:
        state = load_sync_state(self.project_root)
        job_state = (state.get("jobs") or {}).get(job_id) or {}
        finished = job_state.get("last_finished_at") or job_state.get("last_started_at")
        if not finished:
            return True
        try:
            ts = datetime.fromisoformat(str(finished).replace("Z", "+00:00"))
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=UTC)
            age = (datetime.now(tz=UTC) - ts).total_seconds()
        except Exception:
            return True
        return age >= self.jobs[job_id].interval_sec

    def schedule(self, job_id: str, *, force: bool = False) -> None:
        if not sync_enabled() or job_id not in self.jobs:
            return
        with self._pending_lock:
            if job_id in self._pending and not force:
                return
            self._pending.add(job_id)

        def _runner() -> None:
            try:
                if force or self.job_is_due(job_id):
                    self.run_job(job_id)
            finally:
                with self._pending_lock:
                    self._pending.discard(job_id)

        threading.Thread(target=_runner, name=f"sync-{job_id}", daemon=True).start()

    def run_job(self, job_id: str) -> dict[str, Any]:
        job = self.jobs.get(job_id)
        if not job:
            return {"ok": False, "error": "unknown job"}
        lock = self._job_locks[job_id]
        if not lock.acquire(blocking=False):
            return {"ok": False, "error": "already running"}
        started = time.monotonic()
        _update_job_state(self.project_root, job_id, status="running")
        try:
            result = job.run(self.project_root)
            duration_ms = int((time.monotonic() - started) * 1000)
            _update_job_state(
                self.project_root,
                job_id,
                status="success",
                duration_ms=duration_ms,
                row_count=result.get("row_count"),
            )
            return {"ok": True, **result, "duration_ms": duration_ms}
        except Exception as exc:
            duration_ms = int((time.monotonic() - started) * 1000)
            logger.exception("sync job %s failed", job_id)
            _update_job_state(
                self.project_root,
                job_id,
                status="error",
                duration_ms=duration_ms,
                error=str(exc),
            )
            return {"ok": False, "error": str(exc), "duration_ms": duration_ms}
        finally:
            lock.release()

    def _loop(self) -> None:
        tick = _env_int("DATA_SYNC_TICK_SEC", DEFAULT_TICK_SEC)
        while not self._stop.wait(tick):
            for job_id in self.jobs:
                if self._stop.is_set():
                    break
                if self.job_is_due(job_id):
                    self.schedule(job_id)

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(
            target=self._loop, name="data-sync-scheduler", daemon=True
        )
        self._thread.start()
        for job_id in self.jobs:
            self.schedule(job_id, force=True)

    def stop(self) -> None:
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=5.0)
            self._thread = None


def get_scheduler(project_root: Path) -> DataSyncScheduler:
    global _scheduler
    with _scheduler_lock:
        if _scheduler is None:
            _scheduler = DataSyncScheduler(project_root)
        return _scheduler


def schedule_refresh(
    project_root: Path,
    job_id: str,
    *,
    force: bool = False,
) -> None:
    if not sync_enabled():
        return
    get_scheduler(project_root).schedule(job_id, force=force)


def maybe_schedule_stale(
    project_root: Path,
    job_id: str,
    cached: dict[str, Any],
    stale_fn: Callable[[dict[str, Any]], bool],
) -> None:
    if stale_fn(cached):
        schedule_refresh(project_root, job_id)


def attach_cache_meta(
    cached: dict[str, Any],
    *,
    job_id: str,
    stale: bool,
) -> dict[str, Any]:
    meta = cached.setdefault("meta", {})
    if not isinstance(meta, dict):
        meta = {}
        cached["meta"] = meta
    meta["from_disk_cache"] = True
    meta["cache_stale"] = stale
    if stale and sync_enabled():
        meta["background_refresh"] = True
    return cached


def start_scheduler(project_root: Path) -> None:
    if sync_enabled():
        get_scheduler(project_root).start()


def stop_scheduler() -> None:
    global _scheduler
    with _scheduler_lock:
        if _scheduler is not None:
            _scheduler.stop()
            _scheduler = None


def sync_status_for_command(project_root: Path) -> dict[str, Any]:
    state = load_sync_state(project_root)
    jobs_out: dict[str, Any] = {}
    sched = None
    with _scheduler_lock:
        sched = _scheduler
    for job in build_jobs():
        js = (state.get("jobs") or {}).get(job.job_id) or {}
        jobs_out[job.job_id] = {
            "interval_sec": job.interval_sec,
            "last_status": js.get("last_status"),
            "last_started_at": js.get("last_started_at"),
            "last_finished_at": js.get("last_finished_at"),
            "duration_ms": js.get("duration_ms"),
            "row_count": js.get("row_count"),
            "last_error": js.get("last_error"),
            "due": sched.job_is_due(job.job_id) if sched else None,
        }
    return {
        "enabled": sync_enabled(),
        "tick_sec": _env_int("DATA_SYNC_TICK_SEC", DEFAULT_TICK_SEC),
        "state_path": str(sync_state_path(project_root)),
        "jobs": jobs_out,
    }

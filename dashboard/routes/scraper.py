"""Legistar scraper supervisor APIs."""
from __future__ import annotations

from typing import Any, Optional, TYPE_CHECKING
from urllib.parse import unquote

from fastapi import Depends, HTTPException, Query

from ..ops_auth import require_ops_token
from ..supervisor import audit_entries_from_jsonl, summarize_files
from ..summaries import join_manifest_summaries

if TYPE_CHECKING:
    from fastapi import FastAPI

    from .deps import RouteDeps


def register(app: FastAPI, deps: RouteDeps) -> None:
    sup = deps.supervisor
    root = deps.project_root
    # Mutating scraper controls require OPS_API_TOKEN (security audit C1).
    ops_auth = Depends(require_ops_token)

    @app.get("/api/state")
    async def api_state() -> dict[str, Any]:
        st = sup.state()
        return {
            "running": st.running,
            "run_id": st.run_id,
            "pid": st.pid,
            "started_at": st.started_at,
            "scraper_enabled": deps.scraper_enabled,
        }

    @app.post("/api/start", dependencies=[ops_auth])
    async def api_start() -> dict[str, Any]:
        if not deps.scraper_enabled:
            raise HTTPException(
                status_code=403,
                detail="Legistar scraper is disabled on this deployment (SCRAPER_ENABLED=0).",
            )
        try:
            return sup.start()
        except FileNotFoundError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc
        except RuntimeError as exc:
            if str(exc) == "already_running":
                raise HTTPException(status_code=409, detail=str(exc)) from exc
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/stop", dependencies=[ops_auth])
    async def api_stop() -> dict[str, Any]:
        if not deps.scraper_enabled:
            raise HTTPException(
                status_code=403,
                detail="Legistar scraper is disabled on this deployment (SCRAPER_ENABLED=0).",
            )
        try:
            return sup.stop()
        except RuntimeError as exc:
            if str(exc) == "not_running":
                raise HTTPException(status_code=409, detail=str(exc)) from exc
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.get("/api/audit")
    async def api_audit(
        limit: int = 100,
        status: Optional[str] = None,
    ) -> dict[str, Any]:
        rows = audit_entries_from_jsonl(sup.audit_path, limit_finished=max(1, min(limit, 500)))
        allowed = {"completed", "stopped", "failed"}
        if status:
            norm = status.lower()
            if norm not in allowed:
                raise HTTPException(status_code=400, detail=f"Unsupported status '{status}'.")
            rows = [r for r in rows if str(r.get("status")) == norm]
        return {"audit": rows}

    @app.get("/api/files")
    async def api_files(limit: int = 500) -> dict[str, Any]:
        cap = max(1, min(limit, 3000))
        rows, stats = summarize_files(root)
        truncated = len(rows) > cap
        if truncated:
            rows = rows[:cap]
        return {"rows": rows, "stats": stats, "truncated": truncated}

    @app.get("/api/summaries")
    async def api_summaries(
        meeting_title: Optional[str] = Query(None, description="Case-insensitive substring filter"),
    ) -> dict[str, Any]:
        return join_manifest_summaries(
            root,
            meeting_title_filter=meeting_title,
        )

    @app.get("/api/summarize/status")
    async def api_summarize_status() -> dict[str, Any]:
        return deps.summary_job.status()

    @app.post("/api/summarize", dependencies=[ops_auth])
    async def api_summarize(force: bool = False) -> dict[str, Any]:
        try:
            return deps.summary_job.summarize_pending(force=force)
        except RuntimeError as exc:
            if str(exc) == "summarize_already_running":
                raise HTTPException(status_code=409, detail=str(exc)) from exc
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/summarize/one", dependencies=[ops_auth])
    async def api_summarize_one(
        saved_to: str = Query(..., description="Manifest ``saved_to`` path"),
        force: bool = False,
    ) -> dict[str, Any]:
        try:
            record = deps.summary_job.summarize_one(unquote(saved_to), force=force)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return {"ok": True, "record": record}

    @app.get("/api/overview")
    async def api_overview(limit_audit: int = 80, file_limit: int = 600) -> dict[str, Any]:
        st = sup.state()
        audits = audit_entries_from_jsonl(
            sup.audit_path,
            limit_finished=max(1, min(limit_audit, 500)),
        )
        manifest_rows, stats = summarize_files(root)
        fcap = max(1, min(file_limit, 3000))
        truncated = len(manifest_rows) > fcap
        if truncated:
            manifest_rows = manifest_rows[:fcap]

        summaries = join_manifest_summaries(root)

        return {
            "state": {
                "running": st.running,
                "run_id": st.run_id,
                "pid": st.pid,
                "started_at": st.started_at,
            },
            "audit": audits,
            "manifest": {
                "rows": manifest_rows,
                "stats": stats,
                "truncated": truncated,
            },
            "summaries": summaries,
            "summarize_job": deps.summary_job.status(),
            "paths": {
                "project_root": str(root),
                "downloads": str(root / "dallas_legistar_downloads"),
                "audit_log": str(sup.audit_path),
                "summaries_store": str(root / "scraper_dashboard_data" / "summaries.json"),
            },
        }

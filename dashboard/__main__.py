"""
Run the supervisor UI::

    python -m dashboard

Production (Docker / Hostinger VPS) reads ``DASHBOARD_HOST`` and ``DASHBOARD_PORT``.
"""
from __future__ import annotations

import os

import uvicorn


def _forwarded_allow_ips() -> str | list[str]:
    raw = os.environ.get("FORWARDED_ALLOW_IPS", "127.0.0.1,172.16.0.0/12")
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    return parts if len(parts) != 1 else parts[0]


def main() -> None:
    host = os.environ.get("DASHBOARD_HOST", "127.0.0.1")
    port = int(os.environ.get("DASHBOARD_PORT", "8765"))
    uvicorn.run(
        "dashboard.app:app",
        host=host,
        port=port,
        reload=False,
        proxy_headers=True,
        forwarded_allow_ips=_forwarded_allow_ips(),
    )


if __name__ == "__main__":
    main()

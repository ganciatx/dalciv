"""
Run the supervisor UI::

    python -m dashboard

Production (Docker / Hostinger VPS) reads ``DASHBOARD_HOST`` and ``DASHBOARD_PORT``.
"""
from __future__ import annotations

import os

import uvicorn


def main() -> None:
    host = os.environ.get("DASHBOARD_HOST", "127.0.0.1")
    port = int(os.environ.get("DASHBOARD_PORT", "8765"))
    uvicorn.run(
        "dashboard.app:app",
        host=host,
        port=port,
        reload=False,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )


if __name__ == "__main__":
    main()

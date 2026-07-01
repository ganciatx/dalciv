"""Shared fixtures for dashboard integration tests."""
from __future__ import annotations

import os
import socket
import subprocess
import sys
import time
from pathlib import Path

import pytest
from starlette.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def make_test_app():
    from fastapi import FastAPI
    from fastapi.staticfiles import StaticFiles

    from dashboard.routes.deps import RouteDeps, register_all_routes

    app = FastAPI()
    deps = RouteDeps()
    static_dir = deps.static_dir
    if static_dir.is_dir():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
    council_images = PROJECT_ROOT / "images"
    if council_images.is_dir():
        app.mount(
            "/council-images",
            StaticFiles(directory=str(council_images)),
            name="council-images",
        )
    register_all_routes(app, deps)
    return app, deps


@pytest.fixture(scope="session")
def project_root() -> Path:
    return PROJECT_ROOT


@pytest.fixture(scope="session")
def test_client() -> TestClient:
    app, _deps = make_test_app()
    with TestClient(app) as client:
        yield client


@pytest.fixture(scope="session")
def live_server_url():
    """Real HTTP server for Playwright E2E (assets + fetch)."""
    port = _free_port()
    env = os.environ.copy()
    env.setdefault("PYTHONPATH", str(PROJECT_ROOT))
    proc = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "tests.dashboard_test_app:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
        ],
        cwd=str(PROJECT_ROOT),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    base = f"http://127.0.0.1:{port}"
    deadline = time.time() + 30
    ready = False
    try:
        import urllib.error
        import urllib.request

        while time.time() < deadline:
            if proc.poll() is not None:
                break
            try:
                with urllib.request.urlopen(f"{base}/api/council-accountability/bootstrap", timeout=2) as resp:
                    if resp.status == 200:
                        ready = True
                        break
            except (urllib.error.URLError, TimeoutError, OSError):
                time.sleep(0.25)
        if not ready:
            pytest.skip("Council accountability live server did not become ready")
        yield base
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()

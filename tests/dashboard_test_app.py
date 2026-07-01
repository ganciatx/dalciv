"""Minimal FastAPI app for tests (no background scheduler)."""
from __future__ import annotations

from tests.conftest import make_test_app

app, _deps = make_test_app()

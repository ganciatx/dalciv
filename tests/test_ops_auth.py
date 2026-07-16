"""Ops token gate for mutating / command routes (security audit C1)."""
from __future__ import annotations

import os

import pytest
from starlette.testclient import TestClient

from tests.conftest import make_test_app

OPS_TOKEN = "test-ops-token-not-for-production-use"


@pytest.fixture()
def ops_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("OPS_API_TOKEN", OPS_TOKEN)
    app, _deps = make_test_app()
    with TestClient(app) as client:
        yield client


@pytest.fixture()
def no_token_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("OPS_API_TOKEN", raising=False)
    app, _deps = make_test_app()
    with TestClient(app) as client:
        yield client


def test_command_api_requires_token(ops_client: TestClient) -> None:
    assert ops_client.get("/api/command").status_code == 401
    ok = ops_client.get("/api/command", headers={"X-Ops-Token": OPS_TOKEN})
    assert ok.status_code == 200
    assert "runtime" in ok.json()


def test_command_api_accepts_bearer(ops_client: TestClient) -> None:
    res = ops_client.get(
        "/api/command",
        headers={"Authorization": f"Bearer {OPS_TOKEN}"},
    )
    assert res.status_code == 200


def test_command_page_unlock_without_token(ops_client: TestClient) -> None:
    res = ops_client.get("/command")
    assert res.status_code == 401
    assert "OPS_API_TOKEN" in res.text


def test_command_page_with_query_token(ops_client: TestClient) -> None:
    res = ops_client.get(f"/command?ops_token={OPS_TOKEN}")
    assert res.status_code == 200
    assert "Command" in res.text or "command" in res.text.lower()


def test_mutating_routes_require_token(ops_client: TestClient) -> None:
    for path in ("/api/start", "/api/stop", "/api/summarize"):
        assert ops_client.post(path).status_code == 401
    analyze = ops_client.post(
        "/api/meeting-recap/analyze",
        params={"date": "2024-01-01"},
    )
    assert analyze.status_code == 401


def test_ops_routes_fail_closed_when_unset(no_token_client: TestClient) -> None:
    assert no_token_client.get("/api/command").status_code == 503
    assert no_token_client.post("/api/summarize").status_code == 503
    unlock = no_token_client.get("/command")
    assert unlock.status_code == 503


def test_public_civic_routes_remain_open(ops_client: TestClient) -> None:
    # Smoke: auth gate must not blanket-lock public read APIs.
    res = ops_client.get("/api/state")
    assert res.status_code == 200

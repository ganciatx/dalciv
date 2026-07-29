"""Council accountability HTTP API and HTML shell."""
from __future__ import annotations

import re


def test_bootstrap_api_returns_members_and_cache_headers(test_client):
    res = test_client.get("/api/council-accountability/bootstrap")
    assert res.status_code == 200
    body = res.json()
    assert "directory" in body
    assert len(body["directory"]["members"]) > 0
    assert "private" in res.headers.get("cache-control", "")


def test_directory_api_matches_bootstrap_members(test_client):
    bootstrap = test_client.get("/api/council-accountability/bootstrap").json()
    directory = test_client.get("/api/council-accountability/directory").json()
    assert len(directory["members"]) == len(bootstrap["directory"]["members"])


def test_directory_api_only_lists_active_members_by_district(test_client):
    res = test_client.get("/api/council-accountability/directory")
    assert res.status_code == 200
    members = res.json()["members"]
    assert members
    assert all(m.get("council_status") == "active" for m in members)
    districts = [m.get("district_num") or 0 for m in members]
    assert districts == sorted(districts)


def test_member_profile_known_slug(test_client):
    res = test_client.get(
        "/api/council-accountability/member",
        params={"member": "chad-west"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body.get("found") is True
    assert body["member"]["id"] == "chad-west"
    assert "display_name" in body["member"]


def test_member_profile_unknown_slug(test_client):
    res = test_client.get(
        "/api/council-accountability/member",
        params={"member": "not-a-real-member-slug"},
    )
    assert res.status_code == 200
    assert res.json().get("found") is False


def test_spa_page_embeds_bootstrap_script(test_client):
    res = test_client.get("/council-accountability")
    if res.status_code == 404:
        import pytest

        pytest.skip("council-accountability unpublished (public: false)")
    if res.status_code == 503:
        import pytest

        pytest.skip("council-accountability frontend not built")
    assert res.status_code == 200
    html = res.text
    assert 'id="ca-bootstrap"' in html
    assert "window.__CA_BOOTSTRAP__=" in html
    assert re.search(r"window\.__CA_BOOTSTRAP__=\{", html)
    assert "member-search" in html
    assert 'data-overlap-filter="contributors"' in html


def test_transactions_api_accepts_member_param(test_client):
    all_res = test_client.get("/api/campaign-finance/transactions", params={"limit": 1})
    assert all_res.status_code == 200
    all_total = all_res.json()["meta"]["total"]

    member_res = test_client.get(
        "/api/campaign-finance/transactions",
        params={"limit": 1, "member": "chad-west"},
    )
    assert member_res.status_code == 200
    member_total = member_res.json()["meta"]["total"]
    assert member_total < all_total
    assert member_total > 0


def test_static_assets_served(test_client):
    res = test_client.get("/council-accountability")
    if res.status_code == 404:
        import pytest

        pytest.skip("council-accountability unpublished (public: false)")
    if res.status_code == 503:
        import pytest

        pytest.skip("council-accountability frontend not built")
    match = re.search(r'src="(/static/council-accountability/assets/[^"]+\.js)"', res.text)
    assert match is not None
    asset = test_client.get(match.group(1))
    assert asset.status_code == 200
    assert "javascript" in asset.headers.get("content-type", "")

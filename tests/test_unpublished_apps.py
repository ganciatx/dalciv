"""Unpublished apps (public: false) must not expose page routes."""
from __future__ import annotations


def test_council_accountability_page_unpublished(test_client):
    assert test_client.get("/council-accountability").status_code == 404
    assert test_client.get("/campaign-finance").status_code == 404


def test_meeting_recap_page_unpublished(test_client):
    assert test_client.get("/meeting-recap").status_code == 404


def test_unpublished_apps_omitted_from_spa_and_catalog():
    from dashboard.registry import catalog_apps, load_registry, spa_apps

    load_registry.cache_clear()
    spa_slugs = {a["slug"] for a in spa_apps()}
    catalog_slugs = {a["slug"] for a in catalog_apps()}
    assert "council-accountability" not in spa_slugs
    assert "meeting-recap" not in spa_slugs
    assert "council-accountability" not in catalog_slugs
    assert "meeting-recap" not in catalog_slugs

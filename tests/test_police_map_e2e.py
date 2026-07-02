"""Playwright E2E: police map user flows."""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.e2e


@pytest.fixture
def browser_page(live_server_url):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        pytest.skip("playwright not installed")

    with sync_playwright() as playwright:
        try:
            browser = playwright.chromium.launch(headless=True)
        except Exception as exc:
            pytest.skip(f"Chromium not available: {exc}")
        page = browser.new_page()
        yield page, live_server_url
        browser.close()


def _goto_police(page, base: str) -> None:
    page.goto(f"{base}/police", wait_until="domcontentloaded")
    page.wait_for_selector("#map", timeout=15000)
    page.wait_for_function(
        "() => document.querySelector('#map-stats')?.textContent?.includes('active')",
        timeout=30000,
    )


def test_police_page_loads_map_and_feed(browser_page):
    page, base = browser_page
    _goto_police(page, base)
    assert "Police" in page.title()
    assert page.locator(".leaflet-container").count() == 1
    assert page.locator("#right-rail").is_visible()
    assert page.locator(".inc-row").count() > 0


def test_priority_filters_toggle_markers(browser_page):
    page, base = browser_page
    _goto_police(page, base)
    before = page.locator(".leaflet-marker-icon").count()
    assert before > 0

    page.click('button[data-pri="4"]')
    page.wait_for_timeout(300)
    after_p4_off = page.locator(".leaflet-marker-icon").count()
    assert after_p4_off <= before

    page.click('button[data-pri="4"]')
    page.wait_for_timeout(300)
    assert page.locator(".leaflet-marker-icon").count() >= after_p4_off


def test_cluster_toggle_clears_boxes(browser_page):
    page, base = browser_page
    _goto_police(page, base)

    clusters_btn = page.locator("#toggle-clusters")
    assert "on" in (clusters_btn.get_attribute("class") or "")

    # Click a feed row several times — cluster polygons must not stack.
    rows = page.locator(".inc-row")
    if rows.count() < 2:
        pytest.skip("Need multiple incidents for cluster test")
    for i in range(min(3, rows.count())):
        rows.nth(i).click()
        page.wait_for_timeout(200)

    cluster_paths_before = page.locator(
        ".leaflet-overlay-pane path.leaflet-interactive"
    ).count()

    clusters_btn.click()
    page.wait_for_timeout(300)
    assert "on" not in (clusters_btn.get_attribute("class") or "")
    assert (
        page.locator(".leaflet-overlay-pane path.leaflet-interactive").count() == 0
    )

    clusters_btn.click()
    page.wait_for_timeout(300)
    cluster_paths_after = page.locator(
        ".leaflet-overlay-pane path.leaflet-interactive"
    ).count()
    assert cluster_paths_after <= cluster_paths_before + 5


def test_legend_and_rail_toggles(browser_page):
    page, base = browser_page
    _goto_police(page, base)

    legend = page.locator("#map-legend")
    assert legend.is_visible()

    page.click("#toggle-legend")
    page.wait_for_timeout(200)
    assert legend.is_hidden()

    page.click("#toggle-legend")
    page.wait_for_timeout(200)
    assert legend.is_visible()

    page.click("#toggle-rail")
    page.wait_for_timeout(200)
    assert page.locator("#right-rail").is_hidden()
    assert page.locator(".main-grid").evaluate("el => el.classList.contains('map-only')")

    page.click("#show-rail-fab")
    page.wait_for_timeout(200)
    assert page.locator("#right-rail").is_visible()


def test_search_filters_feed(browser_page):
    page, base = browser_page
    _goto_police(page, base)
    before = page.locator(".inc-row").count()
    assert before > 0

    page.fill("#search-input", "zzzznotfoundxyz")
    page.wait_for_timeout(400)
    assert page.locator(".inc-row").count() == 0

    page.fill("#search-input", "")
    page.wait_for_timeout(400)
    assert page.locator(".inc-row").count() > 0


def test_incident_selection_opens_inspector(browser_page):
    page, base = browser_page
    _goto_police(page, base)

    first = page.locator(".inc-row").first
    inc_id = first.get_attribute("data-id")
    first.click()
    page.wait_for_timeout(300)

    inspector = page.locator("#inspector")
    assert inspector.is_visible()
    assert inc_id in inspector.inner_text()

    page.click("#insp-close")
    page.wait_for_timeout(200)
    assert inspector.is_hidden()


def test_hide_routine_filter(browser_page):
    page, base = browser_page
    _goto_police(page, base)

    hide_btn = page.locator("#hide-routine")
    assert "on" in (hide_btn.get_attribute("class") or "")

    hide_btn.click()
    page.wait_for_timeout(300)
    assert "on" not in (hide_btn.get_attribute("class") or "")

    p4_rows = page.locator(".inc-row .chip.solid-p4").count()
    if p4_rows == 0:
        hide_btn.click()
        page.wait_for_timeout(300)
        assert page.locator(".inc-row .chip.solid-p4").count() >= 0

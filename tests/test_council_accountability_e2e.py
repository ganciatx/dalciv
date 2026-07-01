"""Playwright E2E: council accountability user flows."""
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


def test_overview_loads_member_cards_without_spinner(browser_page):
    page, base = browser_page
    page.goto(f"{base}/council-accountability", wait_until="domcontentloaded")
    page.wait_for_selector("#member-cards .info-card.member-card", timeout=15000)
    assert page.locator("#member-cards .info-card.member-card").count() > 5
    assert "Council" in page.title()


def test_member_search_filters_cards(browser_page):
    page, base = browser_page
    page.goto(f"{base}/council-accountability", wait_until="domcontentloaded")
    page.wait_for_selector("#member-search")
    visible_before = page.locator(
        "#member-cards .info-card:not(.is-hidden-by-search)"
    ).count()
    assert visible_before > 1

    page.fill("#member-search", "zzzznotfound")
    page.wait_for_timeout(100)
    assert (
        page.locator("#member-cards .info-card:not(.is-hidden-by-search)").count()
        == 0
    )

    page.fill("#member-search", "west")
    page.wait_for_timeout(100)
    assert (
        page.locator("#member-cards .info-card:not(.is-hidden-by-search)").count()
        >= 1
    )


def test_lobbying_tab_donor_filter_default(browser_page):
    page, base = browser_page
    page.goto(f"{base}/council-accountability", wait_until="domcontentloaded")
    page.click('button[data-tab="lobbying"]')
    page.wait_for_selector("#lobby-overlap-grid .overlap-card", timeout=15000)

    contributors_btn = page.locator(
        'button[data-overlap-filter="contributors"]'
    )
    assert "on" in (contributors_btn.get_attribute("class") or "")

    donor_badges = page.locator(
        "#lobby-overlap-grid .overlap-badge.money.donor, "
        "#lobby-overlap-grid .overlap-badge.money.both"
    )
    vendor_only = page.locator(
        "#lobby-overlap-grid .overlap-badge.money.vendor"
    ).filter(has_not=page.locator(".both"))
    assert donor_badges.count() > 0
    assert vendor_only.count() == 0


def test_lobbying_tab_vendor_filter(browser_page):
    page, base = browser_page
    page.goto(f"{base}/council-accountability", wait_until="domcontentloaded")
    page.click('button[data-tab="lobbying"]')
    page.wait_for_selector("#lobby-overlap-grid .overlap-card", timeout=15000)

    page.click('button[data-overlap-filter="vendors"]')
    page.wait_for_timeout(200)
    assert page.locator("#lobby-overlap-grid .overlap-badge.money.vendor").count() > 0
    assert page.locator("#lobby-overlap-grid .overlap-badge.money.donor").count() == 0


def test_lobbying_tab_scoped_to_selected_member(browser_page):
    page, base = browser_page
    page.goto(f"{base}/council-accountability", wait_until="domcontentloaded")
    page.wait_for_selector("#filter-member")
    page.select_option("#filter-member", value="kathy-stewart")
    page.wait_for_timeout(500)
    page.click('button[data-tab="lobbying"]')
    page.wait_for_selector("#lobby-overlap-grid", timeout=15000)

    grid_text = page.locator("#lobby-overlap-grid").inner_text()
    assert "Chad West" not in grid_text

    page.select_option("#filter-member", value="chad-west")
    page.wait_for_timeout(500)
    page.click('button[data-tab="lobbying"]')
    page.wait_for_selector("#lobby-overlap-grid", timeout=15000)
    grid_text_chad = page.locator("#lobby-overlap-grid").inner_text()
    assert "Supported Kathy Stewart" not in grid_text_chad


def test_transactions_tab_scoped_to_selected_member(browser_page):
    page, base = browser_page
    page.goto(f"{base}/council-accountability", wait_until="domcontentloaded")
    page.wait_for_selector("#filter-member")
    page.select_option("#filter-member", value="chad-west")
    page.wait_for_timeout(800)
    page.click('button[data-tab="transactions"]')
    page.wait_for_selector("#tx-body tr", timeout=15000)

    pager = page.locator("#pager-info").inner_text()
    assert "9976" not in pager

    rows = page.locator("#tx-body tr").all_inner_texts()
    assert rows
    for row in rows[:10]:
        assert "Chad West" in row or row.strip() == ""


def test_money_tab_shows_member_finance(browser_page):
    page, base = browser_page
    page.goto(f"{base}/council-accountability", wait_until="domcontentloaded")
    page.wait_for_selector("#filter-member")
    page.select_option("#filter-member", value="jesse-moreno")
    page.wait_for_timeout(800)
    page.click('button[data-tab="money"]')
    page.wait_for_selector("#candidate-overview:not([hidden])", timeout=15000)

    assert page.locator("#money-global-vendors").is_hidden()
    assert page.locator("#money-global-charts").is_hidden()
    kpi_candidates = page.locator("#kpi-candidates").inner_text()
    assert kpi_candidates == "1"
    header = page.locator("#header-sub").inner_text()
    assert "Jesse Moreno" in header
    assert "9976" not in header
    assert page.locator("#ov-donors tr").count() > 0


def test_member_profile_from_card_click(browser_page):
    page, base = browser_page
    page.goto(f"{base}/council-accountability", wait_until="domcontentloaded")
    page.wait_for_selector("#member-cards .info-card.member-card")
    first_card = page.locator("#member-cards .info-card.member-card").first
    name = first_card.locator(".card-title, .member-name, strong").first.inner_text().strip()
    first_card.click()
    page.wait_for_selector("#combined-overview:not([hidden])", timeout=10000)
    profile_name = page.locator("#profile-name").inner_text()
    assert name.split()[0] in profile_name

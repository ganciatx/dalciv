"""Site content and global chrome injection tests."""
from __future__ import annotations

import unittest

from dashboard.site_chrome import inject_site_chrome, render_site_footer, render_site_header
from dashboard.site_content import get_site_config, site_brand_short


class SiteContentTests(unittest.TestCase):
    def test_loads_site_yaml(self):
        cfg = get_site_config()
        self.assertIn("name", cfg)
        self.assertIn("email", cfg)
        self.assertIn("social", cfg)

    def test_brand_short_uses_first_token(self):
        brand = site_brand_short({"name": "Jackson E."})
        self.assertEqual(brand, "Jackson")


class SiteChromeTests(unittest.TestCase):
    def test_render_header_contains_nav(self):
        html = render_site_header()
        self.assertIn('class="site-header"', html)
        self.assertIn('href="/side-projects"', html)
        self.assertIn("Contact", html)

    def test_render_footer_contains_social_when_configured(self):
        cfg = get_site_config()
        html = render_site_footer(cfg, year=2026)
        self.assertIn("2026", html)
        self.assertIn('href="/blog"', html)
        if cfg["social"].get("github"):
            self.assertIn("GitHub", html)

    def test_inject_wraps_body_content(self):
        html = "<!doctype html><html><head><title>T</title></head><body><div id='root'></div></body></html>"
        out = inject_site_chrome(html)
        self.assertIn("site-chrome.css", out)
        self.assertIn('class="site-header"', out)
        self.assertIn('class="site-chrome-main"', out)
        self.assertIn('class="site-footer"', out)
        self.assertIn("<div id='root'></div>", out)
        self.assertLess(out.index("site-header"), out.index("site-chrome-main"))
        self.assertLess(out.index("site-chrome-main"), out.index("site-footer"))

    def test_inject_is_idempotent(self):
        html = "<html><head></head><body><p>App</p></body></html>"
        once = inject_site_chrome(html)
        twice = inject_site_chrome(once)
        self.assertEqual(once.count('class="site-header"'), 1)
        self.assertEqual(twice.count('class="site-header"'), 1)


if __name__ == "__main__":
    unittest.main()

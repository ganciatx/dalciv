"""SPA bootstrap HTML injection."""
from __future__ import annotations

import json
import unittest

from dashboard.routes.spa import _inject_bootstrap_html


class SpaBootstrapInjectTests(unittest.TestCase):
    def test_injects_before_head_close(self):
        html = "<!doctype html><html><head><title>Test</title></head><body></body></html>"
        payload = {"directory": {"members": [{"id": "chad-west"}]}}
        out = _inject_bootstrap_html(html, payload)
        self.assertIn('<script id="ca-bootstrap">', out)
        self.assertIn("window.__CA_BOOTSTRAP__=", out)
        self.assertLess(out.index("ca-bootstrap"), out.index("</head>"))

    def test_embedded_json_is_valid(self):
        html = "<html><head></head><body></body></html>"
        payload = {"lobbyist": {"summary": {"overlap_contributor_count": 2}}}
        out = _inject_bootstrap_html(html, payload)
        start = out.index("window.__CA_BOOTSTRAP__=") + len("window.__CA_BOOTSTRAP__=")
        end = out.index(";</script>", start)
        parsed = json.loads(out[start:end])
        self.assertEqual(parsed["lobbyist"]["summary"]["overlap_contributor_count"], 2)


if __name__ == "__main__":
    unittest.main()

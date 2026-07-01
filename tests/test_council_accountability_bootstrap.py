"""Council accountability bootstrap cache and payload shape."""
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from dashboard.council_accountability import (
    bootstrap_cache_path,
    get_bootstrap_payload,
    get_bootstrap_payload_cached,
    refresh_bootstrap_cache,
)


class CouncilAccountabilityBootstrapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.project_root = Path(__file__).resolve().parents[1]

    def test_bootstrap_payload_has_user_facing_sections(self):
        payload = get_bootstrap_payload_cached(self.project_root)
        self.assertIn("directory", payload)
        self.assertIn("finance", payload)
        self.assertIn("voting", payload)
        self.assertIn("lobbyist", payload)

        members = payload["directory"].get("members") or []
        self.assertGreater(len(members), 0)
        sample = members[0]
        for key in ("id", "display_name", "council_status"):
            self.assertIn(key, sample)

    def test_bootstrap_cache_round_trip(self):
        payload = refresh_bootstrap_cache(self.project_root)
        path = bootstrap_cache_path(self.project_root)
        self.assertTrue(path.is_file())

        doc = json.loads(path.read_text(encoding="utf-8"))
        self.assertIn("payload", doc)
        self.assertIn("source_mtimes", doc)
        self.assertEqual(
            doc["payload"]["directory"]["members"][0]["id"],
            payload["directory"]["members"][0]["id"],
        )

    def test_cached_read_is_fast_path(self):
        refresh_bootstrap_cache(self.project_root)
        first = get_bootstrap_payload_cached(self.project_root)
        second = get_bootstrap_payload_cached(self.project_root)
        self.assertEqual(first["directory"]["members"][0]["id"], second["directory"]["members"][0]["id"])

    def test_stale_cache_invalidates_when_source_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data_dir = root / "scraper_dashboard_data"
            data_dir.mkdir()
            cache = bootstrap_cache_path(root)
            cache.write_text(
                json.dumps(
                    {
                        "built_at": "2025-01-01T00:00:00+00:00",
                        "source_mtimes": {"finance": 1, "voting_summary": 1, "lobbyist": 1},
                        "payload": {"directory": {"members": []}, "finance": {}, "voting": {}, "lobbyist": {}},
                    }
                ),
                encoding="utf-8",
            )
            # No finance/voting caches → rebuild path should not trust stale file forever.
            from dashboard.council_accountability import _load_bootstrap_cache

            loaded = _load_bootstrap_cache(root)
            self.assertIsNone(loaded)


if __name__ == "__main__":
    unittest.main()

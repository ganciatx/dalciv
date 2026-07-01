"""Member-scoped lobbyist summary API."""
from __future__ import annotations

import unittest

from dashboard.lobbyist_registration import (
    filter_registrations_for_member,
    get_summary_payload,
    member_scoped_summary,
)


class MemberScopedLobbyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.project_root = __import__("pathlib").Path(__file__).resolve().parents[1]

    def test_member_summary_replaces_global_overlap(self):
        overlap = [
            {
                "entity": "Acme PAC",
                "match_key": "acme pac",
                "campaign_role": "contributor",
                "campaign_amount": 1500,
            }
        ]
        rows = [
            {
                "client_name": "Acme PAC",
                "client_key": "acme pac",
                "lobbyist_name": "Lobby Co",
                "report_id": "1",
                "sworn_date": "2025-01-01",
            },
            {
                "client_name": "Other Client",
                "client_key": "other client",
                "lobbyist_name": "Other Lobby",
                "report_id": "2",
                "sworn_date": "2025-01-02",
            },
        ]
        scoped = member_scoped_summary(
            {"registration_count": 999},
            member_overlap=overlap,
            member_rows=filter_registrations_for_member(rows, overlap),
        )
        self.assertEqual(scoped["registration_count"], 1)
        self.assertEqual(scoped["influence_overlap"], overlap)
        self.assertEqual(scoped["overlap_contributor_count"], 1)

    def test_api_with_member_param_scopes_overlap(self):
        from starlette.testclient import TestClient

        from tests.conftest import make_test_app

        app, _ = make_test_app()
        with TestClient(app) as client:
            global_res = client.get("/api/lobbyist-registration/summary", params={"limit": 5})
            self.assertEqual(global_res.status_code, 200)
            global_overlap = len(global_res.json()["summary"].get("influence_overlap") or [])

            member_res = client.get(
                "/api/lobbyist-registration/summary",
                params={"member": "chad-west", "limit": 5},
            )
            self.assertEqual(member_res.status_code, 200)
            body = member_res.json()
            member_overlap = body.get("member_overlap") or []
            summary_overlap = body["summary"].get("influence_overlap") or []
            self.assertEqual(summary_overlap, member_overlap)
            if global_overlap:
                self.assertLessEqual(len(member_overlap), global_overlap)


if __name__ == "__main__":
    unittest.main()

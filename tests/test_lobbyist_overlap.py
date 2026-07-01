"""Lobby ↔ campaign overlap classification."""
from __future__ import annotations

import unittest

from dashboard.lobbyist_registration import (
    build_influence_overlap,
    build_summary,
    entity_match_key,
    member_lobby_overlap,
)


def _lobby_row(client_name: str, *, report_id: str = "r1", lobbyist: str = "Jane Lobby") -> dict:
    key = entity_match_key(client_name)
    return {
        "client_name": client_name,
        "client_key": key,
        "lobbyist_name": lobbyist,
        "report_id": report_id,
        "sworn_date": "2025-01-15T00:00:00",
        "sworn_year": "2025",
    }


def _finance_row(
    counterparty: str,
    *,
    kind: str,
    amount: float,
    candidate: str = "Chad West",
) -> dict:
    return {
        "candidate_name": candidate,
        "kind": kind,
        "amount_num": amount,
        "counterparty_name": counterparty,
        "transaction_date": "2024-06-01T00:00:00",
    }


class LobbyistOverlapTests(unittest.TestCase):
    def test_donor_overlap_sorted_before_vendors(self):
        lobby_rows = [
            _lobby_row("Vendor Print Co LLC", report_id="v1"),
            _lobby_row("Apartment Association of Greater Dallas", report_id="d1"),
        ]
        finance_rows = [
            _finance_row(
                "Apartment Association of Greater Dallas",
                kind="contribution",
                amount=2500,
            ),
            _finance_row("Vendor Print Co LLC", kind="expenditure", amount=900),
        ]

        overlap = build_influence_overlap(lobby_rows, finance_rows, limit=10)
        self.assertEqual(len(overlap), 2)
        self.assertEqual(overlap[0]["campaign_role"], "contributor")
        self.assertEqual(overlap[0]["campaign_contributed"], 2500)
        self.assertEqual(overlap[1]["campaign_role"], "recipient")
        self.assertEqual(overlap[1]["campaign_received"], 900)

    def test_both_role_when_entity_donates_and_is_paid(self):
        name = "Dual Interest LLC"
        lobby_rows = [_lobby_row(name)]
        finance_rows = [
            _finance_row(name, kind="contribution", amount=500),
            _finance_row(name, kind="expenditure", amount=300),
        ]

        overlap = build_influence_overlap(lobby_rows, finance_rows, limit=5)
        self.assertEqual(overlap[0]["campaign_role"], "both")
        self.assertEqual(overlap[0]["campaign_contributed"], 500)
        self.assertEqual(overlap[0]["campaign_received"], 300)

    def test_summary_counts_donors_and_vendors_separately(self):
        lobby_rows = [
            _lobby_row("Donor Org"),
            _lobby_row("Vendor Org"),
            _lobby_row("Dual Org"),
        ]
        finance_rows = [
            _finance_row("Donor Org", kind="contribution", amount=100),
            _finance_row("Vendor Org", kind="expenditure", amount=200),
            _finance_row("Dual Org", kind="contribution", amount=50),
            _finance_row("Dual Org", kind="expenditure", amount=75),
        ]

        summary = build_summary(lobby_rows, finance_rows)
        self.assertEqual(summary["overlap_contributor_count"], 2)
        self.assertEqual(summary["overlap_vendor_count"], 1)

    def test_member_overlap_marks_contributions_as_donors(self):
        lobby_rows = [_lobby_row("Acme PAC")]
        finance_rows = [
            _finance_row("Acme PAC", kind="contribution", amount=1500, candidate="Chad West"),
        ]

        hits = member_lobby_overlap(lobby_rows, finance_rows, "Chad West")
        self.assertEqual(len(hits), 1)
        self.assertEqual(hits[0]["campaign_role"], "contributor")
        self.assertEqual(hits[0]["campaign_amount"], 1500)


if __name__ == "__main__":
    unittest.main()

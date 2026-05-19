"""Council headshot + district URL helpers."""
import unittest
from pathlib import Path

from dashboard.council_headshots import (
    district_page_url,
    enrich_member_portrait,
    headshot_public_url,
    portrait_member_id,
    sort_member_directory,
)
from dashboard.council_voting import canonical_display_name, member_id_from_name


class CouncilHeadshotsTests(unittest.TestCase):
    def test_district_page_url(self):
        self.assertEqual(
            district_page_url(5),
            "https://dallascityhall.com/government/citycouncil/district5/Pages/default.aspx",
        )
        self.assertEqual(district_page_url(0), "")

    def test_headshot_url_encoding(self):
        self.assertIn(
            "Adam%20Bazaldua",
            headshot_public_url("Adam Bazaldua Headshot no Flags 2025.jpg"),
        )

    def test_enrich_member(self):
        root = Path(__file__).resolve().parents[1]
        row = {"id": "chad-west", "display_name": "Chad West"}
        enrich_member_portrait(row, project_root=root)
        self.assertEqual(row["district_num"], 1)
        self.assertTrue(row["district_page_url"].endswith("district1/Pages/default.aspx"))
        self.assertTrue(row["headshot_url"].startswith("/council-images/"))
        self.assertEqual(row["council_status"], "active")

    def test_jesus_moreno_merges_to_jesse(self):
        self.assertEqual(canonical_display_name("Jesus Moreno"), "Jesse Moreno")
        self.assertEqual(member_id_from_name("Jesus Moreno"), member_id_from_name("Jesse Moreno"))
        self.assertEqual(portrait_member_id("jesus-moreno"), "jesse-moreno")

    def test_sort_active_before_former(self):
        members = [
            {"display_name": "Zed Former", "council_status": "former", "district_num": 0},
            {"display_name": "Amy Active", "council_status": "active", "district_num": 2},
            {"display_name": "Bob Active", "council_status": "active", "district_num": 1},
        ]
        ordered = sort_member_directory(members)
        self.assertEqual([m["display_name"] for m in ordered], ["Bob Active", "Amy Active", "Zed Former"])


if __name__ == "__main__":
    unittest.main()

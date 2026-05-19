"""URL parsing helpers for Dallas Legistar manifest metadata."""
import unittest

from legistar_url_parsing import (
    parse_legistar_event_id,
    parse_legistar_id,
    parse_matter_id,
)


class LegistarUrlParsingTests(unittest.TestCase):
    def test_view_ashx_document_id(self):
        url = (
            "https://cityofdallas.legistar.com/View.ashx?"
            "M=IC&ID=1408905&GUID=3F5A3FDA-61CF-40C9-8669-F53D993D7C8E"
        )
        self.assertEqual(parse_legistar_id(url), "1408905")
        self.assertEqual(parse_legistar_event_id(url), "")
        self.assertEqual(parse_matter_id(url), "")

    def test_meeting_detail_event_id(self):
        url = "https://cityofdallas.legistar.com/MeetingDetail.aspx?ID=176397&GUID=abc"
        self.assertEqual(parse_legistar_event_id(url), "176397")
        self.assertEqual(parse_legistar_id(url), "176397")

    def test_matter_id_when_present(self):
        url = "https://cityofdallas.legistar.com/LegislationDetail.aspx?MatterID=99&ID=1"
        self.assertEqual(parse_matter_id(url), "99")


if __name__ == "__main__":
    unittest.main()

"""Tests for meeting transcript parsing."""
from __future__ import annotations

import unittest
from pathlib import Path

from dashboard.meeting_transcript import parse_transcript_file
from dashboard.meeting_recap import build_recap, list_meetings

PROJECT_ROOT = Path(__file__).resolve().parents[1]
TRANSCRIPT = Path.home() / "Desktop/scraper/data/dallas-legistar/2026-06-24/City Council/transcript.txt"


@unittest.skipUnless(TRANSCRIPT.is_file(), "June 2026 sample transcript not available")
class MeetingTranscriptParserTests(unittest.TestCase):
    def test_parse_june_2026_attendance(self) -> None:
        parsed = parse_transcript_file(TRANSCRIPT)
        self.assertEqual(parsed["meeting_date"], "2026-06-24")
        attendees = parsed["attendees"]
        self.assertGreaterEqual(len(attendees), 10)
        joined = " ".join(attendees).lower()
        self.assertIn("eric", joined)
        self.assertIn("chad west", joined)

    def test_parse_agenda_items_include_88_and_90(self) -> None:
        parsed = parse_transcript_file(TRANSCRIPT)
        numbers = {item["item_number"] for item in parsed["agenda_items"]}
        self.assertIn("88", numbers)
        self.assertIn("90", numbers)

    def test_consent_pulls_detected(self) -> None:
        parsed = parse_transcript_file(TRANSCRIPT)
        pulls = parsed["consent_pulls"]
        self.assertGreaterEqual(len(pulls), 5)
        pulled_nums = {p["item_number"] for p in pulls}
        self.assertIn("6", pulled_nums)
        self.assertIn("60", pulled_nums)

    def test_item_90_has_many_speakers(self) -> None:
        parsed = parse_transcript_file(TRANSCRIPT)
        item90 = next(i for i in parsed["agenda_items"] if i["item_number"] == "90")
        self.assertGreaterEqual(item90.get("public_speaker_count") or 0, 80)

    def test_record_votes_present(self) -> None:
        parsed = parse_transcript_file(TRANSCRIPT)
        self.assertGreaterEqual(len(parsed["record_votes"]), 2)

    def test_build_recap_smoke(self) -> None:
        recap = build_recap(PROJECT_ROOT, "2026-06-24", "City Council", use_llm=False)
        self.assertEqual(recap["date"], "2026-06-24")
        self.assertGreaterEqual(len(recap["featured_items"]), 3)
        item_numbers = {i["item_number"] for i in recap["featured_items"]}
        self.assertIn("88", item_numbers)
        self.assertIn("90", item_numbers)

    def test_list_meetings_finds_sample(self) -> None:
        meetings = list_meetings(PROJECT_ROOT)
        keys = {m["meeting_key"] for m in meetings}
        self.assertIn("2026-06-24_City Council", keys)


if __name__ == "__main__":
    unittest.main()

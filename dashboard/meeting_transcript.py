"""
Parse Dallas City Council Swagit meeting transcripts (.txt).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Any

from .council_voting import canonical_display_name, name_lookup_key

TIMESTAMP_RE = re.compile(r"\[(\d{2}:\d{2}:\d{2})\]")
AGENDA_BLOCK_RE = re.compile(
    r"\[\s*((Z?\d+)\.\s+(\d{2}-\d+[A-Z]?)\s+(.+?))\s*\]",
    re.DOTALL | re.IGNORECASE,
)
MEETING_DATE_RE = re.compile(
    r"(?:IT'?S|QUORUM[^.]{0,80}?)\s+"
    r"(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY),?\s+"
    r"([A-Z]+)\s+(\d{1,2})(?:ST|ND|RD|TH)?,?\s+(\d{4})",
    re.IGNORECASE,
)
START_TIME_RE = re.compile(
    r"(\d{1,2}):(\d{2})\s*A\.?M\.?",
    re.IGNORECASE,
)
CONSENT_PULL_RE = re.compile(
    r"AGENDA ITEM\s+(\d+|[A-Z]+)\s+WAS\s+(?:CORRECTED\s+AND\s+)?PULLED\s+BY\s+"
    r"(?:COUNCIL MEMBER|DEPUTY MAYOR PRO TEM|MAYOR(?: PRO TEM)?)\s+([^.;]+)",
    re.IGNORECASE,
)
NUMBER_WORDS = {
    "ONE": "1",
    "TWO": "2",
    "THREE": "3",
    "FOUR": "4",
    "FIVE": "5",
    "SIX": "6",
    "SEVEN": "7",
    "EIGHT": "8",
    "NINE": "9",
    "TEN": "10",
    "ELEVEN": "11",
    "TWELVE": "12",
    "THIRTEEN": "13",
    "FOURTEEN": "14",
    "FIFTEEN": "15",
    "SIXTEEN": "16",
    "SEVENTEEN": "17",
    "EIGHTEEN": "18",
    "NINETEEN": "19",
    "TWENTY": "20",
}
VOTE_RESULT_RE = re.compile(
    r"WITH\s+((?:ALL\s+)?\d+|ALL)\s+(?:MEMBERS\s+OF\s+COUNCIL\s+)?"
    r"VOTING\s+IN\s+FAVOR(?:,\s*(\d+)\s+OPPOSED)?(?:,\s*(\d+)\s+ABSENT)?",
    re.IGNORECASE,
)
VOTE_RESULT_ALT_RE = re.compile(
    r"WITH\s+(\d+)\s+VOTING\s+IN\s+FAVOR(?:,\s*(\d+)\s+OPPOSE(?:D|D)?)?"
    r"(?:,\s*(\d+)\s+ABSENT)?",
    re.IGNORECASE,
)
ROLL_CALL_START_RE = re.compile(
    r"(?:RECORD(?:ED)?\s+VOTE|CALL\s+THE\s+ROLL|WHEN I CALL YOUR NAME)",
    re.IGNORECASE,
)
YES_TOKENS = frozenset(
    {"YES", "YEA", "AYE", "ABSOLUTELY", "YEE-HAW", "YEE HAW", "AFFIRMATIVE"}
)
NO_TOKENS = frozenset({"NO", "NAY", "OPPOSE", "OPPOSED"})

MONTHS = {
    "JANUARY": 1,
    "FEBRUARY": 2,
    "MARCH": 3,
    "APRIL": 4,
    "MAY": 5,
    "JUNE": 6,
    "JULY": 7,
    "AUGUST": 8,
    "SEPTEMBER": 9,
    "OCTOBER": 10,
    "NOVEMBER": 11,
    "DECEMBER": 12,
}

ROLE_PREFIXES = (
    "COUNCIL MEMBER",
    "DEPUTY MAYOR PRO TEM",
    "MAYOR PRO TEM",
    "MAYOR",
)


@dataclass
class AgendaItemBlock:
    item_number: str
    matter_id: str
    title: str
    start_offset: int
    end_offset: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "item_number": self.item_number,
            "matter_id": self.matter_id,
            "title": self.title.strip(),
            "start_offset": self.start_offset,
            "end_offset": self.end_offset,
        }


@dataclass
class RecordVote:
    yes: list[str] = field(default_factory=list)
    no: list[str] = field(default_factory=list)
    other: list[str] = field(default_factory=list)
    result_text: str = ""
    favor_count: int | None = None
    oppose_count: int | None = None
    absent_count: int | None = None
    passed: bool | None = None
    offset: int = 0
    nearest_item_number: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "yes": self.yes,
            "no": self.no,
            "other": self.other,
            "result_text": self.result_text,
            "favor_count": self.favor_count,
            "oppose_count": self.oppose_count,
            "absent_count": self.absent_count,
            "passed": self.passed,
            "offset": self.offset,
            "nearest_item_number": self.nearest_item_number,
        }


def read_transcript(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def normalize_transcript_text(text: str) -> str:
    """Collapse line wraps into paragraph-style text while keeping markers."""
    lines = [ln.strip() for ln in text.splitlines()]
    chunks: list[str] = []
    buf: list[str] = []

    def flush() -> None:
        if buf:
            chunks.append(" ".join(buf))
            buf.clear()

    for line in lines:
        if not line:
            flush()
            continue
        if TIMESTAMP_RE.fullmatch(line) or line.startswith("[") and ". " in line[:12]:
            flush()
            chunks.append(line)
            continue
        if line.startswith("[") and line.endswith("]"):
            flush()
            chunks.append(line)
            continue
        buf.append(line)
    flush()
    return "\n".join(chunks)


def _parse_meeting_date(text: str) -> date | None:
    match = MEETING_DATE_RE.search(text[:8000])
    if not match:
        return None
    _weekday, month_name, day_s, year_s = match.groups()
    month = MONTHS.get(month_name.upper())
    if not month:
        return None
    try:
        return date(int(year_s), month, int(day_s))
    except ValueError:
        return None


def _parse_start_time(text: str) -> str | None:
    head = text[:8000]
    for match in START_TIME_RE.finditer(head):
        hour, minute = match.groups()
        return f"{int(hour)}:{minute.zfill(2)} AM"
    return None


def parse_attendees(text: str) -> list[str]:
    """Extract officials named in the opening roll call."""
    head = text[:4000].upper()
    if "YOU'RE WATCHING THE MEETING" not in head and "MEETING OF THE DALLAS CITY COUNCIL" not in head:
        return []

    names: list[str] = []
    seen: set[str] = set()

    def add(raw: str) -> None:
        cleaned = re.sub(r"\s+", " ", raw.strip(" .,"))
        if len(cleaned) < 4:
            return
        canon = canonical_display_name(_title_case_name(cleaned))
        key = name_lookup_key(canon)
        if key and key not in seen:
            seen.add(key)
            names.append(canon)

    patterns = [
        r"MAYOR\s+([A-Z][A-Z.\s]+?)(?=,|\s+MAYOR PRO|\s+DEPUTY|\s+AND COUNCIL|\s+CITY MANAGER|$)",
        r"MAYOR PRO TEM\s+([A-Z][A-Z.\s]+?)(?=,|\s+DEPUTY|\s+AND COUNCIL|\s+CITY MANAGER|$)",
        r"DEPUTY MAYOR PRO TEM\s+([A-Z][A-Z.\s]+?)(?=,|\s+AND COUNCIL|\s+CITY MANAGER|$)",
        r"COUNCIL MEMBERS?\s+(.+?)(?=CITY MANAGER|CITY SECRETARY|$)",
        r"CITY MANAGER[.\s]+([A-Z][A-Z.\s]+?)(?=,|\s+CITY SECRETARY|$)",
        r"CITY SECRETARY\s+([A-Z][A-Z.\s]+?)(?=,|\s+AND INTERIM|\s+CITY ATTORNEY|$)",
        r"INTERIM CITY ATTORNEY\s+([A-Z][A-Z.\s]+?)(?=\.|$)",
    ]
    for pat in patterns:
        match = re.search(pat, head, re.DOTALL)
        if not match:
            continue
        segment = match.group(1)
        if "COUNCIL MEMBERS" in pat:
            parts = re.split(
                r"\s+(?=(?:CHAD|ZARIN|JESSIE|GAY|LAURA|ADAM|LORI|PAULA|CATHY|WILLIAM|CARA|PAUL)\b)",
                segment,
            )
            for part in parts:
                add(part)
        else:
            add(segment)
    return names


def _title_case_name(raw: str) -> str:
    words = re.sub(r"\.", " ", raw).split()
    out: list[str] = []
    for word in words:
        if word in {"II", "III", "IV"}:
            out.append(word)
        elif len(word) <= 2 and word.isalpha():
            out.append(word.upper())
        else:
            out.append(word.capitalize())
    return " ".join(out)


def parse_timestamps(text: str) -> list[tuple[int, str]]:
    return [(m.start(), m.group(1)) for m in TIMESTAMP_RE.finditer(text)]


def parse_duration(text: str) -> dict[str, Any]:
    stamps = parse_timestamps(text)
    if not stamps:
        return {"start": None, "end": None, "hours": None}
    start = stamps[0][1]
    end = stamps[-1][1]

    def to_seconds(ts: str) -> int:
        h, m, s = (int(x) for x in ts.split(":"))
        return h * 3600 + m * 60 + s

    seconds = max(0, to_seconds(end) - to_seconds(start))
    return {
        "start": start,
        "end": end,
        "hours": round(seconds / 3600, 1),
    }


def parse_agenda_blocks(text: str) -> list[AgendaItemBlock]:
    items: list[AgendaItemBlock] = []
    for match in AGENDA_BLOCK_RE.finditer(text):
        full = match.group(1)
        number = match.group(2)
        matter_id = match.group(3)
        title = match.group(4).replace("\n", " ")
        title = re.sub(r"\s+", " ", title).strip()
        items.append(
            AgendaItemBlock(
                item_number=number,
                matter_id=matter_id,
                title=title,
                start_offset=match.start(),
                end_offset=match.end(),
            )
        )
    return items


def parse_consent_pulls(text: str) -> list[dict[str, str]]:
    pulls: list[dict[str, str]] = []
    for match in CONSENT_PULL_RE.finditer(text):
        item_raw, member = match.groups()
        item_num = NUMBER_WORDS.get(item_raw.upper(), item_raw)
        pulls.append(
            {
                "item_number": item_num,
                "pulled_by": canonical_display_name(_title_case_name(member.strip())),
            }
        )
    return pulls


def _normalize_vote_token(token: str) -> str | None:
    cleaned = re.sub(r"[^A-Z\s-]", "", token.upper()).strip()
    if cleaned in YES_TOKENS or cleaned.startswith("YES"):
        return "yes"
    if cleaned in NO_TOKENS:
        return "no"
    return None


def _extract_member_from_roll_fragment(fragment: str) -> tuple[str, str | None]:
    frag = fragment.upper().strip(" .")
    vote = None
    for token in sorted(YES_TOKENS | NO_TOKENS, key=len, reverse=True):
        if frag.endswith(" " + token) or frag.endswith("." + token):
            vote = _normalize_vote_token(token)
            frag = frag[: -len(token)].strip(" .")
            break
        if frag.endswith(token):
            vote = _normalize_vote_token(token)
            frag = frag[: -len(token)].strip(" .")
            break

    name = frag
    for prefix in ROLE_PREFIXES:
        if name.startswith(prefix):
            name = name[len(prefix) :].strip(" .")
            break
    name = re.sub(r"\s+", " ", name).strip(" .")
    if not name:
        return "", vote
    return canonical_display_name(_title_case_name(name)), vote


def _parse_vote_result(text: str) -> tuple[int | None, int | None, int | None, str]:
    for pattern in (VOTE_RESULT_RE, VOTE_RESULT_ALT_RE):
        match = pattern.search(text)
        if not match:
            continue
        groups = match.groups()
        favor_raw = (groups[0] or "").upper()
        if favor_raw == "ALL":
            favor = 15
        else:
            favor = int(re.sub(r"\D", "", favor_raw) or 0)
        oppose = int(groups[1]) if len(groups) > 1 and groups[1] else 0
        absent = int(groups[2]) if len(groups) > 2 and groups[2] else 0
        return favor, oppose, absent, match.group(0)
    return None, None, None, ""


def parse_record_votes(text: str, agenda_items: list[AgendaItemBlock]) -> list[RecordVote]:
    votes: list[RecordVote] = []
    upper = text.upper()
    for start_match in ROLL_CALL_START_RE.finditer(upper):
        start = start_match.start()
        window = text[start : start + 3500]
        window_upper = upper[start : start + 3500]

        # Member lines appear after "IF YOU OPPOSE" / "IF YOU'RE IN FAVOR"
        roll_body = window
        favor_idx = window_upper.find("IF YOU")
        if favor_idx != -1:
            roll_body = window[favor_idx:]

        yes: list[str] = []
        no: list[str] = []
        other: list[str] = []

        segments = re.split(
            r"(?=(?:COUNCIL MEMBER|DEPUTY MAYOR PRO TEM|MAYOR PRO TEM|MAYOR)\b)",
            roll_body,
            flags=re.IGNORECASE,
        )
        for seg in segments:
            seg = seg.strip()
            if not seg:
                continue
            name, vote = _extract_member_from_roll_fragment(seg)
            if not name:
                continue
            if vote == "yes" and name not in yes:
                yes.append(name)
            elif vote == "no" and name not in no:
                no.append(name)
            elif name not in yes and name not in no:
                other.append(name)

        favor, oppose, absent, result_text = _parse_vote_result(window_upper)
        passed = None
        if "PASSES" in window_upper or "CARRIES" in window_upper:
            passed = True
        elif "FAILS" in window_upper:
            passed = False

        nearest_item = None
        for item in reversed(agenda_items):
            if item.start_offset <= start:
                nearest_item = item.item_number
                break

        if yes or no or favor is not None:
            votes.append(
                RecordVote(
                    yes=yes,
                    no=no,
                    other=other,
                    result_text=result_text,
                    favor_count=favor,
                    oppose_count=oppose,
                    absent_count=absent,
                    passed=passed,
                    offset=start,
                    nearest_item_number=nearest_item,
                )
            )
    return votes


def extract_item_excerpt(
    text: str,
    item: AgendaItemBlock,
    *,
    max_chars: int = 12000,
) -> str:
    start = item.end_offset
    end = len(text)
    for other in parse_agenda_blocks(text):
        if other.start_offset > start:
            end = min(end, other.start_offset)
            break
    excerpt = text[start:end]
    excerpt = re.sub(r"\s+", " ", excerpt).strip()
    if len(excerpt) > max_chars:
        excerpt = excerpt[:max_chars] + "…"
    return excerpt


def count_public_speakers_near(text: str, offset: int, window: int = 2500) -> int | None:
    segment = text[max(0, offset - 200) : offset + window].upper()
    match = re.search(
        r"(\d+)\s+INDIVIDUALS?\s+WHO\s+HAVE\s+SIGNED\s+UP\s+TO\s+SPEAK",
        segment,
    )
    if match:
        return int(match.group(1))
    return None


def parse_transcript(text: str) -> dict[str, Any]:
    normalized = normalize_transcript_text(text)
    meeting_date = _parse_meeting_date(normalized)
    agenda_items = parse_agenda_blocks(normalized)
    record_votes = parse_record_votes(normalized, agenda_items)

    vote_by_item: dict[str, RecordVote] = {}
    for vote in record_votes:
        if vote.nearest_item_number and vote.nearest_item_number not in vote_by_item:
            vote_by_item[vote.nearest_item_number] = vote

    items_out: list[dict[str, Any]] = []
    for item in agenda_items:
        vote = vote_by_item.get(item.item_number)
        speaker_count = count_public_speakers_near(normalized, item.start_offset)
        items_out.append(
            {
                **item.to_dict(),
                "vote": vote.to_dict() if vote else None,
                "public_speaker_count": speaker_count,
                "excerpt_chars": len(extract_item_excerpt(normalized, item)),
            }
        )

    return {
        "meeting_date": meeting_date.isoformat() if meeting_date else None,
        "start_time": _parse_start_time(normalized),
        "attendees": parse_attendees(normalized),
        "duration": parse_duration(normalized),
        "consent_pulls": parse_consent_pulls(normalized),
        "agenda_items": items_out,
        "record_votes": [v.to_dict() for v in record_votes],
        "transcript_chars": len(normalized),
    }


def parse_transcript_file(path: Path) -> dict[str, Any]:
    text = read_transcript(path)
    payload = parse_transcript(text)
    payload["transcript_path"] = str(path)
    return payload

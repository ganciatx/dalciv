"""Legistar URL query parsing (no browser dependencies)."""
from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse


def _query_param(url: str, *names: str) -> str:
    """First matching query key (case-insensitive) from *names*."""
    try:
        qs = parse_qs(urlparse(url).query)
    except Exception:
        return ""
    lowered = {k.lower(): v for k, v in qs.items()}
    for name in names:
        vals = lowered.get(name.lower())
        if vals and str(vals[0]).strip():
            return str(vals[0]).strip()
    return ""


def parse_legistar_id(url: str) -> str:
    """Document/file id from ``View.ashx`` and similar URLs (``ID`` query param)."""
    return _query_param(url, "ID", "id")


def parse_legistar_event_id(url: str) -> str:
    """Calendar event id from ``MeetingDetail.aspx?ID=…``."""
    if "MeetingDetail.aspx" not in url:
        return ""
    return _query_param(url, "ID", "id")


def parse_matter_id(url: str) -> str:
    """Matter id when Legistar exposes ``MatterID`` / ``MID`` on the URL."""
    return _query_param(url, "MatterID", "MatterId", "matter_id", "MID", "mid")


def parse_guid_suffix(url: str, length: int = 8) -> str:
    guid = _query_param(url, "GUID", "guid")
    if guid:
        return re.sub(r"[^a-zA-Z0-9]", "", guid)[:length].lower()
    return ""

"""
Council member headshots (project ``images/``) and Dallas City Hall district page URLs.

District pages: ``https://dallascityhall.com/government/citycouncil/district{N}/Pages/default.aspx``
for N in 1..14.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Optional
from urllib.parse import quote

from .council_voting import member_id_from_name

DISTRICT_PAGE_URL = (
    "https://dallascityhall.com/government/citycouncil/district{n}/Pages/default.aspx"
)

# member_id → (district 1–14, filename under project ``images/``)
MEMBER_PORTRAITS: dict[str, tuple[int, str]] = {
    "chad-west": (1, "Chad-West-profile.jpg"),
    "jesse-moreno": (2, "Jesse-Moreno-profile.jpg"),
    "zarin-gracey": (3, "Zarin-Gracey-profile.jpg"),
    "maxie-johnson": (4, "Maxie-Johnson-full.jpg"),
    "jaime-resendez": (5, "Jaime-Resendez-profile.jpg"),
    "laura-cadena": (6, "Laura-Cadena-profile.jpg"),
    "adam-bazaldua": (7, "Adam Bazaldua Headshot no Flags 2025.jpg"),
    "lorie-blair": (8, "Lorie-Blair.jpg"),
    "paula-blackmon": (9, ""),  # no headshot file yet
    "kathy-stewart": (10, "Kathy Stewart.jpg"),
    "bill-roth": (11, "Bill-Roth-profile.jpg"),
    "cara-mendelsohn": (12, "D12_Cara Mendelsohn.jpg"),
    "gay-donnell-willis": (13, "Gay Donnellson Headshot.jpg"),
    "paul-e-ridley": (14, "Paul ridley HEADSHOT 23.jpg"),
    "paul-ridley": (14, "Paul ridley HEADSHOT 23.jpg"),
}

# Aliases for finance/voting name variants → portrait member_id
PORTRAIT_ID_ALIASES: dict[str, str] = {
    member_id_from_name("Gay Willis"): "gay-donnell-willis",
    member_id_from_name("Paul Ridley"): "paul-e-ridley",
    "jesus-moreno": "jesse-moreno",  # legacy slug if cache predates alias
}


def district_page_url(district_num: int) -> str:
    if district_num < 1 or district_num > 14:
        return ""
    return DISTRICT_PAGE_URL.format(n=district_num)


def headshot_public_url(filename: str) -> str:
    if not filename:
        return ""
    return f"/council-images/{quote(filename)}"


def _parse_district_num(raw: str) -> int:
    s = (raw or "").strip()
    if not s:
        return 0
    digits = "".join(c for c in s if c.isdigit())
    if not digits:
        return 0
    try:
        n = int(digits)
    except ValueError:
        return 0
    return n if 1 <= n <= 14 else 0


def portrait_member_id(member_id: str) -> str:
    mid = (member_id or "").strip().lower()
    return PORTRAIT_ID_ALIASES.get(mid, mid)


def enrich_member_portrait(
    entry: dict[str, Any],
    *,
    project_root: Optional[Path] = None,
) -> dict[str, Any]:
    """
    Add ``district_num``, ``district_page_url``, ``headshot_url`` to a directory/profile row.
    Voting-data ``district`` fills gaps when roster map has no file.
    """
    mid = portrait_member_id(str(entry.get("id") or ""))
    district_num = 0
    headshot_file = ""

    if mid in MEMBER_PORTRAITS:
        district_num, headshot_file = MEMBER_PORTRAITS[mid]

    if not district_num:
        for d in entry.get("districts") or []:
            district_num = _parse_district_num(str(d))
            if district_num:
                break
        if not district_num:
            district_num = _parse_district_num(str(entry.get("district") or ""))

    url = ""
    if headshot_file and project_root:
        if (project_root / "images" / headshot_file).is_file():
            url = headshot_public_url(headshot_file)

    entry["district_num"] = district_num
    entry["district_page_url"] = district_page_url(district_num) if district_num else ""
    entry["headshot_url"] = url
    # Active roster = headshot file on disk (images/ provided for current council).
    entry["is_active_councilmember"] = bool(url)
    entry["council_status"] = "active" if url else "former"
    if district_num and not entry.get("district"):
        entry["district"] = str(district_num)
    return entry


def _district_sort_num(raw: Any) -> int:
    """Coerce ``district_num`` for sorting (tolerates str/int/empty)."""
    if raw is None or raw == "":
        return 0
    try:
        n = int(raw)
    except (TypeError, ValueError):
        digits = "".join(c for c in str(raw) if c.isdigit())
        n = int(digits) if digits else 0
    return n if 1 <= n <= 14 else (99 if n else 0)


def sort_member_directory(members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Active members first (by district 1–14), then former members (by name).
    """

    def sort_key(m: dict[str, Any]) -> tuple:
        active = m.get("council_status") == "active"
        dist = _district_sort_num(m.get("district_num"))
        name = str(m.get("display_name") or "").lower()
        if active:
            return (0, dist if dist else 99, name)
        return (1, name)

    return sorted(members, key=sort_key)


def enrich_directory(
    members: list[dict[str, Any]],
    *,
    project_root: Path,
) -> list[dict[str, Any]]:
    for m in members:
        enrich_member_portrait(m, project_root=project_root)
    return sort_member_directory(members)

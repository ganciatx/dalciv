"""
Scrape Dallas Legistar calendar and meeting detail pages; download PDFs and
View.ashx files; write a manifest CSV under dallas_legistar_downloads/.

Manifest columns (written each run; missing keys backfilled as empty on read):
  type, label, url, saved_to,
  meeting_title, meeting_detail_url, source,
  legistar_id, legistar_event_id, matter_id, calendar_row_context,
  http_status, content_type, bytes_written, scraped_at, sha256

CLI contract: exits 0 on success, 1 on scrape/runtime errors, 130 on Ctrl+C so
supervisors can classify runs reliably.
"""
from __future__ import annotations

import hashlib
import re
import traceback
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import pandas as pd
from legistar_url_parsing import (
    parse_guid_suffix,
    parse_legistar_event_id,
    parse_legistar_id,
    parse_matter_id,
)
import requests
from bs4 import BeautifulSoup, Tag
from playwright.sync_api import sync_playwright

BASE = "https://cityofdallas.legistar.com/"
START_URL = "https://cityofdallas.legistar.com/Calendar.aspx"

OUT = Path("dallas_legistar_downloads")
OUT.mkdir(exist_ok=True)

MANIFEST_COLUMNS = [
    "type",
    "label",
    "url",
    "saved_to",
    "meeting_title",
    "meeting_detail_url",
    "source",
    "legistar_id",
    "legistar_event_id",
    "matter_id",
    "calendar_row_context",
    "http_status",
    "content_type",
    "bytes_written",
    "scraped_at",
    "sha256",
]

SESSION = requests.Session()
SESSION.headers.update(
    {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }
)


def clean_filename(text: str) -> str:
    text = re.sub(r"[^\w\-\. ]+", "", text)
    return re.sub(r"\s+", "_", text).strip("_")[:160]


def unique_pdf_filename(label: str, url: str, meeting_title: str = "") -> str:
    """Avoid ``Agenda.pdf`` collisions by suffixing Legistar ID or GUID fragment."""
    legistar_id = parse_legistar_id(url)
    guid_bit = parse_guid_suffix(url) if not legistar_id else ""
    suffix = legistar_id or guid_bit or "file"
    parts = []
    if meeting_title:
        parts.append(clean_filename(meeting_title))
    parts.append(clean_filename(label or "document"))
    parts.append(suffix)
    return "_".join(p for p in parts if p)[:200] + ".pdf"


def calendar_row_context(anchor: Tag) -> str:
    """Best-effort meeting/cell text for a calendar ``View.ashx`` link."""
    tr = anchor.find_parent("tr")
    if tr:
        text = tr.get_text(" ", strip=True)
        if text:
            return text[:300]
    return anchor.get_text(" ", strip=True)[:300]


def utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def make_manifest_row(
    *,
    kind: str,
    label: str,
    href: str,
    saved_to: str,
    source: str,
    meeting_title: str = "",
    meeting_detail_url: str = "",
    legistar_event_id: str = "",
    matter_id: str = "",
    calendar_row_context_text: str = "",
    http_status: int | str = "",
    content_type: str = "",
    bytes_written: int | str = "",
    scraped_at: str = "",
    sha256: str = "",
) -> dict[str, Any]:
    matter = matter_id or parse_matter_id(href)
    return {
        "type": kind,
        "label": label,
        "url": href,
        "saved_to": saved_to,
        "meeting_title": meeting_title,
        "meeting_detail_url": meeting_detail_url,
        "source": source,
        "legistar_id": parse_legistar_id(href),
        "legistar_event_id": legistar_event_id or parse_legistar_event_id(meeting_detail_url),
        "matter_id": matter,
        "calendar_row_context": calendar_row_context_text,
        "http_status": http_status,
        "content_type": content_type,
        "bytes_written": bytes_written,
        "scraped_at": scraped_at,
        "sha256": sha256,
    }


def download_file(url: str, filename: str) -> dict[str, Any]:
    """Download *url* to ``OUT / filename``; return path + response provenance."""
    scraped_at = utc_now_iso()
    response = SESSION.get(url, timeout=60)
    response.raise_for_status()
    content = response.content
    path = OUT / filename
    path.write_bytes(content)
    raw_ct = response.headers.get("Content-Type") or ""
    content_type = raw_ct.split(";", 1)[0].strip()
    return {
        "saved_to": str(path),
        "http_status": response.status_code,
        "content_type": content_type,
        "bytes_written": len(content),
        "scraped_at": scraped_at,
        "sha256": hashlib.sha256(content).hexdigest(),
    }


def run_scrape():
    """Entry point usable from imports — same semantics as CLI success path."""
    _run_pipeline()


def _run_pipeline():
    """Core scrape: gathers links, downloads files, refreshes manifest in ``finally``."""
    records: list[dict[str, Any]] = []
    downloaded_urls: set[str] = set()

    manifest_path = OUT / "download_manifest.csv"
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_default_navigation_timeout(120_000)
            page.goto(START_URL, wait_until="networkidle")

            html = page.content()
            soup = BeautifulSoup(html, "html.parser")

            calendar_file_links: list[tuple[str, str, str, Tag]] = []
            detail_urls: list[str] = []

            for anchor in soup.find_all("a", href=True):
                label = anchor.get_text(" ", strip=True)
                href = urljoin(BASE, anchor["href"])

                if "MeetingDetail.aspx" in href:
                    detail_urls.append(href)
                elif "View.ashx" in href:
                    calendar_file_links.append(
                        ("Agenda/File", label or "Agenda", href, anchor)
                    )

            for kind, label, href, anchor in calendar_file_links:
                if href in downloaded_urls:
                    continue
                filename = unique_pdf_filename(label, href)
                meta = download_file(href, filename)
                downloaded_urls.add(href)
                records.append(
                    make_manifest_row(
                        kind=kind,
                        label=label,
                        href=href,
                        saved_to=meta["saved_to"],
                        source="calendar",
                        calendar_row_context_text=calendar_row_context(anchor),
                        http_status=meta["http_status"],
                        content_type=meta["content_type"],
                        bytes_written=meta["bytes_written"],
                        scraped_at=meta["scraped_at"],
                        sha256=meta["sha256"],
                    )
                )

            for detail_url in dict.fromkeys(detail_urls):
                page.goto(detail_url, wait_until="networkidle")
                detail_soup = BeautifulSoup(page.content(), "html.parser")

                meeting_title_el = detail_soup.find("h1")
                meeting_title = (
                    meeting_title_el.get_text(" ", strip=True)
                    if meeting_title_el
                    else "meeting"
                )
                event_id = parse_legistar_event_id(detail_url)

                for anchor in detail_soup.find_all("a", href=True):
                    label = anchor.get_text(" ", strip=True)
                    href = urljoin(BASE, anchor["href"])

                    if "View.ashx" not in href and not href.lower().endswith(".pdf"):
                        continue
                    if href in downloaded_urls:
                        continue
                    filename = unique_pdf_filename(label, href, meeting_title)
                    meta = download_file(href, filename)
                    downloaded_urls.add(href)
                    records.append(
                        make_manifest_row(
                            kind="Detail Page File",
                            label=label,
                            href=href,
                            saved_to=meta["saved_to"],
                            source="meeting_detail",
                            meeting_title=meeting_title,
                            meeting_detail_url=detail_url,
                            legistar_event_id=event_id,
                            http_status=meta["http_status"],
                            content_type=meta["content_type"],
                            bytes_written=meta["bytes_written"],
                            scraped_at=meta["scraped_at"],
                            sha256=meta["sha256"],
                        )
                    )

            browser.close()
    finally:
        frame = pd.DataFrame(records)
        for col in MANIFEST_COLUMNS:
            if col not in frame.columns:
                frame[col] = ""
        frame = frame[MANIFEST_COLUMNS]
        frame.to_csv(manifest_path, index=False)

    print(f"Downloaded {len(records)} files to {OUT.resolve()}")


def main_cli() -> int:
    """Return a process exit code for subprocess supervisors."""
    try:
        run_scrape()
        return 0
    except KeyboardInterrupt:
        return 130
    except Exception:
        traceback.print_exc()
        return 1


def main():
    """Backwards-compatible name; callers that expect side effects should use ``run_scrape``."""
    _run_pipeline()


if __name__ == "__main__":
    raise SystemExit(main_cli())

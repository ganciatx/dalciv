"""
Scrape Dallas Legistar calendar and meeting detail pages; download PDFs and
View.ashx files; write a manifest CSV under dallas_legistar_downloads/.

CLI contract: exits 0 on success, 1 on scrape/runtime errors, 130 on Ctrl+C so
supervisors can classify runs reliably.
"""
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse
import re
import traceback

import pandas as pd
import requests
from bs4 import BeautifulSoup
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


def clean_filename(text):
    text = re.sub(r"[^\w\-\. ]+", "", text)
    return re.sub(r"\s+", "_", text).strip("_")[:160]


def parse_legistar_id(url: str) -> str:
    """Legistar ``View.ashx`` / detail URLs usually expose ``ID`` in the query string."""
    try:
        qs = parse_qs(urlparse(url).query)
        ids = qs.get("ID") or qs.get("id") or []
        return str(ids[0]).strip() if ids else ""
    except Exception:
        return ""


def parse_guid_suffix(url: str, length: int = 8) -> str:
    try:
        qs = parse_qs(urlparse(url).query)
        guids = qs.get("GUID") or qs.get("guid") or []
        if guids:
            return re.sub(r"[^a-zA-Z0-9]", "", guids[0])[:length].lower()
    except Exception:
        pass
    return ""


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


def make_manifest_row(
    *,
    kind: str,
    label: str,
    href: str,
    saved_to: str,
    source: str,
    meeting_title: str = "",
    meeting_detail_url: str = "",
) -> dict:
    return {
        "type": kind,
        "label": label,
        "url": href,
        "saved_to": saved_to,
        "meeting_title": meeting_title,
        "meeting_detail_url": meeting_detail_url,
        "source": source,
        "legistar_id": parse_legistar_id(href),
    }


def download_file(url, filename):
    r = SESSION.get(url, timeout=60)
    r.raise_for_status()
    path = OUT / filename
    path.write_bytes(r.content)
    return str(path)


def run_scrape():
    """Entry point usable from imports — same semantics as CLI success path."""
    _run_pipeline()


def _run_pipeline():
    """Core scrape: gathers links, downloads files, refreshes manifest in ``finally``."""
    records = []
    downloaded_urls = set()

    manifest_path = OUT / "download_manifest.csv"
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_default_navigation_timeout(120_000)
            page.goto(START_URL, wait_until="networkidle")

            html = page.content()
            soup = BeautifulSoup(html, "html.parser")

            links = []
            for a in soup.find_all("a", href=True):
                label = a.get_text(" ", strip=True)
                href = urljoin(BASE, a["href"])

                if "MeetingDetail.aspx" in href:
                    links.append(("Meeting Details", label, href))
                elif "View.ashx" in href:
                    links.append(("Agenda/File", label or "Agenda", href))

            for kind, label, href in links:
                if kind != "Agenda/File":
                    continue
                if href in downloaded_urls:
                    continue
                filename = unique_pdf_filename(label, href)
                saved_to = download_file(href, filename)
                downloaded_urls.add(href)
                records.append(
                    make_manifest_row(
                        kind=kind,
                        label=label,
                        href=href,
                        saved_to=saved_to,
                        source="calendar",
                    )
                )

            detail_urls = list(
                dict.fromkeys(
                    href for kind, _label, href in links if kind == "Meeting Details"
                )
            )

            for detail_url in detail_urls:
                page.goto(detail_url, wait_until="networkidle")
                detail_soup = BeautifulSoup(page.content(), "html.parser")

                meeting_title_el = detail_soup.find("h1")
                meeting_title = (
                    meeting_title_el.get_text(" ", strip=True)
                    if meeting_title_el
                    else "meeting"
                )

                for a in detail_soup.find_all("a", href=True):
                    label = a.get_text(" ", strip=True)
                    href = urljoin(BASE, a["href"])

                    if "View.ashx" not in href and not href.lower().endswith(".pdf"):
                        continue
                    if href in downloaded_urls:
                        continue
                    filename = unique_pdf_filename(label, href, meeting_title)
                    saved_to = download_file(href, filename)
                    downloaded_urls.add(href)
                    records.append(
                        make_manifest_row(
                            kind="Detail Page File",
                            label=label,
                            href=href,
                            saved_to=saved_to,
                            source="meeting_detail",
                            meeting_title=meeting_title,
                            meeting_detail_url=detail_url,
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

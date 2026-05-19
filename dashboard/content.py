"""
PDF text extraction and extractive summaries (no external LLM).
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from pypdf import PdfReader
from pypdf.errors import PdfReadError

# Caps keep UI/API payloads bounded on large board packets.
MAX_SUMMARY_CHARS = 1200
MAX_KEY_POINTS = 12
MAX_KEY_POINT_LEN = 220


def extract_text(pdf_path: Path) -> tuple[str, str]:
    """
    Return ``(text, status)`` where status is ``ok``, ``empty``, or ``error``.
    """
    if not pdf_path.is_file():
        return "", "error"

    try:
        reader = PdfReader(str(pdf_path))
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                return "", "error"

        chunks: list[str] = []
        for page in reader.pages:
            part = page.extract_text() or ""
            if part.strip():
                chunks.append(part)

        text = "\n".join(chunks).strip()
        if not text:
            return "", "empty"
        return text, "ok"
    except PdfReadError as exc:
        return "", f"error:{exc.__class__.__name__}"
    except Exception as exc:
        return "", f"error:{exc.__class__.__name__}"


def _split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.replace("\n", " "))
    return [p.strip() for p in parts if len(p.strip()) > 25]


def _is_heading_line(line: str) -> bool:
    s = line.strip()
    if len(s) < 4 or len(s) > 120:
        return False
    if re.match(r"^[\d]+[\.\)]\s", s):
        return True
    if s.isupper() and sum(c.isalpha() for c in s) >= 4:
        return True
    if re.match(r"^[A-Z][A-Za-z0-9\s\-–—]{3,}$", s) and s == s.title():
        return True
    return False


def _is_bullet_line(line: str) -> bool:
    s = line.strip()
    if re.match(r"^[\-\*•●▪]\s+\S", s):
        return True
    if re.match(r"^\d+[\.\)]\s+\S", s):
        return True
    return False


def build_summary(text: str) -> dict[str, Any]:
    """
    Extractive summary: lead sentences plus bullet/heading key points.
    """
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    key_points: list[str] = []
    seen: set[str] = set()

    for line in lines:
        candidate = line
        if _is_bullet_line(line):
            candidate = re.sub(r"^[\-\*•●▪]\s*", "", line)
            candidate = re.sub(r"^\d+[\.\)]\s*", "", candidate).strip()
        elif not _is_heading_line(line):
            continue

        candidate = candidate[:MAX_KEY_POINT_LEN].strip()
        norm = candidate.lower()
        if len(candidate) < 8 or norm in seen:
            continue
        seen.add(norm)
        key_points.append(candidate)
        if len(key_points) >= MAX_KEY_POINTS:
            break

    sentences = _split_sentences(text)
    summary_parts = sentences[:5]
    summary = " ".join(summary_parts).strip()
    if len(summary) > MAX_SUMMARY_CHARS:
        summary = summary[: MAX_SUMMARY_CHARS - 1].rsplit(" ", 1)[0] + "…"

    if not summary and key_points:
        summary = key_points[0]

    return {"summary": summary, "key_points": key_points}

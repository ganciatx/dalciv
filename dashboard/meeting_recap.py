"""
Meeting recap: discover transcripts, parse, summarize, cache.
"""
from __future__ import annotations

import json
import os
import re
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import requests

from .meeting_transcript import (
    AgendaItemBlock,
    extract_item_excerpt,
    normalize_transcript_text,
    parse_agenda_blocks,
    parse_transcript,
    read_transcript,
)

V1_PRIORITY_ITEMS = ("88", "90", "6", "60", "49")
MAX_EXCERPT_FOR_LLM = 10000
MAX_SUMMARY_CHARS = 900

_job_lock = threading.Lock()
_job_state: dict[str, Any] = {
    "running": False,
    "meeting_key": "",
    "done": 0,
    "total": 0,
    "error": "",
}


def utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def recap_store_dir(project_root: Path) -> Path:
    return project_root / "scraper_dashboard_data" / "meeting_recaps"


def recap_cache_path(project_root: Path, meeting_key: str) -> Path:
    safe = re.sub(r"[^a-zA-Z0-9._-]+", "_", meeting_key)
    return recap_store_dir(project_root) / f"{safe}.json"


def transcript_data_roots(project_root: Path) -> list[Path]:
    roots: list[Path] = []
    env = os.environ.get("MEETING_TRANSCRIPT_DATA_DIR", "").strip()
    if env:
        roots.append(Path(env).expanduser())
    roots.extend(
        [
            project_root / "data" / "meeting-transcripts",
            project_root / "data" / "dallas-legistar",
            Path.home() / "Desktop" / "scraper" / "data" / "dallas-legistar",
        ]
    )
    seen: set[str] = set()
    out: list[Path] = []
    for root in roots:
        key = str(root.resolve()) if root.exists() else str(root)
        if key not in seen:
            seen.add(key)
            out.append(root)
    return out


def meeting_key(date_str: str, body: str) -> str:
    return f"{date_str}_{body}"


def find_transcript_path(
    project_root: Path,
    date_str: str,
    body: str,
) -> Path | None:
    body_dir = body.strip() or "City Council"
    for root in transcript_data_roots(project_root):
        candidate = root / date_str / body_dir / "transcript.txt"
        if candidate.is_file():
            return candidate
    return None


def list_meetings(project_root: Path) -> list[dict[str, Any]]:
    meetings: list[dict[str, Any]] = []
    seen: set[str] = set()

    for root in transcript_data_roots(project_root):
        if not root.is_dir():
            continue
        for date_dir in sorted(root.iterdir(), reverse=True):
            if not date_dir.is_dir():
                continue
            for body_dir in sorted(date_dir.iterdir()):
                if not body_dir.is_dir():
                    continue
                transcript = body_dir / "transcript.txt"
                if not transcript.is_file():
                    continue
                key = meeting_key(date_dir.name, body_dir.name)
                if key in seen:
                    continue
                seen.add(key)
                cached = load_recap(project_root, key)
                meetings.append(
                    {
                        "date": date_dir.name,
                        "body": body_dir.name,
                        "meeting_key": key,
                        "transcript_path": str(transcript),
                        "has_recap": cached is not None,
                        "generated_at": (cached or {}).get("generated_at"),
                    }
                )
    return meetings


def load_recap(project_root: Path, key: str) -> dict[str, Any] | None:
    path = recap_cache_path(project_root, key)
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def save_recap(project_root: Path, key: str, payload: dict[str, Any]) -> None:
    folder = recap_store_dir(project_root)
    folder.mkdir(parents=True, exist_ok=True)
    recap_cache_path(project_root, key).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _extractive_item_summary(title: str, excerpt: str) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", excerpt)
    picked: list[str] = []
    title_words = {w.lower() for w in re.findall(r"[A-Za-z]{4,}", title)[:8]}
    for sentence in sentences:
        s = sentence.strip()
        if len(s) < 40:
            continue
        lower = s.lower()
        if any(w in lower for w in title_words):
            picked.append(s)
        if len(picked) >= 3:
            break
    if not picked:
        picked = [s.strip() for s in sentences if len(s.strip()) > 50][:2]
    summary = " ".join(picked)
    return summary[:MAX_SUMMARY_CHARS].strip()


def _llm_provider() -> str | None:
    if os.environ.get("ANTHROPIC_API_KEY", "").strip():
        return "anthropic"
    if os.environ.get("OPENAI_API_KEY", "").strip():
        return "openai"
    return None


def _parse_llm_json(content: str) -> dict[str, Any]:
    text = content.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    parsed = json.loads(text)
    return parsed if isinstance(parsed, dict) else {}


def _summarize_prompt_parts(
    *,
    item_number: str,
    matter_id: str,
    title: str,
    excerpt: str,
    vote: dict[str, Any] | None,
    public_speaker_count: int | None,
) -> tuple[str, str]:
    vote_hint = ""
    if vote:
        vote_hint = (
            "Recorded vote: "
            f"{json.dumps({k: vote.get(k) for k in ('yes', 'no', 'favor_count', 'oppose_count', 'passed')})}"
        )
    if public_speaker_count:
        vote_hint += f" Public speakers registered: {public_speaker_count}."

    system = (
        "You summarize Dallas City Council meeting transcript excerpts for residents. "
        "Write plainly, avoid jargon, note who supported or opposed when clear. "
        "Respond with JSON only (no markdown): "
        '{"summary": "2-4 sentences", "bullets": ["3-5 short strings"]}.'
    )
    user = (
        f"Agenda item {item_number} ({matter_id})\n"
        f"Title: {title}\n"
        f"{vote_hint}\n\n"
        f"Transcript excerpt:\n{excerpt[:MAX_EXCERPT_FOR_LLM]}"
    )
    return system, user


def _extractive_fallback(
    *,
    title: str,
    excerpt: str,
    vote: dict[str, Any] | None,
    public_speaker_count: int | None,
) -> tuple[str, list[str], str]:
    summary = _extractive_item_summary(title, excerpt)
    bullets: list[str] = []
    if vote and vote.get("favor_count") is not None:
        bullets.append(
            f"Vote: {vote.get('favor_count')} in favor, {vote.get('oppose_count') or 0} opposed."
        )
    if public_speaker_count:
        bullets.append(f"{public_speaker_count} residents signed up to speak.")
    return summary, bullets, "extractive"


def _call_anthropic(system: str, user: str) -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not set")
    model = (
        os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514").strip()
        or "claude-sonnet-4-20250514"
    )
    response = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": 1200,
            "temperature": 0.3,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        },
        timeout=120,
    )
    response.raise_for_status()
    parts = response.json().get("content") or []
    text = "".join(
        str(block.get("text") or "")
        for block in parts
        if isinstance(block, dict) and block.get("type") == "text"
    )
    if not text.strip():
        raise ValueError("empty anthropic response")
    return text


def _call_openai(system: str, user: str) -> str:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
        timeout=120,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    if not str(content).strip():
        raise ValueError("empty openai response")
    return str(content)


def _summarize_item_with_llm(
    *,
    item_number: str,
    matter_id: str,
    title: str,
    excerpt: str,
    vote: dict[str, Any] | None,
    public_speaker_count: int | None,
) -> tuple[str, list[str], str]:
    provider = _llm_provider()
    if not provider:
        return _extractive_fallback(
            title=title,
            excerpt=excerpt,
            vote=vote,
            public_speaker_count=public_speaker_count,
        )

    system, user = _summarize_prompt_parts(
        item_number=item_number,
        matter_id=matter_id,
        title=title,
        excerpt=excerpt,
        vote=vote,
        public_speaker_count=public_speaker_count,
    )

    try:
        if provider == "anthropic":
            content = _call_anthropic(system, user)
            method = "claude"
        else:
            content = _call_openai(system, user)
            method = "openai"

        parsed = _parse_llm_json(content)
        summary = str(parsed.get("summary") or "").strip()
        bullets = [str(b).strip() for b in (parsed.get("bullets") or []) if str(b).strip()]
        if not summary:
            raise ValueError("empty summary")
        return summary[:MAX_SUMMARY_CHARS], bullets[:6], method
    except Exception:
        return _extractive_fallback(
            title=title,
            excerpt=excerpt,
            vote=vote,
            public_speaker_count=public_speaker_count,
        )


def _build_highlights(items: list[dict[str, Any]], parsed: dict[str, Any]) -> list[str]:
    highlights: list[str] = []
    pulls = parsed.get("consent_pulls") or []
    if pulls:
        highlights.append(
            f"{len(pulls)} consent agenda items were pulled for individual debate."
        )

    for item in items:
        num = item.get("item_number")
        speakers = item.get("public_speaker_count")
        vote = item.get("vote") or {}
        if speakers and speakers >= 20:
            highlights.append(
                f"Item {num} drew {speakers} registered public speakers — one of the most debated items."
            )
        if vote.get("oppose_count") and vote.get("oppose_count") >= 3:
            highlights.append(
                f"Item {num} passed with a split vote ({vote.get('favor_count')}-{vote.get('oppose_count')})."
            )

    duration = parsed.get("duration") or {}
    if duration.get("hours"):
        highlights.append(f"Meeting ran about {duration['hours']} hours.")
    return highlights[:8]


def build_recap(
    project_root: Path,
    date_str: str,
    body: str,
    *,
    priority_items: tuple[str, ...] = V1_PRIORITY_ITEMS,
    use_llm: bool = True,
) -> dict[str, Any]:
    transcript_path = find_transcript_path(project_root, date_str, body)
    if not transcript_path:
        raise FileNotFoundError(f"No transcript for {date_str} / {body}")

    raw = read_transcript(transcript_path)
    normalized = normalize_transcript_text(raw)
    parsed = parse_transcript(raw)
    agenda_blocks = parse_agenda_blocks(normalized)
    block_by_number = {b.item_number: b for b in agenda_blocks}

    summarized_items: list[dict[str, Any]] = []
    summarize_numbers = list(priority_items)
    for block in agenda_blocks:
        if block.item_number not in summarize_numbers:
            continue

        parsed_item = next(
            (i for i in parsed["agenda_items"] if i["item_number"] == block.item_number),
            None,
        )
        excerpt = extract_item_excerpt(normalized, block)
        vote = (parsed_item or {}).get("vote")
        speaker_count = (parsed_item or {}).get("public_speaker_count")

        if use_llm and _llm_provider():
            summary, bullets, method = _summarize_item_with_llm(
                item_number=block.item_number,
                matter_id=block.matter_id,
                title=block.title,
                excerpt=excerpt,
                vote=vote,
                public_speaker_count=speaker_count,
            )
        else:
            summary = _extractive_item_summary(block.title, excerpt)
            bullets = []
            if vote and vote.get("yes"):
                bullets.append(f"Yes: {', '.join(vote['yes'][:6])}")
            if vote and vote.get("no"):
                bullets.append(f"No: {', '.join(vote['no'][:6])}")
            method = "extractive"

        summarized_items.append(
            {
                "item_number": block.item_number,
                "matter_id": block.matter_id,
                "title": block.title,
                "summary": summary,
                "bullets": bullets,
                "vote": vote,
                "public_speaker_count": speaker_count,
                "summary_method": method,
            }
        )

    summarized_items.sort(key=lambda x: int(re.sub(r"\D", "", x["item_number"]) or 0))

    payload = {
        "meeting_key": meeting_key(date_str, body),
        "date": date_str,
        "body": body,
        "generated_at": utc_now_iso(),
        "transcript_path": str(transcript_path),
        "attendees": parsed.get("attendees") or [],
        "start_time": parsed.get("start_time"),
        "duration": parsed.get("duration"),
        "consent_pulls": parsed.get("consent_pulls") or [],
        "highlights": _build_highlights(summarized_items, parsed),
        "featured_items": summarized_items,
        "agenda_item_count": len(parsed.get("agenda_items") or []),
        "record_vote_count": len(parsed.get("record_votes") or []),
        "summary_method": _llm_provider() if use_llm and _llm_provider() else "extractive",
    }
    return payload


def get_recap_payload(
    project_root: Path,
    date_str: str,
    body: str,
    *,
    refresh: bool = False,
) -> dict[str, Any]:
    key = meeting_key(date_str, body)
    if not refresh:
        cached = load_recap(project_root, key)
        if cached:
            return cached

    payload = build_recap(project_root, date_str, body)
    save_recap(project_root, key, payload)
    return payload


def analyze_status() -> dict[str, Any]:
    with _job_lock:
        return dict(_job_state)


def start_analyze_job(project_root: Path, date_str: str, body: str) -> bool:
    key = meeting_key(date_str, body)

    with _job_lock:
        if _job_state.get("running"):
            return False
        _job_state.update(
            {
                "running": True,
                "meeting_key": key,
                "done": 0,
                "total": len(V1_PRIORITY_ITEMS),
                "error": "",
            }
        )

    def _run() -> None:
        try:
            payload = build_recap(project_root, date_str, body)
            save_recap(project_root, key, payload)
            with _job_lock:
                _job_state["done"] = _job_state["total"]
        except Exception as exc:
            with _job_lock:
                _job_state["error"] = str(exc)
        finally:
            with _job_lock:
                _job_state["running"] = False

    threading.Thread(target=_run, daemon=True).start()
    return True

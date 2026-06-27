#!/usr/bin/env python3
"""Convert spreadthewordlist .dict (word;frequency) to Apple Dictionary XML."""

from __future__ import annotations

import argparse
import html
import sys
from pathlib import Path

HEADER = """<?xml version="1.0" encoding="UTF-8"?>
<d:dictionary xmlns="http://www.w3.org/1999/xhtml" xmlns:d="http://www.apple.com/DTDs/DictionaryService-1.0.rng">
"""

FOOTER = "</d:dictionary>\n"

ENTRY = """<d:entry id="{entry_id}" d:title="{title}">
\t<d:index d:value="{index}"/>
\t<h1>{title}</h1>
\t<p>Crossword frequency score: {score}</p>
</d:entry>
"""


def entry_id(word: str, seen: dict[str, int]) -> str:
    base = word.lower()
    count = seen.get(base, 0)
    seen[base] = count + 1
    if count == 0:
        return base
    return f"{base}_{count + 1}"


def convert(src: Path, out: Path) -> int:
    if not src.exists():
        print(f"Missing source file: {src}", file=sys.stderr)
        return 1

    seen: dict[str, int] = {}
    written = 0

    with src.open(encoding="utf-8", errors="replace") as fin, out.open(
        "w", encoding="utf-8"
    ) as fout:
        fout.write(HEADER)
        for line in fin:
            line = line.strip()
            if not line or ";" not in line:
                continue
            word, score = line.rsplit(";", 1)
            word = word.strip()
            score = score.strip()
            if not word:
                continue

            safe = html.escape(word, quote=True)
            eid = html.escape(entry_id(word, seen), quote=True)
            fout.write(
                ENTRY.format(
                    entry_id=eid,
                    title=safe,
                    index=safe,
                    score=html.escape(score, quote=True),
                )
            )
            written += 1
            if written % 50000 == 0:
                print(f"  {written:,} entries...", flush=True)

        fout.write(FOOTER)

    print(f"Wrote {written:,} entries to {out}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert spreadthewordlist .dict to Apple Dictionary XML."
    )
    parser.add_argument(
        "source",
        type=Path,
        help="Input .dict file (word;frequency per line)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("SpreadTheWordList.xml"),
        help="Output Apple Dictionary XML path",
    )
    args = parser.parse_args()
    return convert(args.source, args.output)


if __name__ == "__main__":
    raise SystemExit(main())

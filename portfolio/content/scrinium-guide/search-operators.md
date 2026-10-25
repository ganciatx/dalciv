---
title: "Search operators cheat sheet"
description: "One-page reference for FileCabinet search operators, comparisons and examples."
section: Reference
order: 2
---

# Search operators cheat sheet

Plain words match **file names**. Add operators to narrow. All parts must match. See [Search](../find/search.md) for explanations.

| Operator | Value | Examples |
| --- | --- | --- |
| `name:` | text | `name:report` |
| `ext:` | extension (with or without a dot) | `ext:pdf`, `ext:.jpg` |
| `kind:` | `folder` `image` `pdf` `audio` `video`/`movie` `text` `code` `markdown` `archive` `app` `spreadsheet` `presentation` `document`, or any kind name | `kind:image` |
| `tag:` | a tag name | `tag:Taxes` |
| `desc:` | text in the description | `desc:"signed copy"` |
| `modified:` | date or time ago, optionally with a comparison | `modified:>2026-09`, `modified:>7d` |
| `created:` | same as `modified:` | `created:2026` |
| `size:` | number and unit, optionally with a comparison | `size:>50MB`, `size:<=1.5GB` |
| `regex:` | a regular expression matched against the file name | `regex:^IMG_\d+` |

## Comparisons

| Symbol | Dates | Sizes |
| --- | --- | --- |
| *(none)* | within that day, month or year | equal to |
| `>` | after that period | greater than |
| `>=` | from the start of it | at least |
| `<` | before it | less than |
| `<=` | through the end of it | at most |

## Dates you can type

`2026` · `2026-09` · `2026-09-15` · `today` · `yesterday` · `7d` · `2w` · `3m` · `1y`

## Sizes

`B` · `KB` · `MB` · `GB` · `TB` (1 KB = 1,000 bytes)

## Tips

- Quotes keep words together: `name:"tax return"`.
- Operators are not case-sensitive; `EXT:PDF` works.
- A part FileCabinet can't understand is ignored and flagged in the search bar.

---
title: "Naming template tokens"
description: "Every token you can use in a naming template, and the date format codes."
section: Reference
order: 3
---

Use tokens in [naming rules](../rename/naming-rules.md) and [bulk rename](../rename/bulk-rename.md) templates. Anything outside curly braces is fixed text. Unrecognized `{…}` is kept as typed.

| Token | Result |
| --- | --- |
| `{today}` or `{today:format}` | Today's date. Default format `yyyy-MM-dd` |
| `{created}` or `{created:format}` | The item's creation date (for new items, now) |
| `{counter}` or `{counter:N}` | A number starting at 1, padded with zeros to N digits (1–12) |
| `{parent}` | The name of the containing folder |
| `{prompt:Name}` | A part you type. *Name* is the placeholder shown, and it can be reused in several places in one template (it's still one prompt) |

## Date formats

| Code | Meaning | Example |
| --- | --- | --- |
| `yyyy` | Year | 2026 |
| `yy` | Two-digit year | 26 |
| `MM` | Month, two digits | 03 |
| `MMM` | Month, short name | Mar |
| `MMMM` | Month, full name | March |
| `dd` | Day, two digits | 05 |
| `d` | Day | 5 |
| `EEE` | Weekday, short | Thu |
| `HH` | Hour, 24-hour | 14 |
| `mm` | Minutes | 07 |

Combine them with `-`, `_`, spaces or dots: `yyyy-MM-dd`, `yyyyMMdd`, `MMM d, yyyy`, `yyyy-MM-dd HH.mm`.

Slashes and colons in dates or prompt values are replaced with a dash, because Finder can't display them in file names. That's why `HH:mm` becomes `14-07`.

## Behaviors

- The **counter** in a new item's name is the smallest number not already taken in the folder.
- With no counter, if the name already exists, Scrinium adds " 2", " 3" and so on.
- New files made from a template get `.txt` (New Text File) or `.md` (New Markdown File) added.

## Ready-made examples

| Pattern | Looks like |
| --- | --- |
| `{today:yyyy-MM-dd}_{prompt:ClientName}_v{counter:2}` | `2026-10-24_Acme_v01` |
| `{prompt:Number} {prompt:Subject}` | `330.8 Business enterprises` |
| `{today:yyyy-MM-dd} {prompt:Title}` | `2026-10-24 Meeting notes` |
| `{parent}_{counter:3}` | `Taxes_001` |

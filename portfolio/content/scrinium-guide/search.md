---
title: "Search"
description: "Search with operators like ext:, kind:, tag:, size: and modified:, in the current folder or across your Mac."
section: Find
order: 8
---

Click the **Search** field in the toolbar (or press **⌘F**) and start typing. Results appear in the list as you type, and replace the folder listing until you click **Done**.

## This Folder or This Mac

Under the search field, choose where to look:

- **This Folder**: the folder you're in, and everything inside it.
- **This Mac**: everywhere, including cloud storage such as Google Drive.

## Plain words

Words without an operator match **file names**. `invoice` finds anything with "invoice" in its name. Several words must all match. Use quotes for a phrase: `"tax return"`.

## Operators

Add an operator and a colon to narrow the search. Combine as many as you like; **all must match**.

| Operator | Finds | Example |
| --- | --- | --- |
| `name:` | Names containing text | `name:report` |
| `ext:` | A file extension | `ext:pdf` |
| `kind:` | A kind of file | `kind:image` |
| `tag:` | Items with a tag | `tag:Taxes` |
| `desc:` | Items whose description contains text | `desc:signed` |
| `modified:` | By date modified | `modified:>2026-09` |
| `created:` | By date created | `created:2026` |
| `size:` | By size | `size:>50MB` |
| `regex:` | Names matching a regular expression | `regex:^IMG_\d+` |

Put quotes around values with spaces: `desc:"signed copy"`.

> **Tip:** Click the empty search field to see a list of operators you can pick.

### kind:

Use one of: `folder`, `image`, `pdf`, `audio`, `video` (or `movie`), `text`, `code`, `markdown`, `archive`, `app`, `spreadsheet`, `presentation`, `document`. Any other word matches the file's kind description, such as `kind:keynote`.

### Dates

`modified:` and `created:` accept a year, month, or day, or a time ago:

| You type | Means |
| --- | --- |
| `2026` | Anytime in 2026 |
| `2026-09` | Anytime in September 2026 |
| `2026-09-15` | That day |
| `today`, `yesterday` | Those days |
| `7d`, `2w`, `3m`, `1y` | A point that long ago |

Add a comparison to say "after" or "before":

| You type | Means |
| --- | --- |
| `modified:>2026-09` | After September 2026 (from October 1) |
| `modified:>=2026-09` | From the start of September |
| `modified:<2026-09` | Before September |
| `modified:<=2026-09` | Through the end of September |
| `modified:>7d` | In the last seven days |

### Sizes

Use `>`, `>=`, `<`, `<=` or `=` with a number and a unit: `B`, `KB`, `MB`, `GB` or `TB`. Units are the same as Finder's (1 MB = 1,000,000 bytes). `size:>50MB`, `size:<=1.5GB`.

### Regular expressions

`regex:` checks each file name against a pattern, ignoring capitalization. It works together with the other operators: `ext:jpg regex:^IMG_\d{4}`. If the pattern is invalid, Scrinium ignores it and tells you.

## Examples

| Goal | Search |
| --- | --- |
| Big PDFs from this fall | `ext:pdf size:>10MB modified:>=2026-09` |
| Everything tagged Taxes | `tag:Taxes` |
| Photos that aren't tiny | `kind:image size:>5MB` |
| Notes mentioning a client | `desc:acme` |
| Disk-hogs in Downloads | `size:>500MB` (with This Folder, in Downloads) |
| Folders named archive | `kind:folder archive` |

## Working with results

- **Double-click** a result to open it. Folders open in the window.
- Right-click → **Show in Enclosing Folder** to jump to where it lives.
- Each result shows its folder next to the name.
- Rename, tag, copy and trash work from results just as they do in folders.
- Results stop at 20,000 items.

If part of your search wasn't understood, a warning appears in the search bar and that part is ignored.

Click **Done**, or clear the search field, to return to the folder.

## Save a search

Click **Save as Filter…** to keep it in the sidebar. See [Saved filters](saved-filters.md).

## Where FileCabinet looks

Search uses Spotlight, so it's quick. Spotlight can't see some places, such as **Google Drive folders** and **drives with Spotlight turned off**. For those, Scrinium scans the folders directly, so nothing is missing. That can take longer on big folders.

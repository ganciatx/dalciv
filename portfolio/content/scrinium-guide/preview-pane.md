---
title: "Preview pane"
description: "Preview PDFs, spreadsheets, code and Markdown without opening them."
section: Tools
order: 1
---

# Preview pane

Press **⌥⌘P** (or **View → Show Preview Pane**) to show a pane on the right that previews the selected file. It's remembered **per folder**, so you can have it on in your project folders and off elsewhere.

Select **one** file to preview it. With several selected, or none, the pane waits.

## What it shows

| File type | Preview |
| --- | --- |
| **PDF** | The pages, a thumbnail strip on the left, and a **Find in PDF** box |
| **Spreadsheets** (`.xlsx`) and **CSV / TSV** | A scrollable table with column letters; a **sheet picker** appears when there is more than one sheet |
| **Code and text** | Syntax-colored text |
| **Markdown** | The text with an **Open in Obsidian** button |
| **Folders** | The folder's icon and its item count and size |
| **Audio and video** | A player with standard controls. It starts playing automatically, and stops as soon as you select something else or leave the folder |
| **Everything else** | Quick Look: images, documents and more |

### Audio and video

Playback starts when you select the file, so you can step through a folder of recordings by selecting each one. Selecting another file, changing folders or closing the pane stops it. If you'd rather press play yourself, turn off **Settings → General → Preview pane → Play audio and video automatically**.

### PDFs

Type in **Find in PDF** and press Return. Matches are highlighted. Use the **up and down arrows** to move through them; the counter shows "2/9". Click a thumbnail to jump to that page.

### Spreadsheets and CSV

- Shows the first **500 rows** and **60 columns** of a spreadsheet sheet and the first **1,000 rows** of a CSV.
- Shows the values stored in each cell. Formatting (such as dates shown as dates, currency, colors) isn't applied, and formulas show their last calculated value.
- CSV files are read with the right separator automatically: comma, tab, semicolon or pipe.
- Older `.xls` files and Numbers files use Quick Look instead.

### Code and text

Colors keywords, strings, comments and numbers for common languages including Swift, Python, JavaScript/TypeScript, JSON, HTML/XML, CSS, shell, C-family languages, Ruby, SQL, YAML and Markdown. Large files show their first **400 KB**, with a note.

### Markdown and Obsidian

**Open in Obsidian** opens the note in Obsidian if the file is inside one of your Obsidian vaults. The button is dimmed if Obsidian isn't installed.

## Tips

- Drag the divider to resize the pane.
- Preview works in every view, and in search results.
- The pane never changes your files.

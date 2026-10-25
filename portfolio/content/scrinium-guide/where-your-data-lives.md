---
title: "Where your data lives"
description: "What FileCabinet stores on your files, what it keeps itself, and what stays if you uninstall."
section: Reference
order: 4
---

Scrinium's rule: **anything about a file lives on the file; anything about how FileCabinet behaves lives in Scrinium.** Uninstalling leaves every file, tag, description and icon intact.

| What | Stored | Stays if you uninstall? |
| --- | --- | --- |
| Tag **names** on files | On the file, in Finder's tag format | Yes |
| Tag **colors** and your tag list | Scrinium | No (Finder shows the nearest of its seven colors) |
| **Descriptions** | On the file as a Finder comment; a copy is kept by Scrinium | Yes |
| **Custom folder icons** | On the folder, using macOS's folder icon feature | Yes |
| Per-folder views and naming rules | Scrinium | No |
| Layout, naming, tag and icon libraries | Scrinium | No |
| Saved filters | Scrinium | No |
| Folder counts and sizes | Scrinium (a cache that can be rebuilt) | No |
| Rename undo history | Scrinium (cleared when you quit) | No |
| Keyboard shortcuts | App preferences | No |

## The database

Scrinium's own data is a single file:

`~/Library/Application Support/Scrinium/Scrinium.sqlite`

Back it up like any other file if you want to keep your libraries and per-folder settings. Deleting it resets Scrinium to a fresh start; your files are not affected.

## Settings follow the folder

Per-folder settings are tied to the folder's identity on its disk, not its name or path. Rename or move a folder (on the same disk) and its settings come with it.

## Files Scrinium adds

- A hidden file named **Icon** inside folders where you set a custom icon.
- Nothing else is added inside your folders.

## Trash

Deletes move to the Trash. Scrinium never permanently deletes.

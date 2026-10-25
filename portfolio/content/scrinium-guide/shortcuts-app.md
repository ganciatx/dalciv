---
title: "Shortcuts app"
description: "Use FileCabinet's rename, compress, extract and backup actions in the Shortcuts app."
section: Tools
order: 9
---

# Shortcuts app

FileCabinet adds four actions to the macOS **Shortcuts** app. Open Shortcuts, choose **Apps → FileCabinet** (or search the action list), and drag them into a shortcut. Open FileCabinet once so macOS learns about them.

| Action | What it does |
| --- | --- |
| **Rename Files with Template** | Renames files with one of your [naming templates](../rename/naming-rules.md). Counters follow the order of the files. A template with `{prompt:…}` parts needs the *Value for prompts* field. The rename can be undone in FileCabinet. |
| **Compress Files** | Makes a 7z or ZIP archive next to the first file, with a compression level, an optional AES-256 password and an optional name. Returns the archive. |
| **Extract Archive** | Extracts 7z, ZIP, RAR, tar.gz and more, into a folder you choose or next to the archive. Returns the extracted items. |
| **Run Backup Job** | Runs one of your [backup jobs](backup.md) and returns a summary. |

They use the same 7-Zip, naming rules and Trash safety as the app. Anything they trash can be restored with Undo or Put Back.

You can also say or type the action names in Spotlight, for example *Compress files with FileCabinet*.

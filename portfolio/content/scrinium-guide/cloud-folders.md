---
title: "Cloud folders"
description: "Use iCloud Drive and Google Drive like any folder, see what's downloaded, and keep or remove local copies."
section: Tools
order: 3
---

## What's downloaded and what isn't

In cloud folders, each file shows a small badge:

| Badge | Meaning |
| --- | --- |
| Cloud with a down arrow | **Online only**: the file isn't on your Mac yet |
| Cloud with a checkmark | **Downloaded**: a copy is on your Mac |
| Spinner | Downloading |

The badge appears in the list next to the name, and on icons. Hover for a description. Folders don't show a badge.

## Keep Downloaded and Remove Download

Right-click one or more cloud items for:

- **Keep Downloaded**: download the files now. For a folder, it downloads everything inside.
- **Remove Download**: free up space on your Mac while keeping the file in the cloud.

You'll also find both in the **File** menu.

### What works where

| | iCloud Drive | Google Drive and other providers |
| --- | --- | --- |
| Keep Downloaded | Yes | Yes (reads the file to bring it down) |
| Remove Download | Yes | **Not available**: macOS doesn't let apps do this. Use the provider's own menu-bar app (for Google Drive, its offline settings) or Finder. |

> **Note:** Keep Downloaded brings the file down now, but it doesn't *pin* it. If your Mac runs low on space, macOS or the provider may free it again.

## Moving between places

Copy and move between local folders, external drives and cloud folders using the same drag, copy and paste. Moving across disks copies the data, and large transfers take as long as the disk or connection needs.

## Tags and descriptions in the cloud

Tags and descriptions are stored as file metadata, which some cloud services don't keep. FileCabinet keeps its own copy of **descriptions** and restores them. **Tags** on cloud files may be dropped by a provider's sync, so check on files you care about.

## Search

Google Drive folders aren't indexed by Spotlight, so Scrinium [searches them directly](../find/search.md#where-scrinium-looks).

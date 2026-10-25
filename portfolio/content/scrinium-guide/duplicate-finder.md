---
title: "Duplicate finder"
description: "Find identical files across folders, drives and cloud drives, and move the extra copies to the Trash."
section: Tools
order: 5
---

Open it from **Tools → Find Duplicates…**, or right-click a folder and choose **Find Duplicates in Folder…**.

## Choose where to look

Add any mix of folders, external drives and cloud drives with **Add Location**. Duplicates are found across all of them together, so a photo on your Mac and the same photo on a backup drive count as a pair.

- **Skip folders named** lists folders to ignore everywhere, such as `node_modules` or `.git`.
- **Ignore files smaller than** keeps tiny files out of the results. Empty files are always ignored.

## How files are compared

Files are compared by **content**, never by name. Scrinium first compares sizes, then a small sample from the start of each file, and only then reads the whole file to confirm. Two names for the same file on disk (hard links) and shortcuts (symlinks) aren't counted as duplicates.

Scanning runs in the background and can be canceled. Scrinium remembers each file's fingerprint until the file changes, so repeat scans are much faster. **Forget** clears that memory.

## Results

Duplicates are grouped, biggest savings first. Each copy shows its folder, date and size. Pick which copy to keep with the rule at the top:

- **Keep the newest** or **Keep the oldest**
- **Keep the copy in…** a location you choose, for example your main photo library. Groups with no copy there fall back to the newest.

The rule ticks every other copy. Adjust any tick by hand, or right-click a copy and choose **Keep Only This Copy**. One copy in each group always stays; you can't tick them all. The footer shows how much space the ticked copies free before anything moves.

**Move to Trash** asks once, then moves them to the Trash. You can undo it right there or from the Edit menu, and Put Back works from the Trash view.

## Cloud drives

Files that are **online-only** are never downloaded. They are matched by name and size, marked **Unconfirmed**, and never ticked automatically. Download a file (Keep Downloaded) if you want its contents compared.

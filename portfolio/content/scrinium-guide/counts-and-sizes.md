---
title: "Folder counts and sizes"
description: "See how many items are in a folder, at every depth, and how big it is, without opening it."
section: Folders
order: 1
---

Finder only tells you how big a folder is if you ask, and never how many items are inside. Scrinium shows both right in the list.

## The columns

Turn them on in **list view** with **View → Show Item Counts** (⌥⌘I), or from the view options menu. Three columns appear side by side:

| Column | What it counts |
| --- | --- |
| **Items** | Visible items directly inside the folder |
| **All Items** | Visible items at every depth, including inside subfolders |
| **Hidden** | Hidden items at every depth |

The **Size** column shows folder sizes once you turn on **View → Calculate Folder Sizes** (⌥⌘S). Files always show their own size. Folder sizes also fill in for any folder that has already been scanned for counts.

All four columns are **sortable**: click the header. Folders stay grouped at the top and are ordered among themselves by the number or size.

Counts are off by default and turned on **per folder**, so folders where you don't want them stay quiet.

## How things are counted

- **Hidden** means a name starting with a dot, or something macOS marks hidden. **Everything inside a hidden folder counts as hidden**, so no item is counted twice.
- Packages such as `.app` files count as **one item**. Their contents aren't counted, but they *are* included in size.
- **Size** adds up the actual bytes of every file inside, hidden files included. Aliases and symbolic links aren't followed.

## Background scanning

Counts and sizes are calculated in the background and **never slow down scrolling**:

- Only the rows you can see are scanned. A small spinner shows while a folder is being scanned.
- Results are saved, so when you come back to a folder they appear **instantly**.
- A saved result is refreshed when the folder changes, or after about two minutes. To force a fresh scan, choose **View options → Recalculate Counts and Sizes**.

> **Tip:** The first time you open a folder full of large subfolders, give it a moment. After that it's instant.

## Skipping huge folders

Folders like `node_modules` can hold hundreds of thousands of files. To keep scans fast, Scrinium **skips their contents** when counting a parent folder.

- Skipped by default: `node_modules`.
- A total that skipped something shows a **+** (for example **373+**), meaning "at least this many". Hover to see why.
- Looking at a skipped folder itself shows only its direct **Items**; the other columns show **—**.

Change the list in **Scrinium → Settings → General → Counting and sizes**. Enter folder names separated by commas, such as `node_modules, Pods, DerivedData`.

## If a column shows a spinner forever

macOS may be waiting for you to allow access to Desktop, Documents or Downloads. Allow the prompt, or grant [Full Disk Access](../getting-started/install-and-first-launch.md#give-filecabinet-full-disk-access).

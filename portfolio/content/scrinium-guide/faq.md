---
title: "FAQ"
description: "Quick answers about FileCabinet."
section: Reference
order: 6
---

## Does Scrinium replace Finder?

It's built to be your daily file manager, but Finder stays installed and keeps working. You can use both.

## If I stop using Scrinium, do I lose my tags and descriptions?

No. Tags, descriptions and custom folder icons are stored on the files in the standard Mac way, so Finder and Spotlight keep seeing them. What you'd lose is Scrinium-only data: tag colors, per-folder views, libraries and saved filters. See [Where your data lives](where-your-data-lives.md).

## Can I permanently delete files?

No. Deleting always moves items to the Trash, so you can recover them. Empty the Trash in Finder to free the space.

## Can I undo a rename?

Yes, every rename, one or many. See [Bulk rename → Undo](../rename/bulk-rename.md#undo).

## Will naming rules rename files that arrive from other apps or downloads?

Not in V1. Rules apply to files and folders you create in Scrinium. Use [bulk rename](../rename/bulk-rename.md) for existing files.

## Why do counts take a moment?

They're calculated in the background so the window never freezes. Results are saved, so revisiting a folder is instant. See [Counts and sizes](../folders/counts-and-sizes.md).

## What's the "+" after a number?

At least that many. A folder inside (such as `node_modules`) was skipped to keep scanning fast. Change the skip list in **Settings → General**.

## Do I need Full Disk Access?

It's recommended. Without it, macOS asks about each protected folder. See [Install and first launch](../getting-started/install-and-first-launch.md).

## Can I use my own colors for tags?

Yes, any color. Finder shows the nearest of its seven. See [Tags](../organize/tags.md).

## Can I change a tag's name?

Not in V1. Create a new tag instead.

## Does it work with Google Drive and iCloud?

Yes, they behave like normal folders. See [Cloud folders](../tools/cloud-folders.md) for what download controls are available.

## Can I change the keyboard shortcuts?

All of them. See [Customize keyboard shortcuts](../customize/shortcuts.md).

## Does it work on Intel Macs or older macOS?

V1 needs Apple silicon and macOS 26 (Tahoe) or later.

## What's coming next?

A duplicate finder, backup and folder sync, git status badges, and basic scripting. After that, access from your other devices.

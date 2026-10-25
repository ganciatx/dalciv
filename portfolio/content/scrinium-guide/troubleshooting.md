---
title: "Troubleshooting"
description: "Fixes for common problems: spinners that never finish, missing icons, search and terminal behavior."
section: Reference
order: 5
---

## Counts or sizes show a spinner that never finishes

macOS may be waiting for you to allow access to Desktop, Documents, Downloads or another protected folder. Look for a permission prompt and click **Allow**. To stop these prompts permanently, grant **Full Disk Access**: see [Install and first launch](../getting-started/install-and-first-launch.md#give-filecabinet-full-disk-access). Quit and reopen Scrinium afterward.

## A folder is very slow the first time

A first scan of a folder with huge subfolders takes a while. Results are saved, so it's instant afterward. Add the heavy folder names to the skip list in **Settings → General → Counting and sizes**.

## The numbers look out of date

Choose **View options → Recalculate Counts and Sizes**.

## The Dock or Finder shows an old icon

macOS caches icons. Run `killall Dock` in Terminal, or log out and back in. For a folder icon in Finder, press ⌘R in that window or reopen it.

## The new-item name isn't what I expected

Check which [naming rule](../rename/naming-rules.md) applies: **View options → Naming Rule** shows what the folder inherits. A folder's rule replaces the global one for it and everything below.

## Rename is greyed out or shows a conflict

Read the warning under the name in the preview: two items would end up with the same name, the name already exists in the folder, or it's empty. Change the options until no conflicts remain.

## Undo didn't restore everything

Items moved, deleted or whose old name is now taken are left alone; Scrinium tells you how many it restored. Undo history is cleared when you quit.

## A tag shows the wrong color in Finder

Finder only has seven tag colors, so it shows the nearest one to your custom color. Scrinium shows the exact color. See [Tags](../organize/tags.md#about-colors).

## Tags or descriptions disappeared on cloud files

Some cloud services drop extra file information when syncing. Descriptions are restored automatically from Scrinium's copy. Tags may need to be re-added. See [Cloud folders](../tools/cloud-folders.md).

## Search finds nothing in a Google Drive folder

Spotlight doesn't index Google Drive, so Scrinium scans it directly, which can take a while. Results appear as they're found.

## Search is missing files on an external drive

If Spotlight is off for that drive, Scrinium scans it directly when you search *This Folder* inside it. Searching *This Mac* relies on Spotlight for drives.

## The terminal didn't follow me to a new folder

It only changes folder when the shell is at its prompt, not while a command is running. Check that **Follow folder** is on.

## Remove Download doesn't work on Google Drive

macOS only allows apps to do this for iCloud Drive. See [Cloud folders](../tools/cloud-folders.md#what-works-where).

## Dragging several files only moved one

Dragging acts on the item you grab. Select all of them and use **F5**/**F6**, or copy and paste.

## "Show in Finder" opens Scrinium and I don't want that

Turn off **Settings → General → Use Scrinium**. If it doesn't take effect, run `defaults delete -g NSFileViewer` in Terminal and log out and back in. See [Use Scrinium for "Show in Finder"](../customize/default-viewer.md).

## macOS won't open the app

Control-click **Scrinium.app**, choose **Open**, and confirm.

## Still stuck

Resetting Scrinium's own data never affects your files. Quit the app and delete `~/Library/Application Support/Scrinium/`. Your views, libraries and caches will start fresh.

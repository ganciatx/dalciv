---
title: "Per-folder views"
description: "Every folder remembers its view, sort, columns and panes. Set defaults for everything, override any folder, and let subfolders inherit."
section: Browse
order: 5
---

Every view setting works at three levels:

1. **Global default**: used everywhere nothing else applies.
2. **Folder override**: set on a folder; it applies to that folder and **every subfolder** below it.
3. **Layout template**: applied automatically by a rule, such as "every folder that contains a `.git` folder". See [Layout templates](#layout-templates).

## What a folder remembers

- View (list, columns, icons, gallery) and icon size
- Sort order
- Which columns are shown, and their widths
- Hidden items shown or not
- Dual pane on or off
- Preview pane on or off
- Whether folder sizes are calculated

## It saves as you go

Change any of these while you're in a folder and Scrinium remembers it for that folder. There's no Save button.

Subfolders follow the nearest folder above them that has its own settings. A subfolder with its own settings uses those instead.

**Order of precedence** for any folder:

1. The folder's own saved settings
2. A matching layout template rule
3. The nearest parent folder with saved settings
4. The global default

## The view options menu

Click the sliders icon in the toolbar:

| Item | What it does |
| --- | --- |
| **Sort By** / **Ascending** | Sort by Name, Modified, Size, Kind, Items, All Items or Hidden |
| **Show Item Counts** | Show the Items, All Items and Hidden columns |
| **Show Preview Pane** | Show the preview pane |
| **Show Tags and Descriptions** | Show those two columns |
| **Calculate Folder Sizes** | Fill in the Size column for folders |
| **Show Hidden Items** | Include hidden files |
| **Icon Size** | Size for icons view |
| **Naming Rule** | Choose this folder's naming rule |
| **Save View as Layout Template…** | Keep this setup as a [layout template](#layout-templates) |
| **Use These Settings for All Folders** | Make this folder's settings the global default |
| **Reset This Folder to Default** | Forget this folder's own settings |
| **Recalculate Counts and Sizes** | Clear cached counts and rescan |

## Change the global default

Either set up a folder the way you want and choose **Use These Settings for All Folders**, or open **Scrinium → Settings → General** and choose the default view, sort and hidden-items setting.

## Settings follow the folder

Settings are tied to the folder itself, not its name or location. If you rename or move a folder on the same disk, it keeps its settings.

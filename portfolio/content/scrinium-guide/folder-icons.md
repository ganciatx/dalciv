---
title: "Custom folder icons"
description: "Replace a folder's icon with any PNG or SVG, keep a library of icons, and reset with one click."
section: Organize
order: 3
---

# Custom folder icons

Make important folders easy to spot with your own artwork, such as a logo or a picture exported from Canva.

## Apply an icon

1. Select the folder and open the inspector (⌘I).
2. In **Custom Icon**, either:
   - **Drop** a PNG or SVG file onto the icon, or
   - Click **Choose…** and pick a file, or
   - Click **Library** and pick an icon you've used before.

No conversion is needed. Images are fit into a square and rendered at 1024 × 1024, so large images stay sharp.

## Reset an icon

Click **Reset** in the Custom Icon section. The folder goes back to the normal icon.

## The icon library

Every image you apply is saved to your **icon library** so you can reuse it. In **FileCabinet → Settings → Icons** you can:

- **Add Icons…** (or drop files onto the window)
- Right-click an icon → **Remove from Library**

Removing an icon from the library doesn't change folders that already use it.

## In Finder and elsewhere

FileCabinet uses macOS's own folder-icon feature, so the icon shows in **Finder** and any other app, and stays if you uninstall FileCabinet.

## What gets added to the folder

macOS stores the icon in a hidden file named **Icon** inside the folder. That has two effects:

- In a **git repository**, git sees that file. FileCabinet warns you before applying an icon inside a repository. You can add `Icon?` to `.gitignore`.
- In **shared or synced folders**, other people and services may see the file.

> **Note:** Only folders can have custom icons. Packages such as apps can't.

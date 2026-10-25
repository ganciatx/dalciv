---
title: "Layout templates"
description: "Save a look as a template and apply it automatically to matching folders, such as every folder that contains .git."
section: Browse
order: 7
---

## Create a template

1. Set up a folder the way you want: view, sort, columns, preview pane, dual pane.
2. Click the sliders icon → **Save View as Layout Template…**
3. Name it and click **Save**.

You can edit or delete templates later in **Scrinium → Settings → Layouts**. Expand a template to change its view, sort, hidden items, dual pane, preview pane and folder-size settings.

## Apply a template by rule

In **Settings → Layouts → Apply by rule**, add a rule:

| Rule | Matches |
| --- | --- |
| **Folder contains an item named** | Folders that have an item with that name, such as `.git` |
| **Folder name contains** | Folders whose own name includes the text (not case-sensitive) |
| **Folder is inside path** | The folder at that path and everything below it, such as `~/Projects` |

Pick the template, then click **Add**. Rules are checked top to bottom, and **the first match wins**. Drag to reorder them.

### Example: code projects

- Rule: **Folder contains an item named** `.git` → template *Code project* (list view with the preview pane on, folder sizes off).
- Every repository folder now opens that way.

## How rules and your own changes interact

- A rule only applies to the folder that matches. A repository's subfolders are *not* matched unless they match a rule themselves.
- If you change a folder's view yourself, that folder keeps your changes and the rule no longer applies to it. **View options → Reset This Folder to Default** hands it back to the rule.
- A matching rule beats settings inherited from a parent folder.

Deleting a template also deletes the rules that used it.

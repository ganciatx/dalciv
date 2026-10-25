---
title: "Naming rules and templates"
description: "Name new files and folders automatically with templates that include dates, counters, the parent folder and prompts."
section: Rename
order: 1
---

# Naming rules and templates

A **naming rule** tells FileCabinet how to name new files and folders you create, so you never type the same pattern twice. A rule points to a **template** from your library.

## How it works

1. Pick a rule (global, or for one folder).
2. Create a folder or file: **⇧⌘N** (New Folder), **⌥⌘N** (New Text File), or right-click empty space.
3. The item is created with the rule's name. **No dialog appears.**
4. If the template asks you for something, the new item opens in rename with that part selected, so you just type.

### With no rule

New items are named **untitled folder** or **untitled file** and open in rename, like Finder.

## Templates

Templates are built from **tokens** in curly braces mixed with ordinary text.

| Token | Gives you | Example |
| --- | --- | --- |
| `{today:yyyy-MM-dd}` | Today's date in the format you choose | `2026-10-24` |
| `{created:yyyy-MM-dd}` | The item's creation date (for new items, now) | `2026-10-24` |
| `{counter:2}` | A number, padded to that many digits | `03` |
| `{parent}` | The name of the folder it's created in | `Taxes` |
| `{prompt:ClientName}` | A part you type yourself | you type `Acme` |

Anything else is fixed text. See the [tokens reference](../reference/template-tokens.md) for date formats.

### Examples

| Template | Creates |
| --- | --- |
| `{today:yyyy-MM-dd}_{prompt:ClientName}_v{counter:2}` | `2026-10-24_ClientName_v01`, with *ClientName* selected for you to type over |
| `{prompt:Number} {prompt:Subject}` | `Number Subject` for names like `330.8 Business enterprises`; type the number, press **Tab**, type the subject |
| `Invoice_{counter:3}` | `Invoice_001`, then `Invoice_002`… |

The **counter** always picks the smallest number not already used in the folder.

### Prompts

When a template has prompts, the new item opens in rename:

- The first prompt is **selected**. Type to replace it.
- Press **Tab** to jump to the next prompt. On the last one, Tab finishes.
- **Return** finishes, **Esc** keeps the placeholder name, and clicking away finishes.

## Manage your templates

Open **FileCabinet → Settings → Naming**. Three examples are included.

- **New Template…** to add one. Use **Insert Token** to add a token, and watch the live preview.
- **Edit** or the trash button to change or delete one.

Templates are also available in [bulk rename](bulk-rename.md).

## Choose the global rule

In **Settings → Naming**, pick a template under **Global naming rule**, or **None**.

## Give a folder its own rule

Click the sliders icon → **Naming Rule**:

| Choice | Meaning |
| --- | --- |
| **Inherit** | Use the rule from the parent folder, or the global one. Shows what that currently is. |
| **No Rule** | Don't use any rule here or below |
| *A template name* | Use this template here |

A folder's rule applies to **that folder and every subfolder**, replacing the global rule there. Deleting a template removes the rules that pointed to it.

## Files and folders only made inside FileCabinet

Naming rules apply to items you create **in FileCabinet**. Files that arrive from other apps, such as downloads, aren't renamed automatically.

## Renaming one item

Select it and press **F2**, or right-click → **Rename**. Return saves, Esc cancels, and clicking away saves. Selecting several items opens [bulk rename](bulk-rename.md) instead. Every rename can be [undone](bulk-rename.md#undo).

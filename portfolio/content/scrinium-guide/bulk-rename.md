---
title: "Bulk rename"
description: "Rename many files at once with find and replace, dates, numbering and templates, with a live preview and one-click undo."
section: Rename
order: 2
---

# Bulk rename

Rename a whole selection in one go, and see exactly what will happen before it does.

## Open it

Select the items, then:

- Press **F2** (with several items selected), or
- Press **⇧⌘R** (works for one item too), or
- Right-click → **Rename N Items…** / **Rename with Options…**

A sheet opens with options on the left and a **before and after** list on the right.

## Options

Options combine. They're applied in this order: template, then find and replace, then date, then numbering.

### Template

Choose a template from your [library](naming-rules.md#manage-your-templates) to replace each name with the template's result. If it has prompts, fill them in. A `{counter}` in the template counts up through the selection.

### Find and replace

- **Find** and **Replace with**. Leave Replace empty to delete the text.
- **Match case**: off by default.
- **Regular expression**: use patterns, and `$1`, `$2` in the replacement for captured groups.

### Date

Insert **Today's date** or each item's **Creation date**. Choose the format (or pick a preset such as `yyyy-MM-dd`), whether it goes **before** or **after** the name, and the separator between them. See [date formats](../reference/template-tokens.md#date-formats).

### Numbering

Turn on **Add a number**, then choose:

- **Start at** and **Step**
- **Digits**: how many digits (padding with zeros)
- **Position** before or after the name, and the separator

Start and step also control any `{counter}` in a template. Items are numbered in the order they appear in the list.

### Keep file extensions

On by default, so `photo.jpg` stays `.jpg`. Folders are always renamed in full, so a folder named `v1.2 notes` isn't mistaken for having an extension.

## The preview

Each row shows the old name and the new one:

| Icon | Meaning |
| --- | --- |
| → | Will be renamed |
| = | Unchanged |
| ⚠ | Conflict: see the reason under the name |

**Conflicts** include: two items would get the same name, the name already exists in the folder, the name is empty, contains `/`, or is too long. A missing template prompt or an invalid regular expression is also flagged.

**Rename** stays disabled until every conflict is fixed. The footer tells you how many items will change.

## Rename

Click **Rename**. FileCabinet renames everything, or nothing: if any step fails, it puts everything back. Swapping names (A→B and B→A) and changing only capital letters work.

## Undo

After a rename, a pop-up appears at the bottom for ten seconds with an **Undo** button. You can also choose **Edit → Undo Rename** (⌥⌘Z) at any time during the session.

- **One undo reverses the whole batch.**
- If an item has been moved, deleted or its old name taken since, it's left alone and FileCabinet tells you how many were restored.
- Undo history lasts for the session; it's cleared when you quit.
- ⌘Z in a text field still undoes typing as usual.

## Examples

| Goal | Settings |
| --- | --- |
| `IMG_0042.jpg` → `Trip_0042.jpg` | Find `IMG`, Replace `Trip` |
| Add a date to the end | Date → Today's date, After, separator `_` |
| `Report.docx` → `01_Report.docx` | Numbering on, Before, Digits 2, separator `_` |
| `a-12.txt` → `12_a.txt` | Regular expression: Find `(\w)-(\d+)`, Replace `$2_$1` |
| Apply a client naming pattern | Template: *Dated client file*, type the client name |

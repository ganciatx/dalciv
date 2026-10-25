---
title: "Compare and sync folders"
description: "Compare the two panes with color-coded differences, then mirror or two-way sync them after previewing every change."
section: Tools
order: 6
---

Open the two folders in [dual pane](../browse/tabs-and-dual-pane.md), then click **Compare** in the toolbar (or **Pane → Compare Panes**). Every row in both panes is colored, and a banner on top counts the differences.

| Color and word | Meaning |
| --- | --- |
| Blue, "only on left" / "only on right" | The item exists on this side only |
| Green, "newer" | This copy is newer than the one on the other side |
| Orange, "older" | This copy is older |
| Red, "differs" | The contents differ and the dates can't say which is newer, or a file faces a folder |
| Yellow, "has differences" | A folder with differences somewhere inside it |
| Dim | Identical |

Colors show in **List** view. Subfolders are compared too, so you can open a folder to see what differs inside. **Hide identical** shows only the rows that need attention. Moving a pane to a different folder compares the new pair.

Two files with the same size and nearly the same date count as identical. If the size matches but the dates differ, Scrinium compares the contents, so a file that was only touched isn't reported as changed.

## Sync

Click **Sync…** in the banner. The preview lists every change before anything happens, and each can be unticked.

- **Mirror left → right** (or right → left) makes the destination match the source. Items that exist only on the destination are removed, and you can turn that off.
- **Two-way** copies changes in both directions.

Safety rules that always apply:

- **Deleted and replaced items go to the Trash.** If a copy replaces a newer file, the newer file is moved to the Trash first. One Undo restores everything a sync trashed.
- **Conflicts are yours to decide.** When both sides changed, or a file was edited on one side and deleted on the other, it is listed with both versions, and the default is **Skip**. Nothing is resolved automatically.
- **Two-way remembers the last sync.** After a sync, Scrinium remembers what both folders looked like. The next two-way sync uses that to tell "deleted on one side" from "new on the other". The first two-way sync of a pair never deletes anything, and treats files that differ as conflicts.
- **Online-only cloud files aren't downloaded.** They show in the preview, unticked.

Syncing runs in the background with progress and cancel.

---
title: "Custom actions"
description: "Add your own shell commands to the right-click menu and run them on the files you select."
section: Tools
order: 8
---

# Custom actions

A custom action runs a shell command on the files you have selected. Set them up in **Settings → Actions**; they appear under **Actions** in the right-click menu and in **File → Actions**, for the items they apply to.

## Set one up

Click **New Action…** (or **Add Example** for a starting point such as *Open in VS Code*, *Copy Path* or *Convert to PNG*) and fill in:

- **Name**, shown in the menu.
- **Command**, written as you would in Terminal. These placeholders are replaced with the selected item, already quoted so names with spaces or quotes are safe:

  | Placeholder | Becomes |
  | --- | --- |
  | `{path}` | Full path of the item |
  | `{name}` | File name with extension |
  | `{base}` | File name without the extension |
  | `{ext}` | Extension |
  | `{dir}` | Folder containing the item |
  | `{paths}` | Every selected item, separated by spaces |

  The items are also passed to the command as `"$@"`, and `$FC_PATHS` holds them one per line. `$FC_FOLDER` is the folder you're viewing.
- **Run** *once for each item* or *once for all items together*.
- **Shows for** files, folders or both, and optionally only certain types such as `jpg, png`. An action appears only when every selected item matches.
- **Start in** the item's folder or the folder you're viewing.
- **Ask before running** shows the command and the number of items first. It's on for new actions.

## Running one

Choose it from the menu. Progress appears in the panel at the bottom right, with a cancel button. When it finishes, the card shows the last line of the command's output. If a command fails, it stops there and the card shows the error and which item it failed on. When run once for each item, the remaining items are not processed.

Commands run in your login shell, so they see the same PATH as Terminal. They run as you, with no extra safety net, so only add commands you trust. Actions that delete files do not go through the Trash unless the command itself does.

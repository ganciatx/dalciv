---
title: "Compress and extract"
description: "Make 7z and ZIP archives with passwords and split parts, and extract 7z, ZIP, RAR, tar.gz and more."
section: Tools
order: 4
---

## Compress

Select items, right-click, and choose **Compress…** (also in the **File** menu). Choose:

- **Name.** Prefilled from the folder's [naming rule](../rename/naming-rules.md), or from the item's name.
- **Format.** **7z** (smallest) or **ZIP** (opens everywhere).
- **Compression.** From Store (none) to Ultra. A short description, a speed meter and a size meter explain each level.
- **Size estimate.** The sheet measures your selection and shows the original size next to an estimated archive size. It is a range based on file types (photos, video and PDFs are already compressed and barely shrink), so the real size varies.
- **Password.** Optional, AES-256. With 7z, **Encrypt file names** also hides what's inside; ZIP can't hide names.
- **Move originals to Trash after compressing.** Off every time you open the sheet. Scrinium first checks that the new archive reads back intact; only then do the originals go to the Trash, where Undo and Put Back work. If the check fails, the job fails, or you cancel, the originals stay put. Items in a cloud folder are removed from the cloud too, and the sheet warns you.
- **Split into parts.** Fixed-size parts such as `Backup.7z.001`, `.002`. Extract from the `.001` file.

RAR files can be extracted but not created; that is a limit of 7-Zip's license.

## Extract

Right-click an archive and choose **Extract Here** or **Extract To…**. It works with .7z, .zip, .rar, .tar.gz, .tgz, .bz2, .xz, .iso and other common formats, and with split archives (use the `.001` part).

A single top-level item is extracted as is; several items go into a folder named after the archive. Nothing appears until extraction succeeds. If an archive needs a password, Scrinium asks.

## Progress and cancel

Every job shows in the panel at the bottom right with an animated progress bar, percentage, how much has been processed, speed and time remaining. When a compression finishes it shows how much space you saved. Each job has a cancel button. Canceling removes the unfinished archive, parts included.

The 7-Zip version and license are in **Settings → About**.

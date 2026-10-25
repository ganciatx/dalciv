---
title: "Backup"
description: "Back up a folder to an external or cloud drive, copying only what's new or changed."
section: Tools
order: 7
---

# Backup

Open **Tools → Backup…** and add a job with **+**. A job has a name, a source folder, a destination folder and options. Run it with **Run Now**, or put it on a schedule.

## Two ways to back up

- **Copy files.** The destination folder mirrors the source. Each run copies only new and changed files, so the second run takes seconds. A file replaced in the backup because the backup copy was newer goes to the Trash first. By default, files you delete from the source stay in the backup; turn on the option to remove them from the backup too (they go to the Trash).
- **Compressed 7z archive.** Each run writes a dated archive such as `Documents 2026-10-24 1830.7z`. You can add a password (AES-256, with hidden file names). The archive is checked after it is written, and only then are archives beyond the number you want to keep moved to the Trash. Only archives named like this one are ever touched.

Folders named in **Skip folders named** (default `node_modules, .git, .Trash`) are left out.

## Passwords

An archive password is stored in your Keychain so scheduled backups can run. It isn't kept in FileCabinet's database. Without the password the archives can't be opened, so keep a copy somewhere safe.

## Schedule

Choose Hourly, Daily or Weekly. Scheduled jobs run **only while FileCabinet is open**. A job that came due while the app was closed runs shortly after you open it. If the drive isn't connected, the run is logged as skipped and tried again within the hour.

## Check first, and the history

**Check What Would Be Copied** reports how many files and bytes the next run would copy, without copying anything.

Every run is logged under **History**: open a run to see each file copied, anything moved to the Trash, and any errors. The last 50 runs of each job are kept.

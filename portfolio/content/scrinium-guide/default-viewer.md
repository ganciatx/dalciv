---
title: "Use FileCabinet for \"Show in Finder\""
description: "Optionally make FileCabinet open when other apps reveal a file, and how to undo it."
section: Customize
order: 10
---

# Use FileCabinet for "Show in Finder"

Many apps have a **Show in Finder** or **Reveal in Finder** command. By default these open Finder. You can have them open FileCabinet instead.

This is **off by default**.

## Turn it on

1. Open **FileCabinet → Settings → General**.
2. Turn on **Use FileCabinet when other apps choose "Show in Finder"**.

From then on, when another app reveals something:

- A **folder** opens in a new tab.
- A **file** opens in a new tab on its folder, with the file selected.

## Turn it off

Turn the same switch off. Finder takes over again. **Finder is never removed**, and you can still open it from the Dock.

## If something goes wrong

If switching it off doesn't return things to normal, open Terminal and run:

```bash
defaults delete -g NSFileViewer
```

Then log out and back in.

## What it changes

It sets the Mac's global "file viewer" preference and tells macOS that FileCabinet can show folders. FileCabinet doesn't change any other system setting.

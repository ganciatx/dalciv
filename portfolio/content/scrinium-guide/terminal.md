---
title: "Integrated terminal"
description: "Run your normal shell at the bottom of the window, and have it follow the folder you're viewing."
section: Tools
order: 2
---

# Integrated terminal

Press **⌃`** (Control and the backtick key), or click the terminal button, to open a terminal at the bottom of the window.

## It's your normal shell

The terminal runs your **login shell** (usually zsh), so your existing setup, such as your prompt, aliases and `PATH`, works exactly as in Terminal.

## It opens at your folder

Opening the terminal works like Terminal's **New Terminal at Folder**: you land in the folder you're viewing.

- The first time, a new shell starts there.
- After that, the terminal keeps your session (see below), so opening it moves that session to the folder you're in now. This happens even if **Follow folder** is off.
- If a command is still running, FileCabinet leaves it alone and doesn't change folders.

Copy and paste work as you'd expect, and full-screen programs such as `vim` and `top` run fine.

## Follow the folder

With **Follow folder** checked, the terminal changes to the folder you're viewing whenever you navigate, so you can browse and run commands in the same place.

- FileCabinet only does this when the shell is **sitting at its prompt**. It never types into a program that's running.
- It types a `cd` command for you, so you'll see it in the terminal.
- Uncheck **Follow folder** to stop.

## It keeps going

Closing the panel (⌃` again, or the **×**) **doesn't end your session**. Commands keep running, and your scrollback and history are still there when you reopen it.

If the shell exits (for example, you type `exit`), click **Restart** in the panel header.

## Resize

Drag the divider between the folder area and the terminal.

## Tips

- ⌘C and ⌘V copy and paste inside the terminal; they won't copy or paste files while it's focused.
- Click a file's folder in the path bar to move the terminal along with you.

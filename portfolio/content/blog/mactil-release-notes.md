---
title: "MacTil Release Notes"
excerpt: ""
date: "2026-07-11"
category: Projects
emoji: ""
---

# Current Version

## 1.3.0 — 2026-07-11

Optimization Suite is complete, plus local-only crash reports and trust fixes.

### New

- **Local crash reports** — Optionally record crashes on this Mac (Clipboard settings). Export JSON when you want; nothing is uploaded.
- **Optimization Suite** — All ten tools are available in the Optimization sidebar: startup profiler, launch predictor, RAM hog killer, battery health, idle reclaimer, shortcut coach, thermal watchdog, cache cleanup, bandwidth monitor, and energy impact triager (with optional menu-bar alerts for RAM and energy).

### Improvements

- Crash diagnostics no longer depend on a Sentry DSN or third-party error service.
- **Tool UI polish** — Folder Guard, Background Tasks, RAM Hog Killer, Idle Reclaimer, and Clipboard are easier to scan: clearer empty states, quieter secondary actions (context menus), and settings controls that live only in suite/settings sheets.

### Fixes

- **Uninstaller** — Safer leftover selection: short/generic name matches are no longer auto-checked for Trash; review cues highlight lower-confidence rows.
- **Live network / port tools** — System command timeouts are reliable again (no hung scans from stuck subprocesses).



### Download


| Platform                          | File                                                                      |
| --------------------------------- | ------------------------------------------------------------------------- |
| macOS 14+ (Apple Silicon + Intel) | [Mactil-1.3.0-macOS-universal.zip](dist/Mactil-1.3.0-macOS-universal.zip) |


SHA256: see [dist/SHA256SUMS.txt](dist/SHA256SUMS.txt)

# Previous Versions
## 1.2.5 — 2026-07-10

### Fixes
- **Background Task explanations** — Fixed Claude API 404 errors caused by an invalid model name; now uses `claude-haiku-4-5`.
### Download
| Platform | File |
|----------|------|
| macOS 14+ (Apple Silicon + Intel) | [Mactil-1.2.5-macOS-universal.zip](dist/Mactil-1.2.5-macOS-universal.zip) |

SHA256: see [dist/SHA256SUMS.txt](dist/SHA256SUMS.txt)

---

## 1.2.4 — 2026-07-10

Settings are easier to find.

### Fixes

- **Settings gear missing** — The window toolbar now shows a visible gear button for every utility. Privacy & Security and Optimization also have a **Settings** button in the bottom-left tool sidebar (next to the FDA status).

### Download

| Platform | File |
|----------|------|
| macOS 14+ (Apple Silicon + Intel) | [Mactil-1.2.4-macOS-universal.zip](dist/Mactil-1.2.4-macOS-universal.zip) |

SHA256: see [dist/SHA256SUMS.txt](dist/SHA256SUMS.txt)
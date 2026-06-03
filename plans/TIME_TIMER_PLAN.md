# Time Timer (Digital) — Implementation Plan

**Overall Progress:** `100%`

Digital clone of the [Time Timer® Original 12"](https://www.timetimer.com/collections/all-1/products/time-timer-12-inch): 60-minute visual countdown with shrinking red disk, silent operation, optional end alert.

## TLDR

Standalone Vite + React app at **`/time-timer`**, built into `dashboard/static/time-timer/`. Client-only; no backend APIs.

## Critical Decisions

- Vite subproject `time-timer/` → static bundle (matches budget simulator).
- SVG red wedge from 12 o'clock clockwise = time remaining (patented visual).
- `requestAnimationFrame` while running for smooth disk animation.

## Tasks

- [x] 🟩 **Step 1: Timer logic** — `useTimer` hook (run/pause/reset/presets)
- [x] 🟩 **Step 2: Visual face** — SVG disk, minute ticks, black bezel
- [x] 🟩 **Step 3: Controls** — presets, start/pause, reset, sound toggle, fullscreen
- [x] 🟩 **Step 4: Vite build** — output to `dashboard/static/time-timer/`
- [x] 🟩 **Step 5: FastAPI route + template** — `GET /time-timer`
- [x] 🟩 **Step 6: Portal** — `home.html`, command center catalog

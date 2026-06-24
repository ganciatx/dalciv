# City Budget Simulator — City Hall Floorplan Navigation

**Overall Progress:** `100%`

## TLDR

Replace top tab navigation with a sticky **City Hall floorplan** sidebar: clickable rooms map to game views, central corridor is decorative, locked rooms gray out when the campaign ends.

## Critical Decisions

- **Sidebar layout** — Floorplan in left column; game content in right column (stacks on mobile).
- **Room names** — Thematic labels (Mayor's Suite, Finance Office, Council Chamber, etc.) instead of generic tab names.
- **End-game** — Floorplan hidden on game-over screen; timeline/history/politics remain accessible via last view if needed.

## Tasks

- [x] 🟩 **Step 1: CityHallFloorplan component** — Room grid, icons, active/locked states
- [x] 🟩 **Step 2: App layout** — `game-layout` sidebar + main; remove `nav-tabs`
- [x] 🟩 **Step 3: CSS floorplan** — Grid areas, corridor, room hover/active styles
- [x] 🟩 **Step 4: Build** — Production bundle updated

# Crossword Constructor

Desktop-oriented web app for building NYT- and WSJ-compliant crossword puzzles with live validation, word fill, and clue management.

## Features

- **Grid workspace** — 15×15 / 21×21 editor with symmetry enforcement, rebus mode, zoom, undo/redo
- **Live compliance** — NYT/WSJ rules (symmetry, interlock, word count, fill quality, etc.)
- **Word fill** — Pattern search over ~15k curated words (IndexedDB), score coloring, one-click fill
- **Clue editor** — Across/Down columns, clue lookup, WSJ title field
- **Export** — `.puz`, NYT/WSJ plain-text, PDF solve view, JSON backup
- **Persistence** — Autosave, open/save `.json` and `.puz`, home screen with recent puzzles

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `node scripts/generate-words.mjs` | Regenerate word list |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Arrow keys | Move cursor |
| Tab / Shift+Tab | Next/previous word slot |
| Space | Toggle black square |
| Backspace | Clear cell, move back |
| Ctrl+Z / Ctrl+Y | Undo / Redo |
| Ctrl+S | Save JSON |
| Ctrl+E | Export modal |
| Ctrl+F (Words tab) | Focus search |
| F1 / Ctrl+? | Guidance sidebar |
| Ctrl+G (in clue field) | Jump to grid cell |

## Clue database (SQLite)

Constructor clue/answer bank for pattern fill, per-venue difficulty, themes, and reuse tracking. Lives in [`database/`](./database/) — open `database/crossword.db` in **DB Browser for SQLite** or see [`database/QUERY_GUIDE.md`](./database/QUERY_GUIDE.md).

```bash
cd database && ./setup.sh   # full curated dataset (~120 answers)
```

A CRUD GUI for this database is planned; the app’s in-browser word list (IndexedDB) remains separate for grid fill.

## Documentation

- [Marketing & website brief](docs/MARKETING-BRIEF.md) — product overview for designers and copywriters

## Tech Stack

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · IndexedDB · Vitest

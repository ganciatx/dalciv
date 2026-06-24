# Crossword Constructor — Marketing & Website Brief

**For:** Website designer / marketing copywriter  
**Last verified against codebase:** June 2025  
**Product URL (dev):** http://localhost:5173 (production URL TBD)

---

## Product at a Glance

| | |
|---|---|
| **Product name** | **Crossword Constructor** (repo folder: *Crosscreate*) |
| **What it is** | Browser-based tool for *building* crossword puzzles — not solving them |
| **One-liner** | Build NYT- and WSJ-ready crossword puzzles with live compliance checks, smart fill help, and export to standard submission formats. |
| **Format** | Single-page web app; runs in the browser, no install |
| **Account required** | No login, no subscription, no cloud account |
| **Data storage** | Everything stays on the user's device (browser local storage + IndexedDB) |

---

## Who It's For

**Primary audience:** People who *construct* crosswords — hobbyists, aspiring submitters, and experienced constructors who want a focused, standards-aware editor.

**Not for:** Casual solvers looking for daily puzzles to play. This is a professional *authoring* tool.

**Typical user goals:**
- Design a themed grid that meets publication rules before spending hours on clues
- Get real-time feedback on symmetry, word count, fill quality, and other submission pitfalls
- Search and rank filler words instead of guessing from memory
- Export in formats editors actually accept (.puz, NYT/WSJ plain text)
- Manage multiple works-in-progress locally

---

## The Problem We Solve

Crossword construction is hard. Constructors juggle grid design, publication-specific rules, fill quality, theme placement, and clue writing — often across disconnected spreadsheets, word lists, and generic grid tools that don't know NYT from WSJ requirements.

**Crossword Constructor unifies the workflow** in one place: grid → fill → clues → export, with compliance feedback at every step.

---

## Core Value Propositions (use for headlines & sections)

1. **Publication-aware from the start** — Choose NYT or WSJ; rules, export formats, and guidance adapt automatically.
2. **Live compliance, not after-the-fact surprises** — Errors and warnings update as you edit; click any issue to jump to the problem on the grid.
3. **Fill quality you can see** — Words are scored and color-coded on the grid (green / yellow / red) so weak fill stands out before you write clues.
4. **Constructor workflow, not a toy grid** — Pattern search, crossing-aware filler suggestions, theme brainstorming, answer bank with drag-and-drop, rebus cells, symmetry enforcement.
5. **Your work stays yours** — No account, no server upload of puzzles; autosave and a local puzzle library.
6. **Export-ready output** — Download .puz (Across Lite), publication plain-text, PDF solve view, or JSON backup.

---

## User Journey (good for "How it works" sections)

```
Home → New puzzle (size + target) → Grid workspace → Words workspace → Clues workspace → Export
```

### 1. Home screen
- Start a new puzzle: **15×15 or 21×21**, target **NYT** or **WSJ**
- **My Puzzles** library — open, rename, delete saved work
- Restore unsaved session if the browser closed mid-edit
- Open existing `.json` or `.puz` files from the editor nav

### 2. Grid workspace (main construction)
- Interactive crossword grid with keyboard navigation
- Place **black squares** (click, spacebar, or drag-and-drop token); optional **180° rotational symmetry** auto-pairs placements
- Type letters into cells; **rebus mode** for multi-letter cells
- **Answer bank** — add theme entries, drag onto grid (drop cell = first letter)
- **Assist panel** — theme ideas + crossing-aware filler suggestions
- **Word entry panel** — pattern-based fill suggestions for the selected slot
- **Live stats bar** — word count vs. max, black-square %, avg word length, 3-letter count, fill %
- **Compliance panel** — grouped issues with click-to-navigate
- Color-coded fill quality on completed words

### 3. Words workspace
- **Pattern search** — e.g. `C?OS?W?RD` (`?` = any letter)
- Filter by min quality score, max length, proper nouns, abbreviations, crosswordese
- Upload custom word lists (CSV / plain text) into local storage
- ~**15,500** curated words with quality scores (1–100) and tags

### 4. Clues workspace
- Two-column **Across | Down** editor with completion counts
- **Built-in clue library** — ~**695** example clues searchable by answer (starting points, not final copy)
- WSJ **title field** with 60-character limit and theme-duplicate warning
- Duplicate-clue-text detection
- **Ctrl+G** jumps from a clue field to the matching grid cell

### 5. Export
- Pre-export checklist blocks download if errors remain; warnings require acknowledgment
- Formats depend on target:
  - **Both:** Across Lite (`.puz`), PDF solve view, JSON backup
  - **NYT:** NYT plain text
  - **WSJ:** WSJ plain text

---

## Feature Reference (accurate claims only)

### Grid editing
| Feature | Copy-friendly description |
|---------|---------------------------|
| Grid sizes | 15×15 (daily) and 21×21 (Sunday / large) |
| Symmetry | Toggle 180° rotational symmetry; violations highlighted when off |
| Black squares | Click, spacebar, or drag-and-drop; symmetric partner preview when symmetry on |
| Rebus | Multi-letter cells for rebus puzzles |
| Undo / redo | Full edit history (Ctrl+Z / Ctrl+Y) |
| Zoom | 75% – 150% display scale |
| Drag-and-drop answers | Theme words from answer bank onto grid |

### Compliance & validation
Live checks include (non-exhaustive — good for "smart checks" marketing bullets):

- Rotational symmetry
- All-over interlock (no isolated white regions)
- Every letter checked in both directions
- Minimum 3-letter answers
- Word count vs. publication maximum (78 for 15×15, 140 for 21×21)
- Black square density (~17% threshold)
- Low-scoring / crosswordese fill warnings
- Duplicate answers and near-duplicate word families
- Proper-noun clustering (WSJ)
- Rebus consistency
- Incomplete clues
- WSJ title requirements

Nav bar shows **✓ Compliant**, **⚠ N warnings**, or **✕ N errors** at a glance.

### Assist (suggestions, not automation)
| Mode | What it does |
|------|----------------|
| **Theme** | Suggests theme entry candidates from a concept phrase or puzzle title |
| **Filler** | Crossing-aware filler ranked for the selected slot |
| **Local (default)** | Works offline from the built-in word list |
| **AI (optional)** | User supplies their own OpenAI API key for theme ideation only; key stored in browser, sent directly to OpenAI — not to us |

**Important:** Assist *suggests*. It does not auto-fill the grid or write clues. The constructor stays in control.

### Word list & fill
- ~15,500 scored words in local database (IndexedDB)
- Quality score 1–100; tags include `proper_noun`, `abbreviation`, `crosswordese`, `domain:*`
- Pattern search, filters, custom list import
- Grid cells color by lowest crossing word score: green (≥70), yellow (≥40), red (<40), gray (unknown word)

### Clues
- Inline editing with tab navigation between fields
- Example clues from built-in library (copy and edit)
- WSJ title field with character counter

### Persistence
- **Autosave** to browser storage on every edit
- **Puzzle library** in IndexedDB — multiple saved puzzles
- Manual **Save** downloads JSON; **Open** accepts `.json` or `.puz`

### Guidance sidebar (F1 / ?)
- Publication quick-reference (NYT vs. WSJ requirements)
- Phase-specific tips (empty grid → partial fill → complete → clues)
- Full interface guide and keyboard shortcuts

---

## Publication Targets (NYT vs. WSJ)

Use this for comparison tables or "built for submitters" copy.

| | **NYT** | **WSJ** |
|---|---------|---------|
| Grid sizes | 15×15 (Mon–Sat), 21×21 (Sunday) | 15×15 (Mon–Fri), 21×21 (Saturday) |
| Max words | 78 (15×15) / 140 (21×21) | Same |
| Symmetry | 180° rotational (enforced) | Same expectations |
| Title | Optional in tool | **Required**; must not duplicate a theme answer; ≤60 chars |
| Fill philosophy | Lively, varied; limit 3-letter words (~20% guidance) | Common, familiar vocabulary; sparse proper nouns |
| Export | `.puz`, NYT plain text, PDF, JSON | `.puz`, WSJ plain text, PDF, JSON |

**Disclaimer for all marketing:** Crossword Constructor helps you follow *commonly cited* submission guidelines. It is **not affiliated with, endorsed by, or published by** The New York Times or The Wall Street Journal.

---

## What We Are NOT (avoid inaccurate copy)

| Don't claim | Reality |
|-------------|---------|
| "Solve crosswords" / "daily puzzles" | Construction tool only |
| "AI writes your puzzle" | Optional AI suggests theme *entries* only; user fills grid and writes clues |
| "Auto-fill" / "one-click complete grid" | Suggestions and pattern search — manual placement |
| "150,000+ word database" | ~15,500 curated words today |
| "Cloud sync across devices" | Local-only storage |
| "Team collaboration" | Single-user, single-browser |
| "Official NYT/WSJ tool" | Independent; publication-aware, not affiliated |
| "Mobile app" | Desktop-oriented web UI (works in browser, optimized for larger screens) |
| "Account / sign up" | No accounts |

---

## Suggested Messaging Angles

### Headline directions
- *Build crosswords that are ready to submit.*
- *The crossword constructor with publication rules built in.*
- *Design, fill, clue, export — without leaving the grid.*
- *See fill quality and compliance issues as you work, not after.*

### Supporting proof points
- Live NYT/WSJ compliance badge
- Color-coded fill scoring
- Export to `.puz` and publication plain-text
- ~15,500 scored words + pattern search
- Local puzzle library with autosave
- Optional AI theme brainstorming (bring your own key)

### Emotional hooks
- **Confidence** — know your grid passes the rules before you invest in clues
- **Flow** — grid, words, and clues in one app with keyboard shortcuts
- **Ownership** — puzzles stay on your machine
- **Craft** — built for people who care about fill quality, not just filling squares

---

## Tone & Voice

| Do | Don't |
|----|-------|
| Professional, precise, respectful of the craft | Gamified, casual, "puzzle fun for everyone" |
| "Constructor," "fill," "theme entry," "compliance" | "Player," "game," "win" |
| Empowering — you're in control | Overpromising automation |
| Acknowledge NYT/WSJ standards without implying partnership | "Official" or "approved by" |

---

## Starter Copy Blocks

### Hero (example)
> **Crossword Constructor**  
> Build publication-ready crossword puzzles in your browser. Live NYT and WSJ compliance checks, scored fill suggestions, and export to `.puz` — no account required.

### Subhead (example)
> Design your grid, find better fill, write clues, and download submission-ready files. Your puzzles stay on your device.

### CTA options
- Start building (free)
- Try it in your browser
- Create your first puzzle

### Short feature bullets (homepage)
- **Live compliance** — symmetry, interlock, word count, fill quality, and more
- **Smart fill help** — pattern search, scored words, crossing-aware suggestions
- **Theme assist** — brainstorm entries from your concept (offline or optional AI)
- **Clue workspace** — across/down editor with example clue lookup
- **Export ready** — `.puz`, NYT/WSJ plain text, PDF, JSON
- **Private by default** — autosave and puzzle library, all local

### FAQ seeds

**Is this for solving puzzles?**  
No. It's for people who *make* crosswords.

**Do I need an account?**  
No. Open the app and start a puzzle.

**Where is my data stored?**  
In your browser (local storage and IndexedDB). Clearing site data removes saved puzzles.

**Does it work offline?**  
Core features (grid, word list, compliance, export) work offline after first load. Optional AI theme assist needs internet and your own OpenAI API key.

**Can it submit to the NYT or WSJ for me?**  
No. It helps you build and export files you submit through each publication's normal process.

**Is the AI required?**  
No. Default assist uses the local word list. AI is optional for theme ideation only.

---

## Visual / UX Notes for Designers

- **Three main workspaces** after leaving home: **Grid**, **Words**, **Clues** (top nav tabs)
- **Home screen** is minimal: product title, four "new puzzle" buttons, puzzle library list
- **Grid layout:** answer palette (left) · grid + toolbar + stats (center) · assist + fill + compliance (right sidebar)
- **Color language:** blue = primary actions/selection; green/yellow/red = fill quality & compliance; amber = WSJ title warnings
- **Desktop-first:** dense toolbar, sidebars, keyboard shortcuts — design marketing mockups for laptop/desktop widths
- **No existing brand system documented** — room to define logo, palette, and typography for the marketing site (in-app UI is slate/blue Tailwind)

---

## Keyboard Shortcuts (optional "power user" section)

| Shortcut | Action |
|----------|--------|
| Arrow keys | Move cursor |
| Tab / Shift+Tab | Next / previous word slot |
| Space | Toggle black square |
| Backspace | Clear cell, move back |
| Ctrl+Z / Ctrl+Y | Undo / Redo |
| Ctrl+S | Save JSON |
| Ctrl+E | Export |
| Ctrl+F (Words tab) | Focus word search |
| Ctrl+Shift+A | Toggle Assist panel |
| Ctrl+G (in clue field) | Jump to grid cell |
| F1 / Ctrl+? | Guidance sidebar |

---

## Technical Facts (for footer / privacy page)

- Web app: React, TypeScript, Vite
- No backend server for puzzle data
- Optional OpenAI calls go directly from the user's browser with their API key
- Open/save: `.json` (native backup), `.puz` (Across Lite import/export)
- Word list and puzzle library: IndexedDB

---

## Questions for Stakeholder (fill in before final copy)

1. **Production URL and brand** — Is the public name "Crossword Constructor," "Crosscreate," or something else?
2. **Pricing** — Free forever, freemium, or paid? (App is currently unmonetized.)
3. **Launch scope** — Public web host, or download/self-host only?
4. **Privacy policy** — Needed if optional OpenAI integration is highlighted in marketing.
5. **Screenshots** — Capture from a real puzzle in progress (grid + compliance + export) for authenticity.

---

## Changelog for This Document

| Date | Note |
|------|------|
| 2025-06 | Initial brief from codebase audit |

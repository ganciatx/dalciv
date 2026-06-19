# Feature Implementation Plan — License Plate Game

**Overall Progress:** `100%`

## TLDR

Add **License Plate Game** as a fifth Tally template: a road-trip checklist where players tap to mark US states (and optionally Canadian provinces) as they spot plates. Reference UX: [plategame.app](https://plategame.app/) — grouped region list, tap-to-check, progress count. Supports **competitive** play (each player owns their own checklist; most regions wins) and **cooperative** play (one shared checklist for the car). Fits existing flow: game picker → setup options → live scoring → game over → history.

## Critical Decisions

- **New `checklist` scoring mode** — Boolean region checkoffs per player (or per session in cooperative), not numeric rounds. Keeps Yahtzee `categories` and Phase 10 `rounds` untouched.
- **Competitive by default** — Matches Tally’s multi-player pass-and-play model; cooperative is a setup toggle (one shared grid, no winner — or “everyone wins” on complete).
- **Static region data** — Hardcoded US states + DC, plus Canadian provinces/territories (same set as plategame.app). `includeCanada` toggle at setup; no Mexico/territories in v1.
- **Manual end + optional auto-detect** — `End Game` always available. Auto banner when all enabled regions are checked (cooperative) or a player completes the full list (competitive), consistent with Phase 10 / Yahtzee patterns.
- **Score = regions spotted** — `playerScore` returns count of checked regions; competitive winner = highest count. History stores final counts per player name.
- **No timer, no plate images, no GPS** — Checklist only; out of scope per Tally MVP constraints and to match plategame.app core without app-store extras.

## Tasks

- [x] 🟩 **Step 1: Types & region data**
  - [x] 🟩 Add `ScoringMode: 'checklist'` and `LicensePlateRegion` type (`id`, `label`, `group: 'us' | 'canada'`)
  - [x] 🟩 Add `Player.spottedRegions?: Record<string, boolean>` and session fields `licensePlateCooperative?: boolean`, `includeCanada?: boolean`, `sharedSpottedRegions?: Record<string, boolean>`
  - [x] 🟩 Create `src/games/licensePlateRegions.ts` — US 50 + DC + Canada list (labels from plategame.app)
  - [x] 🟩 Add `EndCondition` variant `{ type: 'checklist_complete' }` and wire into `evaluateEndCondition`

- [x] 🟩 **Step 2: Game definition & scoring utils**
  - [x] 🟩 Register `license_plate` in `src/games/definitions.ts` (1–6 players, highest wins, checklist mode, icon/description)
  - [x] 🟩 Extend `playerScore`, `determineWinnerId`, `sortedStandings` in `src/utils/scoring.ts` for checklist counts
  - [x] 🟩 Initialize `spottedRegions` / `sharedSpottedRegions` in `createPlayer` / `startSession` based on setup options
  - [x] 🟩 Add `resolveActiveRegions(includeCanada)` helper returning filtered region list

- [x] 🟩 **Step 3: Player setup options**
  - [x] 🟩 On `PlayerSetupPage`, when `gameId === 'license_plate'`, show toggles: **Competitive / Cooperative**, **Include Canada**
  - [x] 🟩 Pass options into `startSession`; skip competitive player minimum logic change (still 1+ players; cooperative allows 1)

- [x] 🟩 **Step 4: Live scoring UI (`LicensePlateScoring`)**
  - [x] 🟩 Create `src/components/scoring/LicensePlateScoring.tsx` — reference plategame.app layout: **United States** / **Canada** section headers, scrollable checkbox grid
  - [x] 🟩 Competitive: player tabs (reuse Yahtzee tab pattern) + per-player checkoffs; show `X / N` progress and standings sidebar
  - [x] 🟩 Cooperative: single shared grid; tapping checks region for the group; hide winner logic until manual end or all complete
  - [x] 🟩 Optional **Reset** per section or full list (confirm dialog) — matches reference site reset behavior
  - [x] 🟩 Add muted safety line: “Pass the device — don’t use while driving”

- [x] 🟩 **Step 5: Routing, theme & polish**
  - [x] 🟩 Register component in `ScoringPage` map; add `license_plate` theme tokens in `gameThemes.ts` + CSS (road-trip accent, e.g. highway blue/amber)
  - [x] 🟩 Style checked cells (stamp/check, player color tint in competitive mode)
  - [x] 🟩 Verify game over, history, resume, and end-condition banner work with checklist scores

- [x] 🟩 **Step 6: Verify**
  - [x] 🟩 `npm run build` passes
  - [x] 🟩 Manual test: competitive 2-player spot/check/end; cooperative shared list; Canada toggle filters grid; history entry shows correct counts

## Bonus — Tic Tac Toe (added with this execution)

- [x] 🟩 New `board` scoring mode, `tic_tac_toe` definition (2 players, round wins tracked)
- [x] 🟩 `TicTacToeScoring` component with 3×3 grid, turn tracking, next round, standings
- [x] 🟩 Theme tokens + `tic-tac-toe.css`

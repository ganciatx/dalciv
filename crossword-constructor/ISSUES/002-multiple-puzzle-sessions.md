# Issue: Many new puzzle sessions created on page load

**Type:** bug  
**Priority:** normal  
**Effort:** small  
**Status:** fixed

## TL;DR

Every page refresh was adding a new "Untitled Puzzle" to Recent Puzzles, even when the user never started a session.

## Current vs expected

| | Behavior |
|---|---|
| **Before** | Recent list filled with duplicate empty puzzles; autosave overwritten with throwaway UUIDs on each visit |
| **Expected** | Recent list only grows when user explicitly starts, opens, or saves a puzzle |

## Root cause

Two compounding bugs:

1. **Store init** — `createPuzzle()` runs on every load, generating a fresh UUID for a throwaway default puzzle.
2. **Autosave side effect** — `saveAutosave()` called `addRecent()` on every save (including mount + 30s interval), so each page load registered a new session in Recent Puzzles.

## Fix

- Decouple autosave from recent-list updates (`saveAutosave` vs `trackRecentPuzzle`)
- Call `trackRecentPuzzle` only when a session starts (`newPuzzle`, `setPuzzle`, `savePuzzleFile`)
- Skip autosave entirely while on the home workspace

## Files touched

- `src/lib/persistence.ts`
- `src/hooks/useAppHooks.ts`
- `src/stores/puzzleStore.ts`
- `src/lib/persistence.test.ts` (new)

## Risk / notes

- Stale entries already in localStorage are not auto-pruned; user can clear site data or ignore old "Untitled Puzzle" rows
- Recent list title only updates when session is re-tracked (new/open/save), not on every autosave title edit — acceptable tradeoff

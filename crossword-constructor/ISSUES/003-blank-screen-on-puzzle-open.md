# Issue: Blank screen when starting or opening a puzzle

**Type:** bug  
**Priority:** high  
**Effort:** small  
**Status:** fixed

## TL;DR

Home screen loads fine, but clicking **New Puzzle** or **Open** from the library switches to a blank screen instead of the grid editor.

## Current vs expected

| | Behavior |
|---|---|
| **Current** | Blank screen after leaving home (new puzzle, open from library, or restore session) |
| **Expected** | Grid workspace with toolbar, canvas, assist panel, and NavBar |

## Suspected root cause

Same class of bug as #001 (fixed for initial load): an **unstable Zustand selector** in `GridCanvas` that allocates a new array on every `getSnapshot` call when `themeSlotNumbers` is undefined:

```ts
usePuzzleStore((s) => s.puzzle.themeSlotNumbers ?? [])
```

React 19 treats each new `[]` reference as a state change → infinite subscribe/re-render loop once the grid workspace mounts. Home screen avoids this because `GridWorkspace` / `GridCanvas` are not rendered until `workspace === 'grid'`.

**Likely console error:** `Maximum update depth exceeded` (possibly pointing at `GridCanvas` or a child).

## Fix direction

- Replace the unstable selector with a stable primitive (e.g. subscribe to `puzzle` and derive `themeSlotNumbers ?? []` via `useMemo`, or use a shared empty-array constant)
- Audit other grid-workspace selectors for the same pattern (`?? []`, `.filter()`, `.map()` inside selectors)
- Add a regression test or lint rule for unstable Zustand selectors if feasible

## Files to touch

- `src/components/grid/GridCanvas.tsx` (primary suspect — line 17)
- `src/hooks/useDerivedPuzzleState.ts` (optional: add `useThemeSlotNumbers()` helper, mirroring #001 fix)
- `src/App.tsx` (verify workspace transition and loading gate)

## Risk / notes

- Related to but distinct from **#001** (blank on initial load — fixed by memoized hooks + conditional NavBar mount)
- Repro may affect all entry paths that set `workspace: 'grid'`: `newPuzzle`, `setPuzzle`, restore autosave, NavBar file open
- `AssistPanel` uses `puzzle.themeSlotNumbers ?? []` outside a selector (safe); only the Zustand selector form is problematic

## Repro steps

1. Load app → home screen appears
2. Click any **New Puzzle** button (e.g. 15×15 NYT), **or** open a saved puzzle from Recent Puzzles
3. Screen goes blank; grid editor does not render

## Open questions

- [ ] Confirm browser console shows `Maximum update depth exceeded`
- [ ] Does **Restore Session** (autosave banner) also blank, or only new/open?
- [ ] Dev (`npm run dev`) vs production build — same behavior?

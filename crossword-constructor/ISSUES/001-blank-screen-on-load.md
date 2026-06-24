# Issue: Blank screen on initial page load

**Type:** bug  
**Priority:** high  
**Effort:** small  
**Status:** fixed

## TL;DR

App crashed on load with a React infinite re-render loop. Browser showed title/favicon only — no UI.

## Current vs expected

| | Behavior |
|---|---|
| **Current** | Blank white screen; console: `Maximum update depth exceeded` in `<NavBar>` |
| **Expected** | Home screen with "Crossword Constructor" heading and new-puzzle buttons |

## Root cause

`NavBar` (and other components) used unstable Zustand selectors:

```ts
usePuzzleStore((s) => s.getIssues())   // new array every getSnapshot call
usePuzzleStore((s) => s.getCompliance())
```

React 19 + Zustand treat each new array reference as a state change → infinite subscribe/re-render loop.

## Fix

- Added `src/hooks/useDerivedPuzzleState.ts` with `useMemo`-backed hooks for issues, compliance, stats, and current slot
- Replaced unstable store-method selectors in NavBar, CompliancePanel, LiveStatsBar, ExportModal, GuidanceSidebar, WordEntryPanel
- Mount `<NavBar />` only when `workspace !== 'home'` so home load skips editor chrome entirely

## Files touched

- `src/hooks/useDerivedPuzzleState.ts` (new)
- `src/components/NavBar.tsx`
- `src/App.tsx`
- `src/components/grid/CompliancePanel.tsx`
- `src/components/grid/LiveStatsBar.tsx`
- `src/components/grid/WordEntryPanel.tsx`
- `src/components/ExportModal.tsx`
- `src/components/GuidanceSidebar.tsx`

## Risk / notes

- Any future derived state should use memoized hooks or store-level caching — never call functions that allocate in Zustand selectors
- `useKeyboardShortcuts` still subscribes to the full store; consider `getState()` in the handler as a follow-up

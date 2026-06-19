# Scorekeeper App — MVP Technical Spec

## 1. Overview

A web-first app (responsive, mobile-friendly) that helps people keep score while playing board and card games. Instead of a single generic point tracker, the app provides **game-specific scorecard templates** that mirror the physical scorecards/score pads that ship with each game — starting with Yahtzee, Phase 10, and Mexican Train Dominoes — plus a **generic fallback scoreboard** for any other game.

No accounts. No login. All data lives in the browser (local storage / IndexedDB). Single device, pass-and-play style — one person holds the device and enters scores for the table.

### 1.1 Goals (MVP)
- Let a group start a game in under 30 seconds (pick game → add players → go).
- Faithfully reproduce the scoring structure of each supported game, including the "annoying math" (Yahtzee bonuses, Phase 10 phase tracking).
- Auto-calculate totals and auto-detect a winner, without removing the user's ability to end the game manually.
- Save a simple local history of completed games.
- Provide a safety net (generic scoreboard) for any game not yet supported.

### 1.2 Non-goals (explicitly out of scope for MVP)
- User accounts / login / cloud sync.
- Multi-device real-time sync (e.g., each player scoring from their own phone in the same live session).
- Stats/analytics beyond a basic history list (no win-rate charts, no player profiles).
- Any game templates beyond the three named + generic fallback.
- Offline-first PWA installability (nice-to-have, not required day one — though local storage gets us most of the way there for free).
- Editing past/completed games in history.

---

## 2. Core Concepts & Data Model

The system is built around four entities. This shape is intentionally generic enough that adding a 4th, 5th, 10th game template later doesn't require new top-level concepts — only a new `GameDefinition`.

### 2.1 `GameDefinition` (static, hardcoded per game — not user-editable in MVP)
Describes the shape of a game: its scoring structure, win condition, and end condition. Each of Yahtzee, Phase 10, Mexican Train, and "Generic" is one `GameDefinition`.

```ts
type GameDefinition = {
  id: string;                  // "yahtzee" | "phase10" | "mexican_train" | "generic"
  name: string;                // Display name
  minPlayers: number;
  maxPlayers: number;
  scoringMode: "categories" | "rounds";  // see 2.3
  winCondition: "highest" | "lowest";
  endCondition: EndCondition;
  // Mode-specific config (categories list, phase list, etc.) — see per-game sections below
};
```

### 2.2 `GameSession` (one in-progress or completed game)
```ts
type GameSession = {
  id: string;                  // uuid
  gameId: string;               // references GameDefinition.id
  players: Player[];
  status: "in_progress" | "completed";
  startedAt: string;            // ISO timestamp
  endedAt?: string;
  winnerPlayerId?: string;
  // mode-specific score data lives nested under each player — see below
};

type Player = {
  id: string;                   // uuid, scoped to this session
  name: string;
  // Yahtzee:
  categoryScores?: Record<string, number | null>;  // categoryId -> value
  // Phase 10:
  currentPhase?: number;        // 1-10
  phaseCompleted?: boolean[];   // index = phase number - 1
  roundScores?: number[];       // running list, one entry per round
  // Mexican Train:
  // (roundScores reused — see 2.5)
};
```

### 2.3 Two scoring modes cover all three games
- **`categories` mode** (Yahtzee): one scorecard, fixed set of categories, each filled in once, formula computes the total. No "rounds" — it's a single pass through the categories in any order.
- **`rounds` mode** (Phase 10, Mexican Train): a sequence of rounds; each round, every player gets a score; running total accumulates. The two games differ in *what a round means* and *what determines game end*, which is handled by per-game config (see 2.5–2.6), not a new mode.

### 2.4 `EndCondition`
```ts
type EndCondition =
  | { type: "all_categories_filled" }                  // Yahtzee
  | { type: "fixed_rounds"; rounds: number }            // Phase 10 (10 rounds)
  | { type: "first_to_complete_phase"; phase: number }  // Phase 10 alt-end (someone finishes phase 10)
  | { type: "player_count_threshold"; perPlayerRounds: number } // Mexican Train: rounds = number of players (one round per "double" tile used, simplified for MVP — see 2.6)
  | { type: "manual_only" };                            // Generic
```
The app evaluates end conditions after every score entry and surfaces a "Game Over" state when met, but the user can always tap **End Game** manually regardless of mode.

---

## 3. Game Template Specs

### 3.1 Yahtzee

**Mode:** `categories`. **Win condition:** highest total. **End condition:** all 13 categories filled for all players.

**Categories (upper section):**
| Category | Scoring |
|---|---|
| Ones | sum of dice showing 1 |
| Twos | sum of dice showing 2 |
| Threes | sum of dice showing 3 |
| Fours | sum of dice showing 4 |
| Fives | sum of dice showing 5 |
| Sixes | sum of dice showing 6 |

→ **Upper Section Bonus:** if upper section subtotal ≥ 63, add 35 points. Computed automatically, displayed as its own line, not user-entered.

**Categories (lower section):**
| Category | Scoring |
|---|---|
| Three of a Kind | sum of all 5 dice (user enters the sum directly) |
| Four of a Kind | sum of all 5 dice |
| Full House | fixed 25 |
| Small Straight | fixed 30 |
| Large Straight | fixed 40 |
| Yahtzee | fixed 50 |
| Chance | sum of all 5 dice |

**Yahtzee Bonus:** if a player scores a Yahtzee (50) in the Yahtzee category, *and* later rolls additional Yahtzees, each additional one is worth a +100 bonus chip. MVP UI: once the Yahtzee category is filled with 50, show a small "+100 bonus" tappable counter next to that player's Yahtzee row, incrementable any number of times. Bonus chips add directly to the grand total.

**Total formula:**
```
upperSubtotal = sum(ones..sixes)
upperBonus = upperSubtotal >= 63 ? 35 : 0
lowerSubtotal = sum(threeOfKind..chance)
yahtzeeBonusTotal = bonusChipCount * 100
grandTotal = upperSubtotal + upperBonus + lowerSubtotal + yahtzeeBonusTotal
```

**Input behavior:** Each category cell accepts a numeric entry (or fixed-value tap for Full House/Small Straight/Large Straight/Yahtzee — present these as a single tap that fills in the known fixed score, with a "didn't make it" / 0 option). Categories can be filled in any order. A category can be left blank (scored as 0) if the player chooses to "scratch" it — this is standard Yahtzee play and should be supported (tapping "Scratch" sets that category to 0 and locks it).

---

### 3.2 Phase 10

**Mode:** `rounds`. **Win condition:** lowest total score. **End condition:** first player to complete Phase 10, OR a configurable round cap as a manual safety valve (default off, see below).

**Per-round flow:**
1. At the start of a round, each player is attempting a specific numbered phase (1–10), tracked individually since players progress at different rates.
2. At the end of the round, for each player record:
   - Did they complete their current phase this round? (yes/no toggle)
   - Their score for the round (sum of points left in hand — see point values below)
3. If "completed phase" = yes, that player's `currentPhase` increments by 1 for the next round. If no, it stays the same (they re-attempt it).

**Round scoring reference (points for cards left in hand), shown as a helper but always manually entered as a single number per player per round:**
| Card | Points |
|---|---|
| 1–9 | 5 each |
| 10–12 | 10 each |
| Skip | 15 each |
| Wild | 25 each |

The app does **not** try to compute this from individual cards in MVP — it's a single numeric entry per player per round (matching how people actually use a Phase 10 score pad). The point table above is shown as an in-app reference/tooltip only.

**Game end:** the game ends when any player completes Phase 10 in a round. At that point the round is finalized for all players (everyone enters their score for that final round) and the game ends — lowest cumulative total wins. The app detects this automatically when a player's `currentPhase` would advance past 10, and prompts "End Game?" with manual confirm (auto-detect + manual end, per requirements).

**Total formula:**
```
totalScore[player] = sum(roundScores[player])
winner = player with min(totalScore)
```

---

### 3.3 Mexican Train Dominoes

**Mode:** `rounds`. **Win condition:** lowest total score. **End condition:** manual (round count is determined by the domino set / number of players and varies by house rules — see note).

**Per-round flow:**
1. Each round corresponds to one "engine" (starting double), traditionally starting at the highest double in the set (e.g., double-12) and counting down to double-0 — meaning the number of rounds depends on the set size, which the app does not track in MVP.
2. At the end of each round, enter each player's score = sum of pips on all dominoes remaining in their hand (the lower, the better — 0 is ideal if they played all their tiles).
3. Running total accumulates across rounds.

**MVP simplification:** because the round count depends on the physical domino set (commonly double-9 or double-12) and house rules vary, the MVP does **not** hardcode a fixed number of rounds or auto-detect game end. The host adds rounds as they're played (tap "+ Add Round") and taps **End Game** manually when the set is exhausted. This is the one template where `endCondition.type = "manual_only"`, same as Generic — the per-game value-add here is purely the round-accumulation UI and pip-count framing, not auto end-detection.

**Total formula:**
```
totalScore[player] = sum(roundScores[player])
winner = player with min(totalScore)
```

---

### 3.4 Generic Scoreboard (fallback)

**Mode:** `rounds`, but simplified to a single running number per player with manual +/- adjustment (no fixed round structure required — a "round" here is just "one score update").

**Behavior:**
- Add any number of players (name only).
- Choose win condition at setup: highest wins or lowest wins (simple toggle).
- Each player has a running total. The host can add a positive or negative delta to any player's score at any time (e.g., tap player → enter +20 or -5 → confirm). There's no fixed "round" concept enforced — it's a free-form ledger.
- End condition: manual only. User taps **End Game**, app declares the winner based on the chosen win condition.

This is the safety net for Hearts, Catan, Wizard, Cribbage, or literally anything else — it intentionally does none of the specialized math those games might want; that's future template work.

---

## 4. User Flows

### 4.1 Start a Game
1. Landing screen: "New Game" (primary action) + "History" (secondary, see §6).
2. Game picker: Yahtzee / Phase 10 / Mexican Train / Generic Scoreboard, shown as cards/tiles.
3. Player setup: add player names (min/max enforced per `GameDefinition`; Generic has no max). For Generic only, also pick win condition (highest/lowest).
4. Tap "Start Game" → enters the live scoring screen for that `GameDefinition`.

### 4.2 Live Scoring
- **Yahtzee:** a scorecard grid — rows = categories, columns = players. Tap a cell to enter/edit that player's score for that category. Running grand total per player always visible (e.g., sticky header or footer row).
- **Phase 10 / Mexican Train:** a round-based table — rows = rounds (newest at top or bottom, TBD in design), columns = players. "+ Add Round" creates a new row prompting entry for each player. Running cumulative total always visible per player. Phase 10 additionally shows each player's current phase number as a badge next to their name.
- **Generic:** a simple list of players with running totals and a +/- adjustment control per player.

At any point: **End Game** button is available. If an end condition auto-triggers, the app surfaces a non-blocking "Looks like the game might be over — [Player] reached the win condition" banner with a confirm/dismiss, rather than forcing a hard stop (so a Phase 10 game doesn't get force-ended if someone wants to keep playing/fix an entry).

### 4.3 Game Over
- Show final standings (sorted by win condition), winner highlighted.
- Buttons: "New Game" (same game, fresh players) and "Done" (return to landing).
- On reaching this screen, the session is written to history automatically (see §6) — no separate save step.

---

## 5. Calculation & Validation Rules Summary

| Game | Auto-calculated | User-entered |
|---|---|---|
| Yahtzee | Upper bonus (≥63 → +35), grand total, Yahtzee bonus chip total | Each category's raw score, bonus chip taps, scratches |
| Phase 10 | Cumulative total, phase progression (on "completed phase" toggle) | Per-round score, completed-phase yes/no |
| Mexican Train | Cumulative total | Per-round pip score |
| Generic | Running total | Each delta adjustment |

**Validation (MVP-minimal):**
- Numeric entries must be ≥ 0 (Generic allows negative deltas, but resulting totals can go negative if the win condition is "lowest" — that's valid).
- Yahtzee fixed-value categories (Full House, Small/Large Straight, Yahtzee) only allow their fixed value or 0 — no free numeric entry, to prevent typos.
- Can't start a game with fewer than `minPlayers`.

---

## 6. History

- On every "Game Over," write a lightweight record to local history:
  ```ts
  type HistoryEntry = {
    sessionId: string;
    gameId: string;
    gameName: string;
    playerNames: string[];
    winnerName: string;
    finalScores: Record<string, number>; // playerName -> score
    completedAt: string; // ISO timestamp
  };
  ```
- History screen: reverse-chronological list, shows game name, date, winner, and final scores on tap/expand.
- No editing of history entries in MVP. No delete-all/clear option required for MVP (could be a fast follow if storage limits become a concern, which is unlikely at this data size).

---

## 7. Technical Architecture (MVP)

### 7.1 Stack recommendation
- **Frontend-only web app.** No backend required for MVP since there are no accounts and no cross-device sync.
- Framework: React (matches the "web-first, mobile later" goal and keeps a path open to wrapping in React Native or a Capacitor shell for a mobile app later without a full rewrite).
- State management: local component state + React Context for the active `GameSession`; no need for Redux/Zustand at this scope.
- Persistence: `localStorage` (or `IndexedDB` if data size/complexity warrants it — for MVP, `localStorage` with JSON serialization is sufficient given the small data volume of a few games' worth of history).
- Routing: simple client-side router (e.g., react-router) for landing / game-picker / live-scoring / history screens.

### 7.2 Why no backend
Given the constraints settled in scoping (no accounts, single-device pass-and-play, no real-time multi-device sync), there's no server-side responsibility left — no auth, no data needing to live anywhere but the user's own browser. This keeps the MVP fast to build and free to host (static hosting). The architecture should still isolate persistence behind a small storage interface (e.g., a `StorageAdapter` with `getHistory()`, `saveSession()`, etc.) so that swapping `localStorage` for a real backend later — if accounts/sync become a v2 feature — doesn't require rewriting the UI layer.

### 7.3 Adding future game templates
Because `GameDefinition` + the `categories`/`rounds` mode split already generalizes across a "form with a formula" game (Yahtzee) and two "round accumulator" games with different end conditions (Phase 10, Mexican Train), adding a new game in v2 (Hearts, Wizard, Catan, Cribbage) should mean:
1. Writing a new `GameDefinition` (config only, in most cases).
2. Possibly adding a new `EndCondition` variant if the win/end logic is genuinely novel (e.g., Hearts' "shoot the moon" reversal isn't covered by anything above and would need new logic — flagged here as a known future gap, not an MVP concern).

---

## 8. Open Questions / Risks for Post-MVP

- **Mexican Train round count:** MVP punts on this (manual end only). If users want auto-detection, we'd need to ask the set size (double-6/9/12) during setup.
- **Phase 10 fixed-round fallback:** if no one ever completes phase 10 (rare but possible with house rules), there's currently no fallback end condition. Manual End Game covers this, but worth confirming that's acceptable rather than adding a round cap.
- **Local-only storage tradeoff:** clearing browser data wipes history. Acceptable for MVP per scoping discussion; revisit if users ask for export or backup.
- **Mobile app packaging:** spec assumes responsive web first; wrapping as a native app (Capacitor/React Native) is a v2 decision, not blocking MVP.

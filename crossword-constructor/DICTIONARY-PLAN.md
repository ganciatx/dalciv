# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Expand Crosscreate's ~15k curated local word list by integrating [FreeDictionaryAPI.com](https://freedictionaryapi.com/) (primary) and [dictionaryapi.dev](https://dictionaryapi.dev/) (fallback) for on-demand English word lookup, validation, and import into IndexedDB. Local pattern search stays offline-first; online APIs fill gaps when a constructor needs to verify or add a word that isn't already in the dictionary.

## Critical Decisions

- **FreeDictionaryAPI.com primary, dictionaryapi.dev fallback** — Larger corpus (8.5M+ Wiktionary entries), documented CORS/rate limits; dictionaryapi.dev covers outages and 429s with a simpler response shape.
- **On-demand import, not bulk sync** — APIs are per-word lookups (no wildcard/pattern search). Respects the 1,000 req/hr IP limit and keeps the app offline-capable for normal fill work.
- **Map API hits to existing `WordEntry` shape** — Reuse heuristic scoring/tags (extract from `scripts/generate-words.mjs` into shared `scoreWord` logic); infer `proper_noun` from capitalized lemma or API tags where available.
- **Refresh `puzzleStore.wordLookup` after import** — Call existing `loadAllWords` + `setWordLookup` so grid validation, fill assist, and Words search see new entries immediately.
- **Attribution in UI** — Small footer note in Words workspace linking to FreeDictionaryAPI.com / Wiktionary (CC BY-SA 4.0), per API license requirements.

## Tasks

- [x] 🟩 **Step 1: Dictionary API client**
  - [x] 🟩 Add `lib/dictionaryApi.ts`: `lookupWord(word)` → normalized result or `null`
  - [x] 🟩 Primary fetch: `GET https://freedictionaryapi.com/api/v1/entries/en/{word}`
  - [x] 🟩 Fallback fetch: `GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}` on 404/429/network error
  - [x] 🟩 Reject non-crossword words: uppercase A–Z only, length 3–15, no multi-word lemmas
  - [x] 🟩 Unit tests with mocked fetch for success, not-found, fallback, and invalid input

- [x] 🟩 **Step 2: Import pipeline**
  - [x] 🟩 Extract shared `scoreWord(word, tags?)` from `scripts/generate-words.mjs` into `lib/wordScoring.ts` (script imports it)
  - [x] 🟩 Add `importWordFromDictionary(word)` in `wordDb.ts`: lookup → build `WordEntry` → `upsertWord` → return entry
  - [x] 🟩 Skip upsert if word already exists locally (return existing entry)
  - [x] 🟩 Unit tests for scoring and import idempotency

- [x] 🟩 **Step 3: Store refresh hook**
  - [x] 🟩 Add `refreshWordLookup()` helper (or store action) that reloads IndexedDB entries into `wordLookup`
  - [x] 🟩 Call after successful dictionary import from UI

- [x] 🟩 **Step 4: Words workspace UI**
  - [x] 🟩 Add "Look up word" field + button below pattern search (exact word, not pattern)
  - [x] 🟩 Show lookup state: loading, found (definitions snippet optional), not found, rate-limited
  - [x] 🟩 "Add to dictionary" button on successful lookup (disabled if already local)
  - [x] 🟩 Attribution line for FreeDictionaryAPI.com / Wiktionary
  - [x] 🟩 Update `helpContent.ts` with new control descriptions

- [x] 🟩 **Step 5: Grid integration (minimal)**
  - [x] 🟩 In `WordEntryPanel`, when pattern search returns no matches and slot is fully filled (no `?`), offer "Look up `{WORD}` online" using same import flow
  - [x] 🟩 On successful import, re-run fill search so the word appears in suggestions

- [x] 🟩 **Step 6: Verify**
  - [x] 🟩 Vitest passes for new modules
  - [x] 🟩 Manual smoke test: look up unknown word → add → appears in Words search and fill panel
  - [x] 🟩 `npm run build` succeeds

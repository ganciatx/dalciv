# Crossword Clue/Answer Database

SQLite database for constructor workflows: pattern fill on answers, many clues per answer, per-publication difficulty, theme tags, and clue reuse tracking.

This is separate from the app's browser **IndexedDB** word list (`public/data/words.json`). The clue bank lives here for editorial work and will power a future CRUD GUI.

## Quick open (DB Browser for SQLite)

1. Launch **DB Browser for SQLite**
2. **Open Database** → select:

   `crossword-constructor/database/crossword.db`

3. Browse tables or run queries from the **Execute SQL** tab

See [QUERY_GUIDE.md](./QUERY_GUIDE.md) for common constructor queries (pattern fill, freshness checks, themed Monday builds, etc.).

## Command line

```bash
cd crossword-constructor/database
sqlite3 crossword.db
```

Example pattern fill (7 letters, E at 2, A at 5):

```sql
SELECT answer_text FROM answers
WHERE length = 7 AND answer_text LIKE '_E__A__';
```

## Recreate from scratch

Default build loads the **large curated dataset** (~120 answers, 300+ clues, auto-generated difficulty and usage history):

```bash
cd crossword-constructor/database
./setup.sh
```

Small demo seed (11 answers, 21 clues):

```bash
./setup.sh --demo
```

Or manually:

```bash
python3 load_large_dataset.py   # full dataset
# or
rm -f crossword.db && sqlite3 crossword.db < schema.sql && python3 seed_data.py
```

## Files

| File | Purpose |
|------|---------|
| `crossword.db` | Live SQLite database |
| `schema.sql` | Table definitions, indexes, `v_clue_catalog` view |
| `large_dataset.py` | Curated answers/clues organized by theme |
| `load_large_dataset.py` | Full rebuild: schema + large dataset + difficulty/usage |
| `seed_data.py` | Small hand-authored demo (use with `--demo`) |
| `QUERY_GUIDE.md` | Query cookbook for day-to-day constructor work |
| `setup.sh` | One-command rebuild |

## Schema overview

| Table | Purpose |
|-------|---------|
| `answers` | Unique grid entries; pattern-searchable by `length` + `answer_text` |
| `clues` | Many clues per answer; type, author, originality |
| `publications` / `publication_slots` | Venues and day/difficulty bands (e.g. NYT Monday vs Saturday) |
| `clue_difficulty` | Difficulty per clue **per publication slot** |
| `themes` | Tag vocabulary |
| `clue_themes` / `answer_themes` | Many-to-many tagging |
| `clue_usage_log` | Historical appearances for freshness / reuse checks |
| `v_clue_catalog` | Flattened browse view |

## Dataset (default)

- 4 publications (NYT, LA Times, USA Today, Indie) with day/slot bands
- 10 themes (Food & Drink, Geography, U.S. Presidents, 90s Pop Culture, etc.)
- ~120 answers across lengths 3–8, each with 2–4 varied clues
- Auto-assigned per-venue difficulty (heuristic from notoriety + clue type)
- Simulated usage log (2014–2026) for freshness/reuse queries

Use `./setup.sh --demo` for the smaller 11-answer hand-authored sample.

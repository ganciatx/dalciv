# Crossword Clue/Answer Database — Query Cookbook

Database file: `crossword.db` (SQLite). Open with any SQLite client, or:
```
sqlite3 crossword.db
```
or in Python:
```python
import sqlite3
conn = sqlite3.connect("crossword.db")
```

---

## 1. Pattern fill (the #1 constructor query)

Find every 7-letter answer where you already know letters 2 and 5 are 'E' and 'A':
```sql
SELECT answer_text, length
FROM answers
WHERE length = 7
  AND answer_text LIKE '_E__A__';
```

Add a "common/fair only" filter using notoriety_score:
```sql
SELECT answer_text
FROM answers
WHERE length = 5 AND answer_text LIKE '_B__A'
  AND notoriety_score >= 0.7;
```

## 2. All clues for a given answer, with difficulty by venue

```sql
SELECT clue_text, publication, slot, difficulty
FROM v_clue_catalog
WHERE answer_text = 'APPLE'
ORDER BY difficulty;
```

## 3. Freshness check — avoid clue reuse

Clues for a given answer NOT used anywhere in the last N years:
```sql
SELECT a.answer_text, c.clue_text,
       (SELECT MAX(u.used_on) FROM clue_usage_log u WHERE u.clue_id = c.clue_id) AS last_used
FROM clues c
JOIN answers a ON a.answer_id = c.answer_id
WHERE a.answer_text = 'OREO'
  AND c.clue_id NOT IN (
      SELECT clue_id FROM clue_usage_log
      WHERE used_on > date('now', '-5 years')
  );
```

Clues used in a SPECIFIC publication within the last N years (for a "don't repeat at this venue" check):
```sql
SELECT a.answer_text, c.clue_text, u.used_on, p.name AS publication
FROM clue_usage_log u
JOIN clues c ON c.clue_id = u.clue_id
JOIN answers a ON a.answer_id = c.answer_id
JOIN publication_slots ps ON ps.slot_id = u.slot_id
JOIN publications p ON p.publication_id = ps.publication_id
WHERE p.name = 'NYT'
  AND u.used_on > date('now', '-5 years');
```

## 4. Browse by theme

```sql
SELECT DISTINCT a.answer_text, c.clue_text
FROM clue_themes ct
JOIN themes t ON t.theme_id = ct.theme_id
JOIN clues c ON c.clue_id = ct.clue_id
JOIN answers a ON a.answer_id = c.answer_id
WHERE t.theme_name = 'Beginner-Friendly'
ORDER BY a.answer_text;
```

Answer-level theme (e.g. "give me every answer tagged Geography" regardless of which clue is used):
```sql
SELECT a.answer_text
FROM answer_themes at
JOIN themes t ON t.theme_id = at.theme_id
JOIN answers a ON a.answer_id = at.answer_id
WHERE t.theme_name = 'Geography';
```

## 5. Build a themed Monday puzzle (easy + on-theme)

```sql
SELECT a.answer_text, c.clue_text, cd.difficulty
FROM clues c
JOIN answers a ON a.answer_id = c.answer_id
JOIN clue_difficulty cd ON cd.clue_id = c.clue_id
JOIN publication_slots ps ON ps.slot_id = cd.slot_id
JOIN clue_themes ct ON ct.clue_id = c.clue_id
JOIN themes t ON t.theme_id = ct.theme_id
WHERE ps.slot_name = 'Monday'
  AND cd.difficulty <= 2
  AND t.theme_name = 'Food & Drink';
```

## 6. Find answers with NO easy clue yet (a gap in your clue bank)

Useful for spotting where you need to write a new beginner-friendly clue:
```sql
SELECT a.answer_text
FROM answers a
WHERE a.answer_id NOT IN (
    SELECT c.answer_id
    FROM clues c
    JOIN clue_difficulty cd ON cd.clue_id = c.clue_id
    WHERE cd.difficulty <= 2
);
```

## 7. Most overused clues (candidates to retire)

```sql
SELECT a.answer_text, c.clue_text, COUNT(u.usage_id) AS times_used
FROM clue_usage_log u
JOIN clues c ON c.clue_id = u.clue_id
JOIN answers a ON a.answer_id = c.answer_id
GROUP BY c.clue_id
ORDER BY times_used DESC
LIMIT 10;
```

## 8. Add a new answer + clue (typical write path)

```sql
INSERT INTO answers (answer_text, display_text, length, is_proper_noun, notoriety_score)
VALUES ('TOFU', 'TOFU', 4, 0, 0.7);

INSERT INTO clues (answer_id, clue_text, clue_type, author)
VALUES (
    (SELECT answer_id FROM answers WHERE answer_text = 'TOFU'),
    'Soy-based protein source',
    'definition',
    'Your Name'
);

-- tag it
INSERT INTO clue_themes (clue_id, theme_id)
VALUES (
    (SELECT clue_id FROM clues WHERE clue_text = 'Soy-based protein source'),
    (SELECT theme_id FROM themes WHERE theme_name = 'Food & Drink')
);

-- rate it for a venue
INSERT INTO clue_difficulty (clue_id, slot_id, difficulty)
VALUES (
    (SELECT clue_id FROM clues WHERE clue_text = 'Soy-based protein source'),
    (SELECT slot_id FROM publication_slots ps JOIN publications p ON p.publication_id = ps.publication_id
        WHERE p.name = 'NYT' AND ps.slot_name = 'Tuesday'),
    1
);
```

## 9. Log a real-world usage (after a puzzle is published)

```sql
INSERT INTO clue_usage_log (clue_id, slot_id, used_on, puzzle_label, grid_position)
VALUES (
    (SELECT clue_id FROM clues WHERE clue_text = 'Soy-based protein source'),
    (SELECT slot_id FROM publication_slots ps JOIN publications p ON p.publication_id = ps.publication_id
        WHERE p.name = 'NYT' AND ps.slot_name = 'Tuesday'),
    '2026-08-04',
    'NYT 2026-08-04',
    '12-Down'
);
```

---

## Schema summary

| Table | Purpose |
|---|---|
| `answers` | One row per unique grid answer. Pattern-searchable (length + letters). |
| `clues` | Many clues per answer. Has clue_type, author, originality flag. |
| `publications` | Outlets (NYT, LA Times, USA Today, indie). |
| `publication_slots` | Day/difficulty-band within a publication (NYT Monday vs Saturday). |
| `clue_difficulty` | Junction: difficulty is per clue **per publication slot**, not fixed to the clue. |
| `themes` | Tag vocabulary, with a category (subject / wordplay mechanism / era / audience). |
| `clue_themes` / `answer_themes` | Many-to-many tagging at clue level and answer level. |
| `clue_usage_log` | Historical real-world appearances — powers freshness/reuse checks. |
| `v_clue_catalog` | Flattened view joining everything for easy browsing. |

**Key design decisions:**
- Difficulty lives on `clue_difficulty`, keyed to `(clue, publication_slot)` — so the same clue can be Monday-easy at USA Today and Friday-hard at NYT simultaneously.
- Clues are separate from answers because the real editorial asset is the *clue*, not the answer — "OREO" is trivial, but a good fresh clue for it is the hard part.
- Themes tag both clues (wordplay angle) and answers (inherent subject), since these are different things — "Anagram" is a clue mechanism; "Geography" is an answer property.
- `notoriety_score` on answers is separate from clue difficulty — an answer can be obscure (low notoriety) but still get an easy, well-written clue, or vice versa.

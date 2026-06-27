import random
import sqlite3
from datetime import date, timedelta
from pathlib import Path

from large_dataset import DATASET, build_inserts

random.seed(42)

SCRIPT_DIR = Path(__file__).resolve().parent
DB_PATH = SCRIPT_DIR / "crossword.db"

if DB_PATH.exists():
    DB_PATH.unlink()

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# ---------- Rebuild schema from scratch ----------
with open(SCRIPT_DIR / "schema.sql") as f:
    cur.executescript(f.read())

# ---------- Publications & slots (same as before) ----------
publications = [
    ("NYT", "15x15 (Mon-Sat), 21x21 (Sun)", "The benchmark; difficulty ramps Mon->Sat"),
    ("LA Times", "15x15", "Generally gentler than NYT at equivalent day"),
    ("USA Today", "15x15", "Consistently easy/breezy across the week"),
    ("Indie/Self-published", "Varies", "Constructor-set difficulty, no house style"),
]
cur.executemany("INSERT INTO publications (name, typical_grid_size, notes) VALUES (?,?,?)", publications)

slots = [
    ("NYT", "Monday", 1), ("NYT", "Tuesday", 1), ("NYT", "Wednesday", 2),
    ("NYT", "Thursday", 3), ("NYT", "Friday", 4), ("NYT", "Saturday", 5), ("NYT", "Sunday", 3),
    ("LA Times", "Standard", 2),
    ("USA Today", "Standard", 1),
    ("Indie/Self-published", "Standard", 3),
]
pub_ids = dict(cur.execute("SELECT name, publication_id FROM publications").fetchall())
cur.executemany(
    "INSERT INTO publication_slots (publication_id, slot_name, baseline_difficulty) VALUES (?,?,?)",
    [(pub_ids[pub], slot, diff) for pub, slot, diff in slots],
)
cur.execute("""SELECT ps.slot_id, pub.name, ps.slot_name
               FROM publication_slots ps JOIN publications pub
               ON pub.publication_id = ps.publication_id""")
slot_ids = {(p, s): sid for sid, p, s in cur.fetchall()}
all_slot_keys = list(slot_ids.keys())

# ---------- Themes ----------
themes = [
    ("Food & Drink", "subject", "Culinary answers and clues"),
    ("Wordplay: Homophone", "wordplay_mechanism", "Clue relies on sound-alike words"),
    ("Wordplay: Anagram", "wordplay_mechanism", "Clue signals letters are rearranged"),
    ("90s Pop Culture", "era", "References from the 1990s"),
    ("Geography", "subject", "Places, countries, capitals"),
    ("U.S. Presidents", "subject", "Presidents and presidential trivia"),
    ("Music", "subject", "Songs, artists, instruments"),
    ("Beginner-Friendly", "audience", "Low cultural-literacy barrier to entry"),
    ("Brand Names", "subject", "Commercial brands and products"),
    ("Classic Literature", "subject", "Books, authors, literary references"),
]
cur.executemany("INSERT INTO themes (theme_name, theme_category, description) VALUES (?,?,?)", themes)
theme_ids = dict(cur.execute("SELECT theme_name, theme_id FROM themes").fetchall())

# ---------- Load large dataset ----------
answers, clues, answer_theme_links, clue_theme_links = build_inserts()

cur.executemany(
    """INSERT INTO answers (answer_text, display_text, length, is_proper_noun, is_abbreviation, is_multiword, notoriety_score)
       VALUES (?,?,?,?,?,?,?)""",
    answers,
)
answer_ids = dict(cur.execute("SELECT answer_text, answer_id FROM answers").fetchall())

# Clues: insert one row per (answer, clue_text) and remember its NEW clue_id.
# Clue text is not globally unique (different answers could reuse phrasing),
# so we always insert and use cursor.lastrowid rather than looking up by text.
clue_id_by_key = {}  # (answer_text, clue_text) -> clue_id
for ans, clue_text, ctype, cap in clues:
    cur.execute(
        "INSERT INTO clues (answer_id, clue_text, clue_type, requires_capitalization, author) VALUES (?,?,?,?,?)",
        (answer_ids[ans], clue_text, ctype, cap, "House style"),
    )
    clue_id_by_key[(ans, clue_text)] = cur.lastrowid

# ---------- Theme links ----------
at_rows = [(answer_ids[ans], theme_ids[theme]) for ans, theme in answer_theme_links if theme in theme_ids]
cur.executemany("INSERT OR IGNORE INTO answer_themes (answer_id, theme_id) VALUES (?,?)", at_rows)

# clue_theme_links from build_inserts() loses the answer key on duplicate clue
# text, so rebuild precisely here using the original DATASET (answer-scoped).
ct_rows = []
for ans, disp, proper, abbr, multi, notor, themes_for_answer, clue_list in DATASET:
    for clue_text, ctype, cap in clue_list:
        cid = clue_id_by_key[(ans, clue_text)]
        for theme in themes_for_answer:
            if theme in theme_ids:
                ct_rows.append((cid, theme_ids[theme]))
cur.executemany("INSERT OR IGNORE INTO clue_themes (clue_id, theme_id) VALUES (?,?)", ct_rows)

# ---------- Difficulty assignment ----------
# Heuristic: base difficulty derived from (1 - notoriety) and clue_type,
# then jittered per publication slot so the same clue isn't identically
# rated everywhere -- mirrors how real outlets diverge.
TYPE_DIFFICULTY_BUMP = {
    "straight": 0, "definition": 0, "fill_in_blank": 0,
    "abbreviation": 0, "trivia": 1, "wordplay": 1, "pun": 1,
    "anagram": 1, "foreign_language": 1, "cross_reference": 2,
}

notoriety_by_answer = {a[0]: a[5] for a in answers}

def base_difficulty(answer_text, ctype):
    notor = notoriety_by_answer[answer_text]
    base = round((1 - notor) * 4) + 1  # notoriety 1.0 -> 1, notoriety 0.3 -> ~4
    base += TYPE_DIFFICULTY_BUMP.get(ctype, 0)
    return max(1, min(5, base))

# Each clue gets rated in 1-3 random publication slots (not all 10),
# matching how a real clue bank only has data where it's actually been vetted/used.
diff_rows = []
for ans, clue_text, ctype, cap in clues:
    cid = clue_id_by_key[(ans, clue_text)]
    n_slots = random.choice([1, 1, 2, 2, 3])
    chosen_slots = random.sample(all_slot_keys, k=min(n_slots, len(all_slot_keys)))
    for pub, slot in chosen_slots:
        sid = slot_ids[(pub, slot)]
        b = base_difficulty(ans, ctype)
        jitter = random.choice([-1, 0, 0, 0, 1])
        diff = max(1, min(5, b + jitter))
        diff_rows.append((cid, sid, diff, "auto"))

cur.executemany(
    "INSERT OR IGNORE INTO clue_difficulty (clue_id, slot_id, difficulty, rated_by) VALUES (?,?,?,?)",
    diff_rows,
)

# ---------- Usage log: plausible historical appearances ----------
# About 45% of clues have been used at least once; some 1x, fewer 2x, a rare few 3x+.
START_DATE = date(2014, 1, 1)
END_DATE = date(2026, 6, 1)
span_days = (END_DATE - START_DATE).days

GRID_LABELS = [f"{n}-Across" for n in (1, 4, 7, 12, 14, 17, 22, 28, 33, 38, 42, 47, 53, 58, 61, 65)]
GRID_LABELS += [f"{n}-Down" for n in (2, 5, 9, 13, 16, 19, 24, 29, 34, 39, 44, 48, 54, 59, 62, 66)]

usage_rows = []
for ans, clue_text, ctype, cap in clues:
    cid = clue_id_by_key[(ans, clue_text)]
    roll = random.random()
    if roll < 0.55:
        n_uses = 0
    elif roll < 0.85:
        n_uses = 1
    elif roll < 0.96:
        n_uses = 2
    else:
        n_uses = 3
    # only log usage in slots this clue actually has a difficulty rating for,
    # mirroring real life: you log appearances where you have venue context
    rated_slots = [r[1] for r in diff_rows if r[0] == cid]
    if not rated_slots or n_uses == 0:
        continue
    used_dates = sorted(random.sample(range(span_days), k=min(n_uses, span_days)))
    for offset in used_dates:
        used_on = (START_DATE + timedelta(days=offset)).isoformat()
        sid = random.choice(rated_slots)
        pub_name = [p for (p, s), v in slot_ids.items() if v == sid][0]
        label = f"{pub_name} {used_on}"
        position = random.choice(GRID_LABELS)
        usage_rows.append((cid, sid, used_on, label, position))

cur.executemany(
    "INSERT INTO clue_usage_log (clue_id, slot_id, used_on, puzzle_label, grid_position) VALUES (?,?,?,?,?)",
    usage_rows,
)

conn.commit()

print("=== Load complete ===")
print("Answers:", cur.execute("SELECT COUNT(*) FROM answers").fetchone()[0])
print("Clues:", cur.execute("SELECT COUNT(*) FROM clues").fetchone()[0])
print("Difficulty ratings:", cur.execute("SELECT COUNT(*) FROM clue_difficulty").fetchone()[0])
print("Answer-theme links:", cur.execute("SELECT COUNT(*) FROM answer_themes").fetchone()[0])
print("Clue-theme links:", cur.execute("SELECT COUNT(*) FROM clue_themes").fetchone()[0])
print("Usage log rows:", cur.execute("SELECT COUNT(*) FROM clue_usage_log").fetchone()[0])

print("\nLength distribution:")
for length, n in cur.execute("SELECT length, COUNT(*) FROM answers GROUP BY length ORDER BY length"):
    print(f"  {length} letters: {n}")

print("\nFK integrity check:")
issues = cur.execute("PRAGMA foreign_key_check").fetchall()
print("  No violations" if not issues else f"  {len(issues)} VIOLATIONS: {issues}")

conn.close()

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "crossword.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# ---------- Publications & slots ----------
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
slot_rows = [(pub_ids[pub], slot, diff) for pub, slot, diff in slots]
cur.executemany(
    "INSERT INTO publication_slots (publication_id, slot_name, baseline_difficulty) VALUES (?,?,?)",
    slot_rows,
)
slot_ids = {(p, s): sid for sid, p, s in
            cur.execute("""SELECT ps.slot_id, pub.name, ps.slot_name
                           FROM publication_slots ps JOIN publications pub
                           ON pub.publication_id = pub.publication_id""").fetchall()}
# rebuild properly with correct join
cur.execute("""SELECT ps.slot_id, pub.name, ps.slot_name
               FROM publication_slots ps JOIN publications pub
               ON pub.publication_id = ps.publication_id""")
slot_ids = {(p, s): sid for sid, p, s in cur.fetchall()}

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

# ---------- Answers ----------
answers = [
    # text, display, length, proper_noun, abbrev, multiword, notoriety
    ("OREO", "OREO", 4, 0, 0, 0, 0.95),
    ("ERNIE", "ERNIE", 5, 1, 0, 0, 0.85),
    ("APPLE", "APPLE", 5, 0, 0, 0, 0.97),
    ("OBAMA", "OBAMA", 5, 1, 0, 0, 0.96),
    ("ELSA", "ELSA", 4, 1, 0, 0, 0.80),
    ("ETUI", "ETUI", 4, 0, 0, 0, 0.30),
    ("ANAGRAM", "ANAGRAM", 7, 0, 0, 0, 0.60),
    ("NILE", "NILE", 4, 1, 0, 0, 0.90),
    ("IPOD", "IPOD", 4, 0, 0, 0, 0.85),
    ("SEUSS", "SEUSS", 5, 1, 0, 0, 0.88),
    ("NEWYORK", "NEW YORK", 7, 1, 0, 1, 0.97),
]
cur.executemany(
    """INSERT INTO answers (answer_text, display_text, length, is_proper_noun, is_abbreviation, is_multiword, notoriety_score)
       VALUES (?,?,?,?,?,?,?)""",
    answers,
)
answer_ids = dict(cur.execute("SELECT answer_text, answer_id FROM answers").fetchall())

# ---------- Clues ----------
# (answer_text, clue_text, clue_type, requires_cap, author)
clues = [
    ("OREO", "Cookie with a creme center", "straight", 0, "House style"),
    ("OREO", "Snack often dunked in milk", "definition", 0, "House style"),
    ("OREO", "Twist-apart treat", "straight", 0, "J. Echols"),
    ("ERNIE", "Bert's roommate", "straight", 1, "House style"),
    ("ERNIE", "___ and Bert", "fill_in_blank", 1, "House style"),
    ("APPLE", "iPhone maker", "straight", 0, "House style"),
    ("APPLE", "Newton's reported inspiration", "trivia", 0, "House style"),
    ("APPLE", "Teacher's traditional gift", "straight", 0, "House style"),
    ("OBAMA", "44th U.S. president", "straight", 1, "House style"),
    ("OBAMA", "Michelle's husband", "straight", 1, "House style"),
    ("ELSA", "Frozen queen with icy powers", "straight", 1, "House style"),
    ("ELSA", "Lion in 'Born Free'", "trivia", 1, "House style"),
    ("ETUI", "Small sewing kit case", "definition", 0, "House style"),
    ("ANAGRAM", "Word puzzle using rearranged letters", "definition", 0, "House style"),
    ("ANAGRAM", "'Stop' rearranged into 'pots,' e.g.", "wordplay", 0, "J. Echols"),
    ("NILE", "Longest river in Africa", "straight", 1, "House style"),
    ("NILE", "River through Cairo", "straight", 1, "House style"),
    ("IPOD", "Discontinued Apple music player", "straight", 1, "House style"),
    ("SEUSS", "'Cat in the Hat' author, familiarly", "straight", 1, "House style"),
    ("NEWYORK", "Empire State", "straight", 1, "House style"),
    ("NEWYORK", "Home of the Yankees and Mets", "straight", 1, "House style"),
]
clue_rows = [(answer_ids[ans], text, ctype, cap, author) for ans, text, ctype, cap, author in clues]
cur.executemany(
    "INSERT INTO clues (answer_id, clue_text, clue_type, requires_capitalization, author) VALUES (?,?,?,?,?)",
    clue_rows,
)
clue_ids = dict(cur.execute("SELECT clue_text, clue_id FROM clues").fetchall())

# ---------- Clue difficulty (per clue, per pub slot) ----------
difficulty_entries = [
    ("Cookie with a creme center", ("NYT", "Monday"), 1),
    ("Cookie with a creme center", ("USA Today", "Standard"), 1),
    ("Snack often dunked in milk", ("NYT", "Tuesday"), 1),
    ("Twist-apart treat", ("NYT", "Thursday"), 3),
    ("Bert's roommate", ("NYT", "Monday"), 1),
    ("___ and Bert", ("NYT", "Wednesday"), 2),
    ("iPhone maker", ("NYT", "Monday"), 1),
    ("Newton's reported inspiration", ("NYT", "Friday"), 4),
    ("Teacher's traditional gift", ("USA Today", "Standard"), 1),
    ("44th U.S. president", ("NYT", "Monday"), 1),
    ("Michelle's husband", ("NYT", "Wednesday"), 2),
    ("Frozen queen with icy powers", ("USA Today", "Standard"), 1),
    ("Lion in 'Born Free'", ("NYT", "Saturday"), 5),
    ("Small sewing kit case", ("NYT", "Friday"), 4),
    ("Word puzzle using rearranged letters", ("NYT", "Tuesday"), 2),
    ("'Stop' rearranged into 'pots,' e.g.", ("Indie/Self-published", "Standard"), 3),
    ("Longest river in Africa", ("NYT", "Monday"), 1),
    ("River through Cairo", ("LA Times", "Standard"), 2),
    ("Discontinued Apple music player", ("NYT", "Wednesday"), 2),
    ("'Cat in the Hat' author, familiarly", ("NYT", "Tuesday"), 2),
    ("Empire State", ("NYT", "Monday"), 1),
    ("Home of the Yankees and Mets", ("USA Today", "Standard"), 1),
]
diff_rows = [(clue_ids[text], slot_ids[pubslot], diff) for text, pubslot, diff in difficulty_entries]
cur.executemany(
    "INSERT INTO clue_difficulty (clue_id, slot_id, difficulty) VALUES (?,?,?)", diff_rows
)

# ---------- Clue themes ----------
clue_theme_links = [
    ("Cookie with a creme center", "Food & Drink"),
    ("Cookie with a creme center", "Beginner-Friendly"),
    ("Snack often dunked in milk", "Food & Drink"),
    ("Twist-apart treat", "Food & Drink"),
    ("Bert's roommate", "90s Pop Culture"),
    ("Bert's roommate", "Beginner-Friendly"),
    ("iPhone maker", "Brand Names"),
    ("iPhone maker", "Beginner-Friendly"),
    ("Teacher's traditional gift", "Beginner-Friendly"),
    ("44th U.S. president", "U.S. Presidents"),
    ("44th U.S. president", "Beginner-Friendly"),
    ("Michelle's husband", "U.S. Presidents"),
    ("Frozen queen with icy powers", "Beginner-Friendly"),
    ("Word puzzle using rearranged letters", "Wordplay: Anagram"),
    ("'Stop' rearranged into 'pots,' e.g.", "Wordplay: Anagram"),
    ("Longest river in Africa", "Geography"),
    ("Longest river in Africa", "Beginner-Friendly"),
    ("River through Cairo", "Geography"),
    ("Discontinued Apple music player", "Brand Names"),
    ("'Cat in the Hat' author, familiarly", "Classic Literature"),
    ("Empire State", "Geography"),
    ("Home of the Yankees and Mets", "Geography"),
    ("Home of the Yankees and Mets", "Beginner-Friendly"),
]
ct_rows = [(clue_ids[text], theme_ids[theme]) for text, theme in clue_theme_links]
cur.executemany("INSERT INTO clue_themes (clue_id, theme_id) VALUES (?,?)", ct_rows)

# ---------- Answer-level themes ----------
answer_theme_links = [
    ("OREO", "Food & Drink"),
    ("ERNIE", "90s Pop Culture"),
    ("APPLE", "Brand Names"),
    ("OBAMA", "U.S. Presidents"),
    ("ELSA", "90s Pop Culture"),  # also relevant to modern Disney, kept simple for demo
    ("NILE", "Geography"),
    ("IPOD", "Brand Names"),
    ("SEUSS", "Classic Literature"),
    ("NEWYORK", "Geography"),
]
at_rows = [(answer_ids[ans], theme_ids[theme]) for ans, theme in answer_theme_links]
cur.executemany("INSERT INTO answer_themes (answer_id, theme_id) VALUES (?,?)", at_rows)

# ---------- Usage log (real-world appearances, for freshness checks) ----------
usage = [
    ("Cookie with a creme center", ("NYT", "Monday"), "2019-03-04", "NYT 2019-03-04", "27-Down"),
    ("Cookie with a creme center", ("USA Today", "Standard"), "2022-07-11", "USAT 2022-07-11", "5-Across"),
    ("iPhone maker", ("NYT", "Monday"), "2021-01-18", "NYT 2021-01-18", "1-Across"),
    ("iPhone maker", ("NYT", "Monday"), "2024-02-26", "NYT 2024-02-26", "14-Across"),
    ("44th U.S. president", ("NYT", "Monday"), "2017-11-06", "NYT 2017-11-06", "38-Across"),
    ("Bert's roommate", ("NYT", "Monday"), "2015-09-21", "NYT 2015-09-21", "3-Down"),
    ("Longest river in Africa", ("NYT", "Monday"), "2020-05-04", "NYT 2020-05-04", "42-Across"),
]
usage_rows = [(clue_ids[text], slot_ids[pubslot], date, label, pos) for text, pubslot, date, label, pos in usage]
cur.executemany(
    "INSERT INTO clue_usage_log (clue_id, slot_id, used_on, puzzle_label, grid_position) VALUES (?,?,?,?,?)",
    usage_rows,
)

conn.commit()
print("Seed complete.")
print("Answers:", cur.execute("SELECT COUNT(*) FROM answers").fetchone()[0])
print("Clues:", cur.execute("SELECT COUNT(*) FROM clues").fetchone()[0])
print("Difficulty ratings:", cur.execute("SELECT COUNT(*) FROM clue_difficulty").fetchone()[0])
print("Theme tags (clue):", cur.execute("SELECT COUNT(*) FROM clue_themes").fetchone()[0])
print("Usage log rows:", cur.execute("SELECT COUNT(*) FROM clue_usage_log").fetchone()[0])
conn.close()

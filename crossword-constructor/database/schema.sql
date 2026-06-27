-- ============================================================
-- CROSSWORD CLUE/ANSWER DATABASE
-- Normalized schema for constructors: pattern search on answers,
-- many clues per answer, per-publication difficulty, theme tags,
-- and reuse/freshness tracking.
-- ============================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------
-- ANSWERS: the grid entry itself. One row per unique answer string.
-- This is the table pattern-fill queries hit hardest, so it's kept
-- narrow and indexed on length + letters.
-- ----------------------------------------------------------
CREATE TABLE answers (
    answer_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    answer_text     TEXT NOT NULL UNIQUE,   -- stored UPPERCASE, no spaces/punctuation, e.g. 'OREO'
    display_text    TEXT,                    -- original form if it had spaces/punctuation, e.g. "O'HARE"
    length          INTEGER NOT NULL,         -- redundant but critical: indexed for fast pattern search
    is_proper_noun  INTEGER NOT NULL DEFAULT 0 CHECK (is_proper_noun IN (0,1)),
    is_abbreviation INTEGER NOT NULL DEFAULT 0 CHECK (is_abbreviation IN (0,1)),
    is_multiword    INTEGER NOT NULL DEFAULT 0 CHECK (is_multiword IN (0,1)),
    notoriety_score REAL,                     -- 0.0-1.0, how "fair"/well-known the answer is, independent of any single clue
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (length = length(answer_text))
);

CREATE INDEX idx_answers_length ON answers(length);
CREATE INDEX idx_answers_text   ON answers(answer_text);

-- ----------------------------------------------------------
-- PUBLICATIONS: outlets/venues a clue might be associated with.
-- Difficulty and usage are both scoped to a publication (+ day/slot
-- for outlets like NYT that vary difficulty by day of week).
-- ----------------------------------------------------------
CREATE TABLE publications (
    publication_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL UNIQUE,    -- e.g. 'NYT', 'LA Times', 'USA Today', 'Indie/Self-published'
    typical_grid_size TEXT,                  -- e.g. '15x15', '21x21 (Sunday)'
    notes           TEXT
);

-- A "slot" lets one publication have different difficulty bands,
-- e.g. NYT Monday vs NYT Saturday are practically different products.
CREATE TABLE publication_slots (
    slot_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    publication_id  INTEGER NOT NULL REFERENCES publications(publication_id) ON DELETE CASCADE,
    slot_name       TEXT NOT NULL,           -- e.g. 'Monday', 'Saturday', 'Sunday', 'Standard' (for outlets w/o day variation)
    baseline_difficulty INTEGER NOT NULL CHECK (baseline_difficulty BETWEEN 1 AND 5),
    UNIQUE (publication_id, slot_name)
);

-- ----------------------------------------------------------
-- CLUES: many-to-one with answers. This is where most of the
-- editorial richness lives — wordplay type, freshness, tone.
-- ----------------------------------------------------------
CREATE TABLE clues (
    clue_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    answer_id       INTEGER NOT NULL REFERENCES answers(answer_id) ON DELETE CASCADE,
    clue_text       TEXT NOT NULL,
    clue_type       TEXT NOT NULL DEFAULT 'straight'
                       CHECK (clue_type IN ('straight','wordplay','pun','fill_in_blank',
                                             'abbreviation','foreign_language','anagram',
                                             'cross_reference','definition','trivia')),
    requires_capitalization INTEGER NOT NULL DEFAULT 0 CHECK (requires_capitalization IN (0,1)),
    is_original     INTEGER NOT NULL DEFAULT 1 CHECK (is_original IN (0,1)), -- 0 if adapted/inspired by a known prior clue
    source_clue_id  INTEGER REFERENCES clues(clue_id), -- self-reference if adapted from another clue in this db
    author          TEXT,                     -- constructor/editor credited, if known
    date_created    TEXT NOT NULL DEFAULT (datetime('now')),
    notes           TEXT
);

CREATE INDEX idx_clues_answer ON clues(answer_id);
CREATE INDEX idx_clues_type   ON clues(clue_type);

-- ----------------------------------------------------------
-- CLUE_DIFFICULTY: per-clue, per-publication-slot difficulty.
-- This is the junction the prior question's answer requires:
-- the SAME clue can be rated differently depending on context.
-- ----------------------------------------------------------
CREATE TABLE clue_difficulty (
    clue_id         INTEGER NOT NULL REFERENCES clues(clue_id) ON DELETE CASCADE,
    slot_id         INTEGER NOT NULL REFERENCES publication_slots(slot_id) ON DELETE CASCADE,
    difficulty      INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5), -- 1=easy/Monday, 5=hard/Saturday
    rated_by        TEXT,                     -- editor or 'auto' if heuristically scored
    rated_at        TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (clue_id, slot_id)
);

-- ----------------------------------------------------------
-- THEMES: tag vocabulary (many-to-many with clues AND with answers,
-- since a theme can describe either the wordplay angle of a clue
-- or an inherent property of the answer itself, e.g. "U.S. Presidents").
-- ----------------------------------------------------------
CREATE TABLE themes (
    theme_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    theme_name      TEXT NOT NULL UNIQUE,     -- e.g. 'Food & Drink', 'Wordplay: Homophone', '90s Pop Culture'
    theme_category  TEXT,                     -- broad grouping: 'subject', 'wordplay_mechanism', 'era', 'audience'
    description     TEXT
);

CREATE TABLE clue_themes (
    clue_id         INTEGER NOT NULL REFERENCES clues(clue_id) ON DELETE CASCADE,
    theme_id        INTEGER NOT NULL REFERENCES themes(theme_id) ON DELETE CASCADE,
    PRIMARY KEY (clue_id, theme_id)
);

CREATE TABLE answer_themes (
    answer_id       INTEGER NOT NULL REFERENCES answers(answer_id) ON DELETE CASCADE,
    theme_id        INTEGER NOT NULL REFERENCES themes(theme_id) ON DELETE CASCADE,
    PRIMARY KEY (answer_id, theme_id)
);

CREATE INDEX idx_clue_themes_theme   ON clue_themes(theme_id);
CREATE INDEX idx_answer_themes_theme ON answer_themes(theme_id);

-- ----------------------------------------------------------
-- USAGE LOG: every real-world appearance of a clue, with date and
-- venue. This powers freshness checks ("don't reuse a clue used
-- in NYT in the last 5 years") which is a core constructor workflow.
-- ----------------------------------------------------------
CREATE TABLE clue_usage_log (
    usage_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    clue_id         INTEGER NOT NULL REFERENCES clues(clue_id) ON DELETE CASCADE,
    slot_id         INTEGER REFERENCES publication_slots(slot_id),
    used_on         TEXT NOT NULL,            -- ISO date of puzzle publication
    puzzle_label    TEXT,                     -- e.g. 'NYT 2024-03-14' or constructor's internal puzzle ID
    grid_position   TEXT                      -- e.g. '14-Across'
);

CREATE INDEX idx_usage_clue ON clue_usage_log(clue_id);
CREATE INDEX idx_usage_date ON clue_usage_log(used_on);

-- ----------------------------------------------------------
-- CONVENIENCE VIEW: flattened, human-browsable join.
-- Most day-to-day lookups will hit this view rather than raw tables.
-- ----------------------------------------------------------
CREATE VIEW v_clue_catalog AS
SELECT
    c.clue_id,
    a.answer_text,
    a.length,
    c.clue_text,
    c.clue_type,
    p.name              AS publication,
    ps.slot_name        AS slot,
    cd.difficulty,
    GROUP_CONCAT(DISTINCT t.theme_name) AS themes,
    (SELECT MAX(used_on) FROM clue_usage_log u WHERE u.clue_id = c.clue_id) AS last_used,
    (SELECT COUNT(*) FROM clue_usage_log u WHERE u.clue_id = c.clue_id)     AS times_used
FROM clues c
JOIN answers a ON a.answer_id = c.answer_id
LEFT JOIN clue_difficulty cd ON cd.clue_id = c.clue_id
LEFT JOIN publication_slots ps ON ps.slot_id = cd.slot_id
LEFT JOIN publications p ON p.publication_id = ps.publication_id
LEFT JOIN clue_themes ct ON ct.clue_id = c.clue_id
LEFT JOIN themes t ON t.theme_id = ct.theme_id
GROUP BY c.clue_id, p.name, ps.slot_name, cd.difficulty;

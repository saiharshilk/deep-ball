import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { loadContent } from "./content.ts";

// Imaginary players behind each answer's `pct` prior. Real plays are added on top,
// so early on rarity follows the prior and later it follows actual players.
export const PRIOR_PLAYERS = Number(process.env.PRIOR_PLAYERS ?? 1000);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS matches (
  id          TEXT PRIMARY KEY,               -- YYYY-MM-DD
  number      INTEGER NOT NULL UNIQUE,
  date_label  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS prompts (
  id              TEXT PRIMARY KEY,           -- "<matchId>:<key>"
  match_id        TEXT NOT NULL REFERENCES matches(id),
  idx             INTEGER NOT NULL CHECK (idx >= 1),
  text            TEXT NOT NULL,
  hint            TEXT,
  time_limit_sec  INTEGER NOT NULL DEFAULT 25 CHECK (time_limit_sec > 0),
  UNIQUE (match_id, idx)
);
CREATE TABLE IF NOT EXISTS answers (
  id          INTEGER PRIMARY KEY,
  prompt_id   TEXT NOT NULL REFERENCES prompts(id),
  canonical   TEXT NOT NULL,
  aliases     TEXT NOT NULL DEFAULT '[]',     -- JSON array of strings
  prior_count INTEGER NOT NULL DEFAULT 0 CHECK (prior_count >= 0),
  UNIQUE (prompt_id, canonical)
);
CREATE TABLE IF NOT EXISTS prompt_starts (
  player_id   TEXT NOT NULL,
  prompt_id   TEXT NOT NULL REFERENCES prompts(id),
  started_at  INTEGER NOT NULL,
  PRIMARY KEY (player_id, prompt_id)
);
-- One scored play per player per prompt. answer_id NULL = time violation.
CREATE TABLE IF NOT EXISTS plays (
  player_id   TEXT NOT NULL,
  prompt_id   TEXT NOT NULL REFERENCES prompts(id),
  answer_id   INTEGER REFERENCES answers(id),
  tier        TEXT NOT NULL,
  points      INTEGER NOT NULL CHECK (points >= 0),
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (player_id, prompt_id)
);
CREATE INDEX IF NOT EXISTS plays_by_prompt_answer ON plays (prompt_id, answer_id);
CREATE TABLE IF NOT EXISTS match_results (
  player_id   TEXT NOT NULL,
  match_id    TEXT NOT NULL REFERENCES matches(id),
  distance    INTEGER NOT NULL CHECK (distance >= 0),
  finished_at INTEGER NOT NULL,
  played_on   TEXT,                           -- game-day date when finished; later than match_id = archive play
  PRIMARY KEY (player_id, match_id)
);
CREATE INDEX IF NOT EXISTS match_results_by_match ON match_results (match_id, distance);
-- Optional public name for the leaderboard. The tag tells apart players who pick the same nickname.
CREATE TABLE IF NOT EXISTS players (
  id          TEXT PRIMARY KEY,               -- the anonymous cookie id
  nickname    TEXT NOT NULL CHECK (length(nickname) BETWEEN 3 AND 16),
  tag         INTEGER NOT NULL CHECK (tag BETWEEN 1000 AND 9999),
  updated_at  INTEGER NOT NULL,
  UNIQUE (nickname COLLATE NOCASE, tag)
);
`;

/**
 * Syncs content/matches into the database on every start, so editing a puzzle file
 * and restarting is enough. Content edits win, except that anything a player has
 * already been scored against (answers, prompts) is kept, never deleted.
 */
function syncContent(db: DatabaseSync) {
  const { matches, errors, warnings } = loadContent();
  if (errors.length) {
    throw new Error(`Puzzle content has errors (run "pnpm puzzles:check"):\n  ${errors.join("\n  ")}`);
  }
  for (const w of warnings) console.warn(`[puzzles] ${w}`);

  const upsertMatch = db.prepare(
    `INSERT INTO matches (id, number, date_label) VALUES (?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET number = excluded.number, date_label = excluded.date_label`
  );
  const upsertPrompt = db.prepare(
    `INSERT INTO prompts (id, match_id, idx, text, hint) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET text = excluded.text, hint = excluded.hint`
  );
  const upsertAnswer = db.prepare(
    `INSERT INTO answers (prompt_id, canonical, aliases, prior_count) VALUES (?, ?, ?, ?)
     ON CONFLICT (prompt_id, canonical) DO UPDATE SET aliases = excluded.aliases, prior_count = excluded.prior_count`
  );
  const unplayedAnswers = db.prepare(
    `SELECT id, canonical FROM answers a
      WHERE prompt_id = ? AND NOT EXISTS (SELECT 1 FROM plays p WHERE p.answer_id = a.id)`
  );
  const deleteAnswer = db.prepare("DELETE FROM answers WHERE id = ?");
  const extraPrompts = db.prepare(
    `SELECT id FROM prompts pr WHERE match_id = ? AND idx > ?
        AND NOT EXISTS (SELECT 1 FROM plays p WHERE p.prompt_id = pr.id)`
  );

  db.exec("BEGIN");
  try {
    // Free up match numbers first so renumbering a run of days can't trip the UNIQUE constraint.
    db.exec("UPDATE matches SET number = -number");
    for (const m of matches) {
      upsertMatch.run(m.date, m.matchNumber, m.dateLabel);
      m.prompts.forEach((p, i) => {
        const promptId = `${m.date}:p${i + 1}`;
        upsertPrompt.run(promptId, m.date, i + 1, p.text, p.hint ?? null);
        const names = new Set(p.answers.map((a) => a.name));
        for (const a of p.answers) {
          const prior = Math.round((a.pct / 100) * PRIOR_PLAYERS);
          upsertAnswer.run(promptId, a.name, JSON.stringify(a.aliases ?? []), prior);
        }
        for (const row of unplayedAnswers.all(promptId) as { id: number; canonical: string }[]) {
          if (!names.has(row.canonical)) deleteAnswer.run(row.id);
        }
      });
      for (const { id } of extraPrompts.all(m.date, m.prompts.length) as { id: string }[]) {
        db.prepare("DELETE FROM prompt_starts WHERE prompt_id = ?").run(id);
        db.prepare("DELETE FROM answers WHERE prompt_id = ?").run(id);
        db.prepare("DELETE FROM prompts WHERE id = ?").run(id);
      }
    }
    // Matches removed from content keep their (negated) number so their results stay intact.
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/** Additive changes for databases created before a column existed. */
function migrate(db: DatabaseSync) {
  const cols = (db.prepare("PRAGMA table_info(match_results)").all() as { name: string }[]).map((c) => c.name);
  // Older rows predate the archive, so they were all played on their own day (NULL counts as on-day).
  if (!cols.includes("played_on")) db.exec("ALTER TABLE match_results ADD COLUMN played_on TEXT");
}

function open(): DatabaseSync {
  const file =
    process.env.DEEP_BALL_DB ?? path.join(process.cwd(), "data", "deepball.db");
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  migrate(db);
  syncContent(db);
  return db;
}

// Reuse one connection across dev hot reloads.
const globalForDb = globalThis as unknown as { __deepBallDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.__deepBallDb) globalForDb.__deepBallDb = open();
  return globalForDb.__deepBallDb;
}

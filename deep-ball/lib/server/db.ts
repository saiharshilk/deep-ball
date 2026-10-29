import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { MATCHES } from "./content";

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
  PRIMARY KEY (player_id, match_id)
);
CREATE INDEX IF NOT EXISTS match_results_by_match ON match_results (match_id, distance);
`;

function seed(db: DatabaseSync) {
  const insMatch = db.prepare(
    "INSERT OR IGNORE INTO matches (id, number, date_label) VALUES (?, ?, ?)"
  );
  const insPrompt = db.prepare(
    "INSERT OR IGNORE INTO prompts (id, match_id, idx, text, hint) VALUES (?, ?, ?, ?, ?)"
  );
  const insAnswer = db.prepare(
    "INSERT OR IGNORE INTO answers (prompt_id, canonical, aliases, prior_count) VALUES (?, ?, ?, ?)"
  );

  db.exec("BEGIN");
  try {
    for (const m of MATCHES) {
      insMatch.run(m.date, m.matchNumber, m.dateLabel);
      m.prompts.forEach((p, i) => {
        const promptId = `${m.date}:${p.key}`;
        insPrompt.run(promptId, m.date, i + 1, p.text, p.hint ?? null);
        for (const a of p.answers) {
          const prior = Math.round((a.pct / 100) * PRIOR_PLAYERS);
          insAnswer.run(promptId, a.name, JSON.stringify(a.aliases ?? []), prior);
        }
      });
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

function open(): DatabaseSync {
  const file =
    process.env.DEEP_BALL_DB ?? path.join(process.cwd(), "data", "deepball.db");
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  seed(db);
  return db;
}

// Reuse one connection across dev hot reloads.
const globalForDb = globalThis as unknown as { __deepBallDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.__deepBallDb) globalForDb.__deepBallDb = open();
  return globalForDb.__deepBallDb;
}

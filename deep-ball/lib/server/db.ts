import { createClient, type Client, type InStatement, type InValue } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { contentDir, loadContent, type ContentMatch } from "./content.ts";

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

type Row = Record<string, unknown>;

/** Small async query helper over libSQL: a local SQLite file in dev and tests, Turso when deployed. */
export class Db {
  readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  private async exec(sql: string, args: InValue[]) {
    const rs = await this.client.execute({ sql, args });
    return { rs, rows: rs.rows.map((r) => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])) as Row) };
  }

  async get<T>(sql: string, ...args: InValue[]): Promise<T | undefined> {
    return (await this.exec(sql, args)).rows[0] as T | undefined;
  }

  async all<T>(sql: string, ...args: InValue[]): Promise<T[]> {
    return (await this.exec(sql, args)).rows as T[];
  }

  async run(sql: string, ...args: InValue[]): Promise<{ changes: number }> {
    return { changes: (await this.exec(sql, args)).rs.rowsAffected };
  }

  /** Runs statements atomically in one round trip. */
  async batch(stmts: InStatement[]) {
    return this.client.batch(stmts, "write");
  }
}

/**
 * Writes puzzle content into the database. Content wins, except that anything a player has
 * already been scored against (answers, prompts) is kept, never deleted. One atomic batch.
 */
export async function syncContent(db: Db, matches: ContentMatch[]) {
  const stmts: InStatement[] = [
    // Free up match numbers first so renumbering a run of days can't trip the UNIQUE constraint.
    // Matches removed from content keep their (negated) number so their results stay intact.
    "UPDATE matches SET number = -number",
  ];
  for (const m of matches) {
    stmts.push({
      sql: `INSERT INTO matches (id, number, date_label) VALUES (?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET number = excluded.number, date_label = excluded.date_label`,
      args: [m.date, m.matchNumber, m.dateLabel],
    });
    m.prompts.forEach((p, i) => {
      const promptId = `${m.date}:p${i + 1}`;
      stmts.push({
        sql: `INSERT INTO prompts (id, match_id, idx, text, hint) VALUES (?, ?, ?, ?, ?)
              ON CONFLICT (id) DO UPDATE SET text = excluded.text, hint = excluded.hint`,
        args: [promptId, m.date, i + 1, p.text, p.hint ?? null],
      });
      for (const a of p.answers) {
        stmts.push({
          sql: `INSERT INTO answers (prompt_id, canonical, aliases, prior_count) VALUES (?, ?, ?, ?)
                ON CONFLICT (prompt_id, canonical) DO UPDATE SET aliases = excluded.aliases, prior_count = excluded.prior_count`,
          args: [promptId, a.name, JSON.stringify(a.aliases ?? []), Math.round((a.pct / 100) * PRIOR_PLAYERS)],
        });
      }
      stmts.push({
        sql: `DELETE FROM answers
               WHERE prompt_id = ? AND canonical NOT IN (SELECT value FROM json_each(?))
                 AND NOT EXISTS (SELECT 1 FROM plays pl WHERE pl.answer_id = answers.id)`,
        args: [promptId, JSON.stringify(p.answers.map((a) => a.name))],
      });
    });
    // Prompts beyond the file's count that nobody has played go away, with their answers and clocks.
    const extra = `SELECT id FROM prompts pr WHERE match_id = ? AND idx > ?
                      AND NOT EXISTS (SELECT 1 FROM plays pl WHERE pl.prompt_id = pr.id)`;
    for (const table of ["prompt_starts", "answers"]) {
      stmts.push({ sql: `DELETE FROM ${table} WHERE prompt_id IN (${extra})`, args: [m.date, m.prompts.length] });
    }
    stmts.push({ sql: `DELETE FROM prompts WHERE id IN (${extra})`, args: [m.date, m.prompts.length] });
  }
  await db.batch(stmts);
}

/** Additive changes for databases created before a column existed. */
async function migrate(db: Db) {
  const cols = (await db.all<{ name: string }>("PRAGMA table_info(match_results)")).map((c) => c.name);
  // Older rows predate the archive, so they were all played on their own day (NULL counts as on-day).
  if (!cols.includes("played_on")) await db.run("ALTER TABLE match_results ADD COLUMN played_on TEXT");
}

/** TURSO_DATABASE_URL when deployed; otherwise a local file (DEEP_BALL_DB or data/deepball.db). */
/** Which database this server uses, safe to show publicly (host only, never the token). */
export function describeDb(): string {
  const remote = process.env.TURSO_DATABASE_URL?.trim();
  if (!remote) return process.env.VERCEL ? "missing TURSO_DATABASE_URL" : "local file";
  try {
    return `turso: ${new URL(remote.replace(/^libsql:/, "https:")).host}`;
  } catch {
    return "invalid TURSO_DATABASE_URL";
  }
}

export function connect(): Db {
  const remote = process.env.TURSO_DATABASE_URL?.trim();
  if (remote) return new Db(createClient({ url: remote, authToken: process.env.TURSO_AUTH_TOKEN?.trim() }));
  // A local file on Vercel would be an empty, throwaway database: every play would vanish.
  if (process.env.VERCEL) {
    throw new Error("TURSO_DATABASE_URL is not set in this Vercel deployment. Add it (and TURSO_AUTH_TOKEN) under Settings → Environment Variables, then redeploy.");
  }
  const file = process.env.DEEP_BALL_DB ?? path.join(process.cwd(), "data", "deepball.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return new Db(createClient({ url: `file:${file}` }));
}

/** Creates tables and applies migrations. Safe to run on every start. */
export async function prepareSchema(db: Db) {
  if (!process.env.TURSO_DATABASE_URL) {
    await db.client.executeMultiple("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  }
  await db.client.executeMultiple(SCHEMA);
  await migrate(db);
}

async function open(): Promise<Db> {
  const db = connect();
  await prepareSchema(db);
  // Locally the puzzle files are synced on every start, so editing one and restarting is enough.
  // When deployed there are no puzzle files (they're kept out of git): `pnpm puzzles:push` loads them.
  if (fs.existsSync(/* turbopackIgnore: true */ contentDir())) {
    const { matches, errors, warnings } = loadContent();
    if (errors.length) {
      throw new Error(`Puzzle content has errors (run "pnpm puzzles:check"):\n  ${errors.join("\n  ")}`);
    }
    for (const w of warnings) console.warn(`[puzzles] ${w}`);
    await syncContent(db, matches);
  }
  return db;
}

// One connection per server process, reused across dev hot reloads. A failed open is retried.
const globalForDb = globalThis as unknown as { __deepBallDbClient?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!globalForDb.__deepBallDbClient) {
    globalForDb.__deepBallDbClient = open().catch((err) => {
      globalForDb.__deepBallDbClient = undefined;
      throw err;
    });
  }
  return globalForDb.__deepBallDbClient;
}

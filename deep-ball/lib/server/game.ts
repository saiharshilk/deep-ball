import { getDb, PRIOR_PLAYERS } from "./db";
import { matchAnswer } from "./matching";
import { TIERS } from "../tiers";
import type { DailyMatch, FieldStats, SubmitResult, TierKey } from "../types";

const GAME_TZ = process.env.GAME_TZ ?? "America/New_York";
const GRACE_MS = 3000; // network slack on top of the visible clock
const MAX_FT = 700;
// Below this many other finishers, the chart shows the expected spread instead of real results.
const MIN_REAL_FIELD = Number(process.env.MIN_REAL_FIELD ?? 20);

export class GameError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type PromptRow = { id: string; match_id: string; idx: number; text: string; hint: string | null; time_limit_sec: number };
type AnswerRow = { id: number; canonical: string; aliases: string; prior_count: number };

export function todayInGameTz(now = new Date()): string {
  // GAME_DATE pins "today" (YYYY-MM-DD) for testing day rollover locally.
  if (process.env.GAME_DATE) return process.env.GAME_DATE;
  return new Intl.DateTimeFormat("en-CA", { timeZone: GAME_TZ }).format(now);
}

/** First instant after `now` when the date in GAME_TZ changes (handles DST without a tz library). */
export function nextMidnightInGameTz(now = new Date()): Date {
  const today = todayInGameTz(now);
  let lo = now.getTime();
  let hi = lo + 26 * 3600_000;
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (todayInGameTz(new Date(mid)) === today) lo = mid;
    else hi = mid;
  }
  return new Date(Math.ceil(hi / 1000) * 1000);
}

export function pctToTier(pct: number): TierKey {
  if (pct >= 10) return "MOONBALL";
  if (pct >= 4) return "CROSSCOURT";
  if (pct >= 1) return "DOWN_THE_LINE";
  if (pct >= 0.3) return "PASSING_SHOT";
  if (pct >= 0.05) return "ACE";
  return "GRAND_SLAM";
}

type MatchRow = { id: string; number: number; date_label: string };

/** Unreleased matches don't exist as far as players are concerned. */
function assertReleased(matchId: string) {
  if (matchId > todayInGameTz()) throw new GameError(404, "Unknown match");
}

async function getPrompt(matchId: string, promptId: string): Promise<PromptRow> {
  assertReleased(matchId);
  const row = await (await getDb()).get<PromptRow>("SELECT * FROM prompts WHERE id = ? AND match_id = ?", promptId, matchId);
  if (!row) throw new GameError(404, "Unknown prompt for this match");
  return row;
}

/** Today's match, or the most recent one if today has none yet. */
export async function getTodayMatch(): Promise<DailyMatch> {
  const db = await getDb();
  const today = todayInGameTz();
  const match =
    (await db.get<MatchRow>("SELECT * FROM matches WHERE id <= ? AND number > 0 ORDER BY id DESC LIMIT 1", today)) ??
    (await db.get<MatchRow>("SELECT * FROM matches WHERE number > 0 ORDER BY id ASC LIMIT 1"));
  if (!match) throw new GameError(503, "No matches have been loaded. Run: pnpm puzzles:push");
  if (match.id !== today) {
    console.warn(`[puzzles] no puzzle for ${today}; serving ${match.id} instead. Add content/matches/${today}.json and push it`);
  }
  return await toDailyMatch(match);
}

/** A past (or today's) match from the archive. Future dates are refused. */
export async function getMatchByDate(date: string): Promise<DailyMatch> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new GameError(400, "date must be YYYY-MM-DD");
  assertReleased(date);
  const match = await (await getDb()).get<MatchRow>("SELECT * FROM matches WHERE id = ? AND number > 0", date);
  if (!match) throw new GameError(404, "No match on that date");
  return await toDailyMatch(match);
}

async function toDailyMatch(match: MatchRow): Promise<DailyMatch> {
  const prompts = await (await getDb()).all<PromptRow>("SELECT * FROM prompts WHERE match_id = ? ORDER BY idx", match.id);

  return {
    matchId: match.id,
    matchNumber: match.number,
    dateLabel: match.date_label,
    prompts: prompts.map((p) => ({
      id: p.id,
      index: p.idx,
      text: p.text,
      hint: p.hint ?? undefined,
      timeLimitSec: p.time_limit_sec,
    })),
    // A pinned GAME_DATE never rolls over, so there is no next unlock time.
    nextMatchAt: process.env.GAME_DATE ? null : nextMidnightInGameTz().toISOString(),
  };
}

/**
 * Starts the server-side shot clock and reports how much of it is left. Repeat calls keep the
 * first start time, so leaving and coming back doesn't reset the clock; the client counts down
 * from remainingMs so its display always matches what the server will accept.
 */
export async function startPrompt(playerId: string, matchId: string, promptId: string): Promise<{ remainingMs: number }> {
  const prompt = await getPrompt(matchId, promptId);
  const limitMs = prompt.time_limit_sec * 1000;
  // Practice replays aren't scored, so they always get a full clock.
  if (await hasPlayed(playerId, promptId)) return { remainingMs: limitMs };
  const db = await getDb();
  await db.run(
    "INSERT OR IGNORE INTO prompt_starts (player_id, prompt_id, started_at) VALUES (?, ?, ?)",
    playerId, promptId, Date.now()
  );
  const { started_at } = (await db.get<{ started_at: number }>(
    "SELECT started_at FROM prompt_starts WHERE player_id = ? AND prompt_id = ?", playerId, promptId
  ))!;
  return { remainingMs: Math.max(0, limitMs - (Date.now() - started_at)) };
}

async function hasPlayed(playerId: string, promptId: string): Promise<boolean> {
  const db = await getDb();
  return Boolean(await db.get("SELECT 1 FROM plays WHERE player_id = ? AND prompt_id = ?", playerId, promptId));
}

/** Share (%) of players who gave this answer, blending the content prior with real plays by others. */
async function answerPct(
  promptId: string,
  answer: Pick<AnswerRow, "id" | "prior_count">,
  playerId: string
): Promise<number> {
  const db = await getDb();
  const { picked, answered } = (await db.get<{ picked: number; answered: number }>(
    `SELECT COUNT(CASE WHEN answer_id = ? THEN 1 END) AS picked, COUNT(answer_id) AS answered
       FROM plays WHERE prompt_id = ? AND player_id != ?`,
    answer.id, promptId, playerId
  ))!;
  const total = PRIOR_PLAYERS + answered;
  if (total === 0) return 0;
  return ((answer.prior_count + picked) / total) * 100;
}

async function finishIfComplete(playerId: string, matchId: string) {
  const db = await getDb();
  const { prompts, played, distance } = (await db.get<{ prompts: number; played: number; distance: number }>(
      `SELECT (SELECT COUNT(*) FROM prompts WHERE match_id = ?) AS prompts,
              COUNT(pl.prompt_id) AS played,
              COALESCE(SUM(pl.points), 0) AS distance
         FROM plays pl JOIN prompts p ON p.id = pl.prompt_id
        WHERE pl.player_id = ? AND p.match_id = ?`,
    matchId, playerId, matchId
  ))!;
  if (played < prompts) return;
  await db.run(
    "INSERT OR IGNORE INTO match_results (player_id, match_id, distance, finished_at, played_on) VALUES (?, ?, ?, ?, ?)",
    playerId, matchId, distance, Date.now(), todayInGameTz()
  );
}

export async function submitAnswer(
  playerId: string,
  matchId: string,
  promptId: string,
  rawAnswer: string
): Promise<SubmitResult & { recorded?: boolean }> {
  const db = await getDb();
  const prompt = await getPrompt(matchId, promptId);
  const answer = rawAnswer.trim();
  const fault = { status: "invalid" as const, message: `"${answer}" — FAULT. not on the list, try again` };
  if (!answer) return fault;

  const replay = await hasPlayed(playerId, promptId);

  if (!replay) {
    const start = await db.get<{ started_at: number }>(
      "SELECT started_at FROM prompt_starts WHERE player_id = ? AND prompt_id = ?", playerId, promptId
    );
    if (start && Date.now() - start.started_at > prompt.time_limit_sec * 1000 + GRACE_MS) {
      return { status: "expired", message: "TIME'S UP — the shot clock already expired" };
    }
  }

  const rows = await db.all<AnswerRow>("SELECT id, canonical, aliases, prior_count FROM answers WHERE prompt_id = ?", promptId);
  const entries = rows.map((r) => ({ ...r, aliases: JSON.parse(r.aliases) as string[] }));
  const hit = matchAnswer(answer, entries);
  if (!hit) return fault;

  const pct = await answerPct(promptId, hit, playerId);
  const tier = pctToTier(pct);
  const points = TIERS[tier].points;

  let recorded = false;
  if (!replay) {
    const res = await db.run(
      "INSERT OR IGNORE INTO plays (player_id, prompt_id, answer_id, tier, points, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      playerId, promptId, hit.id, tier, points, Date.now()
    );
    recorded = res.changes === 1;
    if (recorded) await finishIfComplete(playerId, matchId);
  }

  return {
    status: "valid",
    canonical: hit.canonical,
    tier,
    points,
    pctOfPlayers: Number(pct.toFixed(pct < 1 ? 2 : 1)),
    recorded,
  };
}

export async function reportTimeout(playerId: string, matchId: string, promptId: string) {
  await getPrompt(matchId, promptId);
  const res = await (await getDb()).run(
    "INSERT OR IGNORE INTO plays (player_id, prompt_id, answer_id, tier, points, created_at) VALUES (?, ?, NULL, 'TIME_VIOLATION', 0, ?)",
    playerId, promptId, Date.now()
  );
  if (res.changes === 1) await finishIfComplete(playerId, matchId);
  return { tier: "TIME_VIOLATION" as const, points: 0 as const };
}

/** Prior field shape (skewed bell peaking ~245 ft), used until real results dominate. */
function priorDensity(ft: number): number {
  if (ft === 0) return 0.02;
  const peak = 245;
  const z = (ft - peak) / (ft < peak ? 95 : 155);
  let d = Math.exp(-0.5 * z * z);
  if (ft < 40) d *= 0.35 + (ft / 40) * 0.65;
  return d;
}

export async function getFieldStats(playerId: string, matchId: string, clientDistance: number): Promise<FieldStats> {
  const db = await getDb();
  assertReleased(matchId);
  if (!(await db.get("SELECT 1 FROM matches WHERE id = ?", matchId))) {
    throw new GameError(404, "Unknown match");
  }

  const mine = await db.get<{ distance: number }>(
    "SELECT distance FROM match_results WHERE player_id = ? AND match_id = ?", playerId, matchId
  );
  const myDistance = mine?.distance ?? Math.max(0, Math.min(MAX_FT, Math.round(clientDistance) || 0));

  const others = await db.all<{ distance: number }>(
    "SELECT distance FROM match_results WHERE match_id = ? AND player_id != ?", matchId, playerId
  );

  // 10 ft buckets. With only a handful of real finishers a histogram is just noise, so the
  // curve and percentile lean on the expected spread until enough people have played.
  const estimated = others.length < MIN_REAL_FIELD;
  const real: number[] = [];
  for (let ft = 0; ft <= MAX_FT; ft += 10) real.push(0);
  for (const { distance } of others) real[Math.min(real.length - 1, Math.round(distance / 10))] += 1;

  let buckets: number[];
  if (estimated) {
    buckets = real.map((_, i) => priorDensity(i * 10));
    const priorSum = buckets.reduce((a, b) => a + b, 0);
    buckets = buckets.map((d, i) => (d / priorSum) * PRIOR_PLAYERS + real[i]);
  } else {
    // Light smoothing so the curve reads as a shape rather than spikes.
    const kernel = [1, 2, 3, 2, 1];
    buckets = real.map((_, i) =>
      kernel.reduce((sum, w, k) => sum + w * (real[i + k - 2] ?? 0), 0) / 9
    );
  }
  const total = buckets.reduce((a, b) => a + b, 0);

  let below = 0;
  const myBucket = Math.min(buckets.length - 1, Math.round(myDistance / 10));
  for (let i = 0; i < myBucket; i++) below += buckets[i];
  below += buckets[myBucket] / 2;
  const percentile = total > 0 ? Math.max(1, Math.min(99, Math.round((below / total) * 100))) : 50;

  let cum = 0;
  let medianDistance = 0;
  for (let i = 0; i < buckets.length; i++) {
    cum += buckets[i];
    if (cum >= total / 2) {
      medianDistance = i * 10;
      break;
    }
  }

  return {
    playersFinished: others.length + (mine ? 1 : 0),
    estimated,
    medianDistance,
    distribution: buckets.map((count, i) => ({ ft: i * 10, density: Number((count / (total || 1)).toFixed(5)) })),
    percentile,
  };
}

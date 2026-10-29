import { randomInt } from "node:crypto";
import { getDb } from "./db";
import { GameError, getMatchByDate, getTodayMatch } from "./game";
import type { AllTimeEntry, AllTimeLeaderboard, DailyLeaderboard, PlayerName, TierKey } from "../types";

const TOP_N = 50;
const NICKNAME_RE = /^[A-Za-z0-9][A-Za-z0-9 _.-]{1,14}[A-Za-z0-9]$/;

// Kept short on purpose: it catches the obvious stuff, and anything that slips through
// can be fixed by hand with one UPDATE. Matched against a squashed, de-leeted name.
const BLOCKED = [
  "fuck", "shit", "cunt", "bitch", "nigg", "fag", "retard", "whore", "slut", "rape",
  "penis", "vagina", "cock", "dick", "pussy", "porn", "nazi", "hitler", "kkk", "tranny",
];
const RESERVED = ["admin", "moderator", "deepball", "official", "anonymous"];

function squash(name: string): string {
  const leet: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g" };
  return name.toLowerCase().replace(/[0-9]/g, (d) => leet[d]).replace(/[^a-z]/g, "");
}

export function validateNickname(raw: string): string {
  const nickname = raw.trim().replace(/\s+/g, " ");
  if (!NICKNAME_RE.test(nickname)) {
    throw new GameError(400, "Nicknames are 3-16 letters or numbers (spaces, _ . - allowed inside)");
  }
  const s = squash(nickname);
  if (BLOCKED.some((w) => s.includes(w)) || RESERVED.some((w) => s === w || s.startsWith(w))) {
    throw new GameError(400, "Pick a different nickname");
  }
  return nickname;
}

export function getPlayerName(playerId: string): PlayerName | null {
  const row = getDb().prepare("SELECT nickname, tag FROM players WHERE id = ?").get(playerId) as
    | PlayerName
    | undefined;
  return row ? { nickname: row.nickname, tag: row.tag } : null;
}

/** Sets or changes the player's nickname. Keeps their tag when it's still free under the new name. */
export function setNickname(playerId: string, raw: string): PlayerName {
  const nickname = validateNickname(raw);
  const db = getDb();
  const current = getPlayerName(playerId);
  const taken = db.prepare("SELECT 1 FROM players WHERE nickname = ? COLLATE NOCASE AND tag = ? AND id != ?");

  let tag = current?.tag;
  if (!tag || taken.get(nickname, tag, playerId)) {
    tag = undefined;
    for (let i = 0; i < 50 && !tag; i++) {
      const t = randomInt(1000, 10000);
      if (!taken.get(nickname, t, playerId)) tag = t;
    }
    if (!tag) throw new GameError(409, "That nickname is very popular, try another");
  }

  db.prepare(
    `INSERT INTO players (id, nickname, tag, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET nickname = excluded.nickname, tag = excluded.tag, updated_at = excluded.updated_at`
  ).run(playerId, nickname, tag, Date.now());
  return { nickname, tag };
}

// Only results finished on the match's own day count; archive catch-up games don't.
const ON_DAY = "(r.played_on IS NULL OR r.played_on = r.match_id)";

/** Best distances for one day, ties going to whoever finished first. */
export function getDailyLeaderboard(playerId: string, date?: string | null): DailyLeaderboard {
  const match = date ? getMatchByDate(date) : getTodayMatch();
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT r.player_id, r.distance, p.nickname, p.tag,
              (SELECT group_concat(tier, ',') FROM (
                 SELECT pl.tier FROM plays pl JOIN prompts pr ON pr.id = pl.prompt_id
                  WHERE pl.player_id = r.player_id AND pr.match_id = r.match_id ORDER BY pr.idx)) AS tiers
         FROM match_results r LEFT JOIN players p ON p.id = r.player_id
        WHERE r.match_id = ? AND ${ON_DAY}
        ORDER BY r.distance DESC, r.finished_at ASC
        LIMIT ?`
    )
    .all(match.matchId, TOP_N) as {
    player_id: string;
    distance: number;
    nickname: string | null;
    tag: number | null;
    tiers: string | null;
  }[];

  const { players } = db
    .prepare(`SELECT count(*) AS players FROM match_results r WHERE r.match_id = ? AND ${ON_DAY}`)
    .get(match.matchId) as { players: number };

  const mine = db
    .prepare("SELECT distance, finished_at, played_on FROM match_results WHERE player_id = ? AND match_id = ?")
    .get(playerId, match.matchId) as { distance: number; finished_at: number; played_on: string | null } | undefined;

  let me: DailyLeaderboard["me"] = null;
  if (mine) {
    const late = Boolean(mine.played_on && mine.played_on > match.matchId);
    let rank: number | null = null;
    if (!late) {
      const { ahead } = db
        .prepare(
          `SELECT count(*) AS ahead FROM match_results r
            WHERE r.match_id = ? AND ${ON_DAY}
              AND (r.distance > ? OR (r.distance = ? AND r.finished_at < ?))`
        )
        .get(match.matchId, mine.distance, mine.distance, mine.finished_at) as { ahead: number };
      rank = ahead + 1;
    }
    me = { rank, distance: mine.distance, name: getPlayerName(playerId) };
  }

  return {
    matchId: match.matchId,
    matchNumber: match.matchNumber,
    dateLabel: match.dateLabel,
    players,
    entries: rows.map((r, i) => ({
      rank: i + 1,
      name: r.nickname && r.tag ? { nickname: r.nickname, tag: r.tag } : null,
      distance: r.distance,
      tiers: (r.tiers?.split(",") ?? []) as TierKey[],
      isMe: r.player_id === playerId,
    })),
    me,
  };
}

/**
 * Total feet across every match finished on its day, plus each player's current streak.
 * Computed in memory: fine for tens of thousands of results, revisit if it gets slow.
 */
export function getAllTimeLeaderboard(playerId: string): AllTimeLeaderboard {
  const db = getDb();
  const today = getTodayMatch();
  const rows = db
    .prepare(
      `SELECT r.player_id, r.distance, r.finished_at, m.number
         FROM match_results r JOIN matches m ON m.id = r.match_id
        WHERE m.number > 0 AND r.match_id <= ? AND ${ON_DAY}`
    )
    .all(today.matchId) as { player_id: string; distance: number; finished_at: number; number: number }[];

  const byPlayer = new Map<string, { totalFt: number; matches: number; numbers: Set<number>; firstAt: number }>();
  for (const r of rows) {
    let p = byPlayer.get(r.player_id);
    if (!p) byPlayer.set(r.player_id, (p = { totalFt: 0, matches: 0, numbers: new Set(), firstAt: r.finished_at }));
    p.totalFt += r.distance;
    p.matches++;
    p.numbers.add(r.number);
    p.firstAt = Math.min(p.firstAt, r.finished_at);
  }

  const ranked = [...byPlayer.entries()]
    .map(([id, p]) => {
      // Same rule as the player's own stats: alive while today or yesterday was played.
      let n = p.numbers.has(today.matchNumber) ? today.matchNumber : today.matchNumber - 1;
      let streak = 0;
      while (p.numbers.has(n)) {
        streak++;
        n--;
      }
      return { id, totalFt: p.totalFt, matches: p.matches, streak, firstAt: p.firstAt };
    })
    .sort((a, b) => b.totalFt - a.totalFt || a.firstAt - b.firstAt);

  const top = ranked.slice(0, TOP_N);
  const names = new Map<string, PlayerName>();
  if (top.length) {
    const q = db.prepare(
      `SELECT id, nickname, tag FROM players WHERE id IN (${top.map(() => "?").join(",")})`
    );
    for (const r of q.all(...top.map((t) => t.id)) as { id: string; nickname: string; tag: number }[]) {
      names.set(r.id, { nickname: r.nickname, tag: r.tag });
    }
  }

  const toEntry = (r: (typeof ranked)[number], i: number): AllTimeEntry => ({
    rank: i + 1,
    name: names.get(r.id) ?? null,
    distance: r.totalFt,
    tiers: [],
    isMe: r.id === playerId,
    matches: r.matches,
    streak: r.streak,
  });

  const myIndex = ranked.findIndex((r) => r.id === playerId);
  return {
    players: ranked.length,
    entries: top.map(toEntry),
    me:
      myIndex >= 0
        ? {
            rank: myIndex + 1,
            distance: ranked[myIndex].totalFt,
            matches: ranked[myIndex].matches,
            streak: ranked[myIndex].streak,
            name: getPlayerName(playerId),
          }
        : null,
  };
}

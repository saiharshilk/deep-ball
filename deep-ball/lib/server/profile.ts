import { getDb } from "./db";
import { getTodayMatch } from "./game";
import { getPlayerName } from "./leaderboard";
import type {
  CompletedMatchRecord,
  PastMatchSummary,
  PlayerProfile,
  PlayerStatsSummary,
  PromptResultRecord,
  TierKey,
} from "../types";

type PlayRow = {
  match_id: string;
  prompt_id: string;
  idx: number;
  text: string;
  tier: TierKey;
  points: number;
  canonical: string | null;
};

/** Everything the scorecard and menu show about the current player, from recorded plays only. */
export function getPlayerProfile(playerId: string): PlayerProfile {
  const db = getDb();
  const today = getTodayMatch();

  const matches = db
    .prepare("SELECT id, number, date_label FROM matches WHERE number > 0 AND id <= ? ORDER BY id DESC")
    .all(today.matchId) as { id: string; number: number; date_label: string }[];

  const results = new Map(
    (db.prepare("SELECT match_id, distance, played_on FROM match_results WHERE player_id = ?").all(playerId) as {
      match_id: string;
      distance: number;
      played_on: string | null;
    }[]).map((r) => [r.match_id, r])
  );

  const plays = db
    .prepare(
      `SELECT pr.match_id, pr.id AS prompt_id, pr.idx, pr.text, pl.tier, pl.points, a.canonical
         FROM plays pl
         JOIN prompts pr ON pr.id = pl.prompt_id
         LEFT JOIN answers a ON a.id = pl.answer_id
        WHERE pl.player_id = ?
        ORDER BY pr.match_id, pr.idx`
    )
    .all(playerId) as PlayRow[];
  const playsByMatch = new Map<string, PlayRow[]>();
  for (const p of plays) {
    if (!playsByMatch.has(p.match_id)) playsByMatch.set(p.match_id, []);
    playsByMatch.get(p.match_id)!.push(p);
  }

  const history: PastMatchSummary[] = matches.map((m) => {
    const result = results.get(m.id);
    const played = Boolean(result);
    return {
      matchId: m.id,
      matchNumber: m.number,
      dateLabel: m.date_label,
      isToday: m.id === today.matchId,
      played,
      playedLate: Boolean(result?.played_on && result.played_on > m.id),
      distance: result ? result.distance : null,
      tiers: played ? (playsByMatch.get(m.id) ?? []).map((p) => p.tier) : null,
    };
  });

  const todaySummary = history.find((h) => h.isToday);
  let todayRecord: CompletedMatchRecord | null = null;
  if (todaySummary?.played) {
    const results: PromptResultRecord[] = (playsByMatch.get(today.matchId) ?? []).map((p) => ({
      promptId: p.prompt_id,
      promptIndex: p.idx,
      promptText: p.text,
      canonical: p.canonical ?? "—",
      tier: p.tier,
      points: p.points,
    }));
    todayRecord = {
      matchId: today.matchId,
      matchNumber: today.matchNumber,
      dateLabel: today.dateLabel,
      date: today.matchId,
      distance: todaySummary.distance!,
      grandSlams: results.filter((r) => r.tier === "GRAND_SLAM").length,
      tiers: results.map((r) => r.tier),
      results,
    };
  }

  return { stats: summarize(history, today.matchNumber), history, today: todayRecord, name: getPlayerName(playerId) };
}

function summarize(history: PastMatchSummary[], todayNumber: number): PlayerStatsSummary {
  const finished = history.filter((h) => h.played).sort((a, b) => a.matchNumber - b.matchNumber);
  // Streaks reward showing up each day, so archive catch-up games don't extend them.
  const onDay = finished.filter((h) => !h.playedLate);
  const playedNumbers = new Set(onDay.map((h) => h.matchNumber));

  let bestStreak = 0;
  let run = 0;
  let prev: number | null = null;
  for (const h of onDay) {
    run = prev !== null && h.matchNumber === prev + 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    prev = h.matchNumber;
  }

  // A streak survives until today's match goes unplayed past midnight, so count back from
  // today if it's done, otherwise from yesterday.
  let n = playedNumbers.has(todayNumber) ? todayNumber : todayNumber - 1;
  let streak = 0;
  while (playedNumbers.has(n)) {
    streak++;
    n--;
  }

  let best = finished[0];
  for (const h of finished) if (h.distance! >= best.distance!) best = h;
  const total = finished.reduce((sum, h) => sum + h.distance!, 0);

  return {
    streak,
    bestStreak,
    matchesPlayed: finished.length,
    averageFt: finished.length ? Math.round(total / finished.length) : 0,
    bestMatchFt: best?.distance ?? 0,
    bestMatchNumber: best?.matchNumber ?? 0,
    grandSlams: finished.reduce((sum, h) => sum + h.tiers!.filter((t) => t === "GRAND_SLAM").length, 0),
  };
}

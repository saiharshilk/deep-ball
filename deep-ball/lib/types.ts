export type TierKey =
  | "MOONBALL"
  | "CROSSCOURT"
  | "DOWN_THE_LINE"
  | "PASSING_SHOT"
  | "ACE"
  | "GRAND_SLAM"
  | "TIME_VIOLATION";

export interface PromptPublic {
  id: string;
  index: number;          // 1..7
  text: string;           // "Name a left-handed tennis player"
  hint?: string;          // clarifier line under the prompt
  timeLimitSec: number;   // 25
}

export interface DailyMatch {
  matchId: string;        // "2026-10-29"
  matchNumber: number;    // 3
  dateLabel: string;      // "THU, OCT 29"
  prompts: PromptPublic[]; // NOTE: never includes answers
  nextMatchAt: string | null; // ISO time the next match unlocks (midnight in the game's time zone)
}

export type SubmitResult =
  | { status: "valid"; canonical: string; tier: TierKey; points: number; pctOfPlayers: number }
  | { status: "invalid"; message: string }      // FAULT, retry allowed
  | { status: "duplicate"; message: string }    // same answer submitted twice this prompt
  | { status: "expired"; message: string };     // server clock ran out: record a time violation

export interface FieldStats {
  playersFinished: number;
  medianDistance: number;
  distribution: { ft: number; density: number }[]; // for the curve, 0..700
  percentile: number;                              // 0..100 for this player's distance
}

export interface PromptResultRecord {
  promptId: string;
  promptIndex: number;
  promptText: string;
  canonical: string;      // "—" on timeout
  tier: TierKey;
  points: number;
  pctOfPlayers?: number;
}

export interface PlayerStatsSummary {
  streak: number;          // consecutive daily matches finished on their day, ending today or yesterday
  bestStreak: number;
  matchesPlayed: number;
  averageFt: number;
  bestMatchFt: number;
  bestMatchNumber: number;
  grandSlams: number;
}

export interface PastMatchSummary {
  matchId: string;
  matchNumber: number;
  dateLabel: string;
  isToday: boolean;
  played: boolean;         // finished all 7 prompts
  playedLate: boolean;     // finished from the archive after its day, so it doesn't count toward streaks
  distance: number | null;
  tiers: TierKey[] | null;
}

/** The current player's record, built from server data (GET /api/me). */
export interface PlayerProfile {
  stats: PlayerStatsSummary;
  history: PastMatchSummary[];          // newest first, up to today
  today: CompletedMatchRecord | null;   // set once today's match is finished
  name: PlayerName | null;              // leaderboard nickname, if the player picked one
}

/** Public leaderboard name, shown as "nickname#tag". */
export interface PlayerName {
  nickname: string;
  tag: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: PlayerName | null;   // null = never picked a nickname ("Anonymous")
  distance: number;          // that day's feet, or total feet on the all-time board
  tiers: TierKey[];          // per-prompt tiers (daily board only)
  isMe: boolean;
}

export interface DailyLeaderboard {
  matchId: string;
  matchNumber: number;
  dateLabel: string;
  players: number;           // everyone who finished on the day
  entries: LeaderboardEntry[];
  // rank is null when the player only finished it later from the archive (doesn't count)
  me: { rank: number | null; distance: number; name: PlayerName | null } | null;
}

export interface AllTimeEntry extends LeaderboardEntry {
  matches: number;
  streak: number;
}

export interface AllTimeLeaderboard {
  players: number;
  entries: AllTimeEntry[];
  me: { rank: number; distance: number; matches: number; streak: number; name: PlayerName | null } | null;
}

export interface CompletedMatchRecord {
  matchId: string;
  matchNumber: number;
  dateLabel: string;
  date: string;
  distance: number;
  grandSlams: number;
  tiers: TierKey[];
  results?: PromptResultRecord[];
}

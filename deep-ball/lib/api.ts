import { DailyMatch, FieldStats, PlayerProfile, SubmitResult } from "./types";

// All game data comes from the server routes in app/api/match. Answer lists live
// only on the server (lib/server), so nothing here can leak them to players.

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request to ${path} failed (${res.status})`);
  }
  return res.json();
}

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });

export async function getTodayMatch(): Promise<DailyMatch> {
  return request("/api/match/today");
}

/** Starts the server-side shot clock for a prompt; returns the time actually left on it. */
export async function startPrompt(matchId: string, promptId: string): Promise<{ remainingMs: number }> {
  return post("/api/match/start", { matchId, promptId });
}

export async function submitAnswer(
  matchId: string,
  promptId: string,
  answer: string
): Promise<SubmitResult> {
  return post("/api/match/submit", { matchId, promptId, answer });
}

export async function reportTimeout(
  matchId: string,
  promptId: string
): Promise<{ tier: "TIME_VIOLATION"; points: 0 }> {
  return post("/api/match/timeout", { matchId, promptId });
}

export async function getFieldStats(
  matchId: string,
  myDistance: number
): Promise<FieldStats> {
  const qs = new URLSearchParams({ matchId, distance: String(myDistance) });
  return request(`/api/match/stats?${qs}`);
}

const PROFILE_CACHE_KEY = "deepball:profile:v1";

/**
 * The current player's stats, match history and today's finished match (if any).
 * Every successful load is also cached in this browser (see getCachedProfile).
 */
export async function getMyProfile(): Promise<PlayerProfile> {
  const profile = await request<PlayerProfile>("/api/me");
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // Storage blocked or full: the cache is a convenience, not required.
  }
  return profile;
}

/**
 * Last profile seen in this browser, for showing stats instantly (and offline) while a fresh
 * copy loads. The server stays the source of truth; callers should still call getMyProfile().
 */
export function getCachedProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && parsed.stats && Array.isArray(parsed.history) ? parsed : null;
  } catch {
    return null;
  }
}

/** A past (or today's) match by date, for the archive. */
export async function getMatchByDate(date: string): Promise<DailyMatch> {
  return request(`/api/match?${new URLSearchParams({ date })}`);
}

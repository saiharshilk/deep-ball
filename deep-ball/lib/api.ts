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

/** Starts the server-side shot clock for a prompt. */
export async function startPrompt(matchId: string, promptId: string): Promise<void> {
  await post("/api/match/start", { matchId, promptId });
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

/** The current player's stats, match history and today's finished match (if any). */
export async function getMyProfile(): Promise<PlayerProfile> {
  return request("/api/me");
}

/** A past (or today's) match by date, for the archive. */
export async function getMatchByDate(date: string): Promise<DailyMatch> {
  return request(`/api/match?${new URLSearchParams({ date })}`);
}

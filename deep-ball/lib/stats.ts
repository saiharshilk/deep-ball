import { CompletedMatchRecord, PromptResultRecord, TierKey } from "./types";

const SEED_HISTORY: CompletedMatchRecord[] = [
  {
    matchId: "2026-10-27",
    matchNumber: 1,
    dateLabel: "TUE, OCT 27",
    date: "2026-10-27",
    distance: 230,
    grandSlams: 0,
    tiers: [
      "MOONBALL",
      "CROSSCOURT",
      "DOWN_THE_LINE",
      "MOONBALL",
      "PASSING_SHOT",
      "TIME_VIOLATION",
      "CROSSCOURT",
    ],
  },
  {
    matchId: "2026-10-28",
    matchNumber: 2,
    dateLabel: "WED, OCT 28",
    date: "2026-10-28",
    distance: 370,
    grandSlams: 1,
    tiers: [
      "CROSSCOURT",
      "ACE",
      "MOONBALL",
      "DOWN_THE_LINE",
      "GRAND_SLAM",
      "CROSSCOURT",
      "MOONBALL",
    ],
  },
];

const HISTORY_KEY = "deepball:history:v1";
const TODAY_RESULT_KEY = "deepball:today:v1";
const SETTINGS_KEY = "deepball:settings:v1";
const MERCH_DISMISSED_KEY = "deepball:merch_dismissed:v1";

export interface UserSettings {
  soundEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface PlayerStatsSummary {
  streak: number;
  bestStreak: number;
  matchesPlayed: number;
  averageFt: number;
  bestMatchFt: number;
  bestMatchNumber: number;
  grandSlams: number;
}

export function getStoredHistory(): CompletedMatchRecord[] {
  try {
    if (typeof window === "undefined") return SEED_HISTORY;
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      // Seed localStorage on first visit so the stats grid isn't empty in the demo
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(SEED_HISTORY));
      return SEED_HISTORY;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEED_HISTORY;
  } catch {
    return SEED_HISTORY;
  }
}

export function getTodayCompletedMatch(
  matchId: string
): CompletedMatchRecord | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(TODAY_RESULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CompletedMatchRecord;
    if (parsed && parsed.matchId === matchId) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveCompletedMatch(
  matchId: string,
  matchNumber: number,
  dateLabel: string,
  results: PromptResultRecord[]
): CompletedMatchRecord {
  const distance = results.reduce((sum, r) => sum + r.points, 0);
  const tiers: TierKey[] = results.map((r) => r.tier);
  const grandSlams = tiers.filter((t) => t === "GRAND_SLAM").length;

  const record: CompletedMatchRecord = {
    matchId,
    matchNumber,
    dateLabel,
    date: matchId,
    distance,
    grandSlams,
    tiers,
    results,
  };

  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TODAY_RESULT_KEY, JSON.stringify(record));
      const existing = getStoredHistory().filter(
        (m) => m.matchNumber !== matchNumber && m.date !== matchId
      );
      const updated = [...existing, record].sort(
        (a, b) => a.matchNumber - b.matchNumber
      );
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }

  return record;
}

export function clearTodayCompletedMatch(matchNumber: number) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TODAY_RESULT_KEY);
      const existing = getStoredHistory().filter(
        (m) => m.matchNumber !== matchNumber
      );
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(existing));
    }
  } catch {
    // Ignore storage errors
  }
}

export function computePlayerStats(
  history: CompletedMatchRecord[]
): PlayerStatsSummary {
  if (!history || history.length === 0) {
    return {
      streak: 0,
      bestStreak: 0,
      matchesPlayed: 0,
      averageFt: 0,
      bestMatchFt: 0,
      bestMatchNumber: 1,
      grandSlams: 0,
    };
  }

  const sorted = [...history].sort((a, b) => a.matchNumber - b.matchNumber);
  const matchesPlayed = sorted.length;
  const totalFt = sorted.reduce((acc, m) => acc + m.distance, 0);
  const averageFt = Math.round(totalFt / matchesPlayed);

  let bestMatchFt = 0;
  let bestMatchNumber = sorted[0].matchNumber;
  let grandSlams = 0;

  let currentStreak = 0;
  let bestStreak = 0;
  let prevNum: number | null = null;

  for (const m of sorted) {
    if (m.distance >= bestMatchFt) {
      bestMatchFt = m.distance;
      bestMatchNumber = m.matchNumber;
    }
    grandSlams += m.grandSlams ?? m.tiers.filter((t) => t === "GRAND_SLAM").length;

    if (prevNum === null || m.matchNumber === prevNum + 1) {
      currentStreak += 1;
    } else if (m.matchNumber !== prevNum) {
      currentStreak = 1;
    }
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
    prevNum = m.matchNumber;
  }

  return {
    streak: currentStreak,
    bestStreak,
    matchesPlayed,
    averageFt,
    bestMatchFt,
    bestMatchNumber,
    grandSlams,
  };
}

export function getSettings(): UserSettings {
  try {
    if (typeof window === "undefined") {
      return { soundEnabled: false, reducedMotion: false, highContrast: false };
    }
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { soundEnabled: false, reducedMotion: false, highContrast: false };
    }
    const parsed = JSON.parse(raw);
    return {
      soundEnabled: Boolean(parsed.soundEnabled),
      reducedMotion: Boolean(parsed.reducedMotion),
      highContrast: Boolean(parsed.highContrast),
    };
  } catch {
    return { soundEnabled: false, reducedMotion: false, highContrast: false };
  }
}

export function saveSettings(next: UserSettings): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      document.documentElement.classList.toggle("reduced-motion", next.reducedMotion);
      document.documentElement.classList.toggle("high-contrast", next.highContrast);
    }
  } catch {
    // Ignore
  }
}

export function isMerchDismissed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MERCH_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function dismissMerchSurvey(vote?: "up" | "down"): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MERCH_DISMISSED_KEY, "true");
      if (vote) {
        window.localStorage.setItem("deepball:merch_vote:v1", vote);
      }
    }
  } catch {
    // Ignore
  }
}

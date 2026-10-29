// Puzzle content. Server-only: answer lists must never be imported by client code.
// To add a day, append a match with a new date and matchNumber; it is seeded on next start.
import { MOCK_PROMPTS } from "./prompt-data";

export interface ContentAnswer {
  name: string;
  aliases?: string[];
  pct: number; // expected share of players (%), used as a prior until real plays accumulate
}

export interface ContentPrompt {
  key: string; // stable within the match, e.g. "p1"
  text: string;
  hint?: string;
  answers: ContentAnswer[];
}

export interface ContentMatch {
  date: string; // YYYY-MM-DD in GAME_TZ; also the public matchId
  matchNumber: number;
  dateLabel: string;
  prompts: ContentPrompt[];
}

export const MATCHES: ContentMatch[] = [
  {
    date: "2026-10-29",
    matchNumber: 3,
    dateLabel: "THU, OCT 29",
    prompts: MOCK_PROMPTS.map((p) => ({
      key: p.id,
      text: p.text,
      hint: p.hint,
      answers: p.answers,
    })),
  },
];

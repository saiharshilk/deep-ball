// Puzzle content: one JSON file per day in content/matches/YYYY-MM-DD.json.
// Server-only: answer lists must never be imported by client code.
// Kept free of Next-specific code so `pnpm puzzles:check` can run it with plain Node.
import fs from "node:fs";
import path from "node:path";
import { normalizeAnswer } from "./matching.ts";

export const PROMPTS_PER_MATCH = 7;
const MIN_ANSWERS = 5;

export interface ContentAnswer {
  name: string;
  aliases?: string[];
  pct: number; // expected share of players (%), used as a prior until real plays accumulate
}

export interface ContentPrompt {
  text: string;
  hint?: string;
  answers: ContentAnswer[];
}

export interface ContentMatch {
  date: string; // YYYY-MM-DD in GAME_TZ; also the public matchId
  matchNumber: number;
  dateLabel: string; // derived, e.g. "THU, OCT 29"
  prompts: ContentPrompt[];
}

export interface ContentReport {
  matches: ContentMatch[];
  errors: string[];
  warnings: string[];
}

export function contentDir(): string {
  return process.env.CONTENT_DIR ?? path.join(process.cwd(), "content", "matches");
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(date: string): Date | null {
  if (!DATE_RE.test(date)) return null;
  const d = new Date(`${date}T00:00:00Z`);
  return d.toISOString().slice(0, 10) === date ? d : null;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b)!.getTime() - parseDate(a)!.getTime()) / 86_400_000);
}

export function dateLabelFor(date: string): string {
  return parseDate(date)!
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })
    .toUpperCase(); // "THU, OCT 29"
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function validateMatch(raw: unknown, file: string, errors: string[], warnings: string[]): ContentMatch | null {
  const err = (msg: string) => errors.push(`${file}: ${msg}`);
  if (!isObj(raw)) return err("must be a JSON object"), null;

  const date = raw.date;
  if (typeof date !== "string" || !parseDate(date)) return err(`"date" must be a real YYYY-MM-DD date`), null;
  if (file !== `${date}.json`) err(`file name must match its date (expected ${date}.json)`);

  const matchNumber = raw.matchNumber;
  if (!Number.isInteger(matchNumber) || (matchNumber as number) < 1) err(`"matchNumber" must be a whole number ≥ 1`);

  if (!Array.isArray(raw.prompts)) return err(`"prompts" must be a list`), null;
  if (raw.prompts.length !== PROMPTS_PER_MATCH) {
    err(`has ${raw.prompts.length} prompts; every match needs exactly ${PROMPTS_PER_MATCH}`);
  }

  const prompts: ContentPrompt[] = [];
  raw.prompts.forEach((p: unknown, i: number) => {
    const where = `prompt ${i + 1}`;
    if (!isObj(p)) return err(`${where} must be an object`);
    if (typeof p.text !== "string" || !p.text.trim() || p.text.length > 120) {
      err(`${where} needs "text" (1-120 characters)`);
    }
    if (p.hint !== undefined && (typeof p.hint !== "string" || p.hint.length > 160)) {
      err(`${where} "hint" must be text up to 160 characters`);
    }
    if (!Array.isArray(p.answers) || p.answers.length < MIN_ANSWERS) {
      return err(`${where} needs at least ${MIN_ANSWERS} answers`);
    }

    // Every name and alias must resolve to exactly one answer, or matching becomes ambiguous.
    const owners = new Map<string, string>();
    let pctSum = 0;
    let hasTopTier = false;
    const answers: ContentAnswer[] = [];
    p.answers.forEach((a: unknown, j: number) => {
      const aw = `${where}, answer ${j + 1}`;
      if (!isObj(a) || typeof a.name !== "string" || !normalizeAnswer(a.name)) {
        return err(`${aw} needs a "name"`);
      }
      if (typeof a.pct !== "number" || a.pct < 0 || a.pct > 100) {
        return err(`${aw} (${a.name}) "pct" must be a number from 0 to 100`);
      }
      const aliases = a.aliases ?? [];
      if (!Array.isArray(aliases) || aliases.some((x) => typeof x !== "string" || !normalizeAnswer(x))) {
        return err(`${aw} (${a.name}) "aliases" must be a list of non-empty text`);
      }
      for (const key of [a.name, ...aliases].map(normalizeAnswer)) {
        const prev = owners.get(key);
        if (prev && prev !== a.name) err(`${where}: "${key}" points to both "${prev}" and "${a.name}"`);
        owners.set(key, a.name);
      }
      pctSum += a.pct;
      if (a.pct < 0.05) hasTopTier = true;
      answers.push({ name: a.name.trim(), aliases: aliases.map((x: string) => x.trim()), pct: a.pct });
    });

    if (pctSum < 60 || pctSum > 130) {
      warnings.push(`${file}: ${where} answer percentages add up to ${pctSum.toFixed(1)}% (expected roughly 100)`);
    }
    if (!hasTopTier) warnings.push(`${file}: ${where} has no answer under 0.05%, so nobody can hit a GRAND SLAM on it`);

    prompts.push({
      text: String(p.text).trim(),
      hint: typeof p.hint === "string" ? p.hint.trim() : undefined,
      answers,
    });
  });

  return { date, matchNumber: matchNumber as number, dateLabel: dateLabelFor(date), prompts };
}

/** Reads and validates every match file. Never throws on bad content; check `errors`. */
export function loadContent(dir = contentDir()): ContentReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!fs.existsSync(/* turbopackIgnore: true */ dir)) return { matches: [], errors: [`puzzle folder not found: ${dir}`], warnings };

  const files = fs.readdirSync(/* turbopackIgnore: true */ dir).filter((f) => f.endsWith(".json")).sort();
  const matches: ContentMatch[] = [];
  for (const file of files) {
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(/* turbopackIgnore: true */ dir, file), "utf8"));
    } catch (e) {
      errors.push(`${file}: invalid JSON (${(e as Error).message})`);
      continue;
    }
    const m = validateMatch(raw, file, errors, warnings);
    if (m) matches.push(m);
  }

  // Streaks count consecutive match numbers, so numbers must advance exactly one per calendar day.
  matches.sort((a, b) => a.date.localeCompare(b.date));
  const first = matches[0];
  for (const m of matches) {
    const expected = first.matchNumber + daysBetween(first.date, m.date);
    if (m.matchNumber !== expected) {
      errors.push(`${m.date}.json: matchNumber is ${m.matchNumber} but should be ${expected} (one number per day since ${first.date} = #${first.matchNumber})`);
    }
  }
  for (let i = 1; i < matches.length; i++) {
    const gap = daysBetween(matches[i - 1].date, matches[i].date);
    if (gap > 1) warnings.push(`no puzzle for ${gap - 1} day(s) between ${matches[i - 1].date} and ${matches[i].date}`);
  }

  return { matches, errors, warnings };
}

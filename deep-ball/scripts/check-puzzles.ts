// Validates content/matches/*.json and reports how many days of puzzles are scheduled.
// Usage: pnpm puzzles:check   (exits 1 if any file has errors)
import { contentDir, daysBetween, loadContent } from "../lib/server/content.ts";

const tz = process.env.GAME_TZ ?? "America/New_York";
const today = process.env.GAME_DATE ?? new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
const { matches, errors, warnings } = loadContent();

console.log(`Puzzle folder: ${contentDir()}`);
for (const m of matches) {
  const answers = m.prompts.reduce((n, p) => n + p.answers.length, 0);
  const marker = m.date === today ? "  ← today" : "";
  console.log(`  #${m.matchNumber}  ${m.date}  ${m.dateLabel.padEnd(12)} ${m.prompts.length} prompts, ${answers} answers${marker}`);
}

const last = matches.at(-1);
if (last) {
  const ahead = daysBetween(today, last.date);
  if (ahead < 0) console.log(`\n⚠ Puzzles ran out on ${last.date}. Today (${today}) has no puzzle.`);
  else console.log(`\nScheduled through ${last.date}: ${ahead} day(s) after today (${today}).`);
  if (ahead >= 0 && ahead < 3) console.log("⚠ Fewer than 3 days of puzzles left. Time to write more.");
}

if (warnings.length) console.log(`\nWarnings (${warnings.length}):\n  - ${warnings.join("\n  - ")}`);
if (errors.length) {
  console.log(`\nErrors (${errors.length}):\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log("\n✓ All puzzle files are valid.");

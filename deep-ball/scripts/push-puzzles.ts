// Uploads content/matches/*.json into the game database. Puzzle files are kept out of git,
// so this is how the deployed game (Turso) gets them.
// Usage: pnpm puzzles:push   (reads TURSO_DATABASE_URL / TURSO_AUTH_TOKEN from .env.turso)
import { connect, prepareSchema, syncContent } from "../lib/server/db.ts";
import { contentDir, loadContent } from "../lib/server/content.ts";

const { matches, errors, warnings } = loadContent();
if (errors.length) {
  console.error(`Not pushing: puzzle files have errors (run "pnpm puzzles:check"):\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
for (const w of warnings) console.warn(`⚠ ${w}`);

const target = process.env.TURSO_DATABASE_URL ?? "local file (no TURSO_DATABASE_URL set)";
console.log(`Pushing ${matches.length} matches from ${contentDir()}\n  → ${target}`);

async function main() {
  const db = connect();
  await prepareSchema(db);
  await syncContent(db, matches);
  const { n } = (await db.get<{ n: number }>("SELECT COUNT(*) AS n FROM matches WHERE number > 0"))!;
  console.log(`✓ Done. The database now has ${n} matches (#${matches[0]?.matchNumber}–#${matches.at(-1)?.matchNumber}, through ${matches.at(-1)?.date}).`);
  db.client.close();
}

main().catch((err) => {
  console.error("Push failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

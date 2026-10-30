import { NextResponse } from "next/server";
import { describeDb, getDb } from "@/lib/server/db";
import { todayInGameTz } from "@/lib/server/game";

export const dynamic = "force-dynamic";

/** GET /api/health: which database the site uses and whether puzzles are loaded. No secrets. */
export async function GET() {
  const database = describeDb();
  try {
    const db = await getDb();
    const today = todayInGameTz();
    const { matches, last } = (await db.get<{ matches: number; last: string | null }>(
      "SELECT COUNT(*) AS matches, MAX(id) AS last FROM matches WHERE number > 0"
    ))!;
    const hasToday = Boolean(await db.get("SELECT 1 FROM matches WHERE id = ? AND number > 0", today));
    const ok = matches > 0 && hasToday;
    return NextResponse.json({ ok, database, today, matches, puzzlesThrough: last, hasToday }, { status: ok ? 200 : 503 });
  } catch (err) {
    return NextResponse.json({ ok: false, database, error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}

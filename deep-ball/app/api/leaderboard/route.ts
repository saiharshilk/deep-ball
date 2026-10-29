import { getDailyLeaderboard } from "@/lib/server/leaderboard";
import { getPlayerId, handle } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** GET /api/leaderboard?date=YYYY-MM-DD: a day's top distances (today when no date). */
export const GET = handle(async (req) => {
  const date = new URL(req.url).searchParams.get("date");
  return getDailyLeaderboard(await getPlayerId(), date);
});

import { GameError, getMatchByDate } from "@/lib/server/game";
import { getPlayerId, handle } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** GET /api/match?date=YYYY-MM-DD: a past or current match for the archive. */
export const GET = handle(async (req) => {
  const date = new URL(req.url).searchParams.get("date");
  if (!date) throw new GameError(400, '"date" is required');
  await getPlayerId();
  return getMatchByDate(date);
});

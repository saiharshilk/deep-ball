import { getFieldStats, GameError } from "@/lib/server/game";
import { getPlayerId, handle } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const url = new URL(req.url);
  const matchId = url.searchParams.get("matchId");
  if (!matchId || matchId.length > 32) throw new GameError(400, '"matchId" is required');
  const playerId = await getPlayerId();
  return getFieldStats(playerId, matchId, Number(url.searchParams.get("distance") ?? 0));
});

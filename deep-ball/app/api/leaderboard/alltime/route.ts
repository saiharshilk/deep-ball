import { getAllTimeLeaderboard } from "@/lib/server/leaderboard";
import { getPlayerId, handle } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** GET /api/leaderboard/alltime: total feet across matches finished on their day. */
export const GET = handle(async () => getAllTimeLeaderboard(await getPlayerId()));

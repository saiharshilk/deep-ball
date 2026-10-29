import { getTodayMatch } from "@/lib/server/game";
import { getPlayerId, handle } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await getPlayerId(); // issue the player cookie up front
  return getTodayMatch();
});

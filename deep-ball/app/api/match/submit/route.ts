import { submitAnswer } from "@/lib/server/game";
import { getPlayerId, handle, readJson, requireString } from "@/lib/server/http";

export const POST = handle(async (req) => {
  const body = await readJson(req);
  const playerId = await getPlayerId();
  return submitAnswer(
    playerId,
    requireString(body, "matchId", 32),
    requireString(body, "promptId", 64),
    requireString(body, "answer", 80)
  );
});

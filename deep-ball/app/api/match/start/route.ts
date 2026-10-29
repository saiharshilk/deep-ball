import { startPrompt } from "@/lib/server/game";
import { getPlayerId, handle, readJson, requireString } from "@/lib/server/http";

export const POST = handle(async (req) => {
  const body = await readJson(req);
  const playerId = await getPlayerId();
  startPrompt(playerId, requireString(body, "matchId", 32), requireString(body, "promptId", 64));
  return { ok: true };
});

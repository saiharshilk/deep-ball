import { setNickname } from "@/lib/server/leaderboard";
import { getPlayerId, handle, readJson, requireString } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** POST /api/me/nickname { nickname }: sets the name shown on leaderboards. */
export const POST = handle(async (req) => {
  const body = await readJson(req);
  return setNickname(await getPlayerId(), requireString(body, "nickname", 40));
});

import { getPlayerProfile } from "@/lib/server/profile";
import { getPlayerId, handle } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handle(async () => getPlayerProfile(await getPlayerId()));

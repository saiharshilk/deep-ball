import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { GameError } from "./game";

const PLAYER_COOKIE = "db_pid";
const UUID_RE = /^[0-9a-f-]{36}$/;

/** Anonymous player id from an httpOnly cookie; issues one if missing or malformed. */
export async function getPlayerId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(PLAYER_COOKIE)?.value;
  if (existing && UUID_RE.test(existing)) return existing;
  const id = randomUUID();
  jar.set(PLAYER_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body;
  } catch {}
  throw new GameError(400, "Body must be a JSON object");
}

export function requireString(body: Record<string, unknown>, key: string, maxLen: number): string {
  const v = body[key];
  if (typeof v !== "string" || v.length === 0 || v.length > maxLen) {
    throw new GameError(400, `"${key}" must be a string of 1-${maxLen} characters`);
  }
  return v;
}

/** Wraps a handler so expected errors map to their status and anything else is logged and returns a plain 500. */
export function handle(fn: (req: Request) => Promise<unknown>) {
  return async (req: Request) => {
    try {
      return NextResponse.json(await fn(req));
    } catch (err) {
      if (err instanceof GameError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error(`[api] ${req.method} ${new URL(req.url).pathname} failed`, err);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
  };
}

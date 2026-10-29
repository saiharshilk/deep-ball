"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatPlayerName, getCachedProfile, getDailyLeaderboard, getMyProfile } from "@/lib/api";
import { DailyLeaderboard, PlayerName } from "@/lib/types";
import { LeaderboardRows } from "@/components/leaderboard/LeaderboardRows";
import { NicknameForm } from "@/components/leaderboard/NicknameForm";

/** Scorecard section: today's rank, the top 5, and a prompt to pick a nickname. */
export function LeaderboardCard({ matchId }: { matchId: string }) {
  const [board, setBoard] = useState<DailyLeaderboard | null>(null);
  const [name, setName] = useState<PlayerName | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setName(getCachedProfile()?.name ?? null);
    getMyProfile()
      .then((p) => setName(p.name))
      .catch(() => {});
    getDailyLeaderboard(matchId).then(setBoard).catch(() => {});
  }, [matchId]);

  if (!board) return null;
  const me = board.me;

  const onSaved = (n: PlayerName) => {
    setName(n);
    setEditing(false);
    getMyProfile().catch(() => {}); // refresh the cached profile with the new name
    getDailyLeaderboard(matchId).then(setBoard).catch(() => {});
  };

  const top = board.entries.slice(0, 5);
  const meInTop = top.some((e) => e.isMe);

  return (
    <section className="pixel-box p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-[#2A3B63] pb-2">
        <h3 className="font-display text-[10px] sm:text-xs text-[var(--cream)] tracking-wider uppercase">
          {`LEADERBOARD · #${board.matchNumber}`}
        </h3>
        <span className="font-vt text-sm text-[var(--net)]">{`${board.players} finished`}</span>
      </div>

      {me && me.rank !== null && (
        <p className="font-display text-sm sm:text-base text-[var(--ball)] text-center">
          {`YOU'RE #${me.rank} OF ${board.players}`}
        </p>
      )}
      {me && me.rank === null && (
        <p className="font-vt text-lg text-[var(--net)] text-center">
          Archive replays don&apos;t count on the leaderboard. Here&apos;s how that day went.
        </p>
      )}

      <LeaderboardRows entries={top} />
      {me && me.rank !== null && !meInTop && (
        <div className="border-t border-dashed border-[#2A3B63] pt-1">
          <LeaderboardRows
            entries={[{ rank: me.rank, name: me.name ?? name, distance: me.distance, tiers: [], isMe: true }]}
          />
        </div>
      )}

      {editing || (!name && me?.rank != null) ? (
        <NicknameForm current={name} onSaved={onSaved} />
      ) : (
        name && (
          <p className="font-vt text-base text-[var(--net)] text-center">
            {`Playing as ${formatPlayerName(name)} · `}
            <button type="button" onClick={() => setEditing(true)} className="text-[var(--ball)] hover:underline cursor-pointer">
              change
            </button>
          </p>
        )
      )}

      <Link
        href={`/leaderboard?date=${board.matchId}`}
        className="block text-center font-display text-[9px] tracking-[0.2em] text-[var(--ball)] hover:underline"
      >
        FULL LEADERBOARD ▶
      </Link>
    </section>
  );
}

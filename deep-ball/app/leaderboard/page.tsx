"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatPlayerName, getAllTimeLeaderboard, getCachedProfile, getDailyLeaderboard, getMyProfile } from "@/lib/api";
import { AllTimeLeaderboard, DailyLeaderboard, PlayerName } from "@/lib/types";
import { CourtScene } from "@/components/court/CourtScene";
import { MenuSheet } from "@/components/chrome/MenuSheet";
import { SoundToggle } from "@/components/chrome/SoundToggle";
import { LeaderboardRows } from "@/components/leaderboard/LeaderboardRows";
import { NicknameForm } from "@/components/leaderboard/NicknameForm";

type Tab = "day" | "alltime";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("day");
  // ?date=YYYY-MM-DD shows a past day; read after mount so server and client render the same.
  const [date, setDate] = useState<string | null | undefined>(undefined);
  const [daily, setDaily] = useState<DailyLeaderboard | null>(null);
  const [allTime, setAllTime] = useState<AllTimeLeaderboard | null>(null);
  const [name, setName] = useState<PlayerName | null>(null);
  const [editing, setEditing] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setDate(new URLSearchParams(window.location.search).get("date"));
    setName(getCachedProfile()?.name ?? null);
    getMyProfile()
      .then((p) => setName(p.name))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (date === undefined) return;
    setFailed(false);
    if (tab === "day") getDailyLeaderboard(date).then(setDaily).catch(() => setFailed(true));
    else getAllTimeLeaderboard().then(setAllTime).catch(() => setFailed(true));
  }, [tab, date]);

  const onSaved = (n: PlayerName) => {
    setName(n);
    setEditing(false);
    getMyProfile().catch(() => {});
    if (tab === "day") getDailyLeaderboard(date).then(setDaily).catch(() => {});
    else getAllTimeLeaderboard().then(setAllTime).catch(() => {});
  };

  const board = tab === "day" ? daily : allTime;
  const me = board?.me ?? null;
  const meShown = board?.entries.some((e) => e.isMe);

  return (
    <main className="relative w-full min-h-dvh overflow-x-hidden">
      <div className="fixed top-3 left-3 sm:left-10 z-50">
        <MenuSheet />
      </div>
      <div className="fixed top-3 right-3 sm:right-10 z-50">
        <SoundToggle />
      </div>

      <div className="fixed inset-0 z-0">
        <CourtScene
          cameraFt={0}
          cameraDurationSec={0}
          cumulativeDistance={0}
          ballFt={0}
          ballTargetFt={0}
          flightProgress={1}
          isBallFlying={false}
          hasBallLanded={false}
          playerState="idle"
          showIdleBallInHand
        />
      </div>

      <div className="relative z-30 min-h-dvh flex flex-col items-center px-4 pt-16 pb-12">
        <div className="w-full max-w-[640px] flex flex-col gap-4">
          <div className="pixel-box bg-[#14213D]/95 p-5 sm:p-6 flex flex-col items-center gap-3 text-center">
            <h1 className="font-display text-2xl sm:text-3xl text-[var(--chalk)] chromatic-title">LEADERBOARD</h1>
            <p className="font-vt text-lg text-[var(--cream)]">
              {tab === "day"
                ? daily
                  ? `Match #${daily.matchNumber} · ${daily.dateLabel}`
                  : "Today's longest hitters"
                : "Total feet across every match played on its day"}
            </p>
            <div className="grid grid-cols-2 gap-1 w-full max-w-xs" role="tablist">
              {(
                [
                  { id: "day", label: date ? "THAT DAY" : "TODAY" },
                  { id: "alltime", label: "ALL-TIME" },
                ] as { id: Tab; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`arcade-btn py-1.5 font-display text-[9px] border cursor-pointer ${
                    tab === t.id
                      ? "bg-[var(--ball)] text-[#0B1220] border-[var(--chalk)]"
                      : "bg-[var(--navy)] text-[var(--chalk)] border-[#2A3B63]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pixel-box bg-[#14213D]/95 p-4">
            {editing || !name ? (
              <NicknameForm current={name} onSaved={onSaved} />
            ) : (
              <p className="font-vt text-lg text-[var(--cream)] text-center">
                {`Playing as ${formatPlayerName(name)} · `}
                <button type="button" onClick={() => setEditing(true)} className="text-[var(--ball)] hover:underline cursor-pointer">
                  change
                </button>
              </p>
            )}
          </div>

          {failed && (
            <div className="pixel-box bg-[#14213D]/95 p-4 text-center font-vt text-lg text-[var(--clay)]">
              Couldn&apos;t load the leaderboard. Refresh to try again.
            </div>
          )}

          {!board && !failed && (
            <div className="pixel-box bg-[#14213D]/95 p-4 text-center font-vt text-lg text-[var(--net)]">
              Loading…
            </div>
          )}

          {board && (
            <div className="pixel-box bg-[#14213D]/95 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between px-2 font-vt text-base text-[var(--net)]">
                <span>{`${board.players} player${board.players === 1 ? "" : "s"}`}</span>
                {me?.rank != null && <span className="text-[var(--ball)]">{`you: #${me.rank}`}</span>}
              </div>

              {board.entries.length === 0 ? (
                <p className="py-6 text-center font-vt text-lg text-[var(--net)]">
                  {tab === "day" ? "Nobody has finished this match yet." : "No finished matches yet."}
                </p>
              ) : (
                <LeaderboardRows entries={board.entries} />
              )}

              {me && me.rank != null && !meShown && (
                <div className="border-t border-dashed border-[#2A3B63] pt-1">
                  <LeaderboardRows
                    entries={[
                      {
                        rank: me.rank,
                        name: me.name ?? name,
                        distance: me.distance,
                        tiers: [],
                        isMe: true,
                        ...(tab === "alltime" && allTime?.me
                          ? { matches: allTime.me.matches, streak: allTime.me.streak }
                          : {}),
                      },
                    ]}
                  />
                </div>
              )}

              {tab === "day" && me && me.rank === null && (
                <p className="px-2 font-vt text-base text-[var(--net)]">
                  {`You played this one from the archive (${me.distance} ft), so it isn't ranked.`}
                </p>
              )}
              {tab === "day" && !me && (
                <p className="px-2 font-vt text-base text-[var(--net)]">
                  {date ? "Only games finished on their own day are ranked." : "Finish today's match to get on the board."}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-center gap-2">
            <Link
              href="/"
              className="pixel-box px-4 py-1.5 font-display text-[10px] tracking-[0.2em] text-[var(--cream)] hover:text-[var(--ball)]"
            >
              ◀ TODAY
            </Link>
            <Link
              href="/archive"
              className="pixel-box px-4 py-1.5 font-display text-[10px] tracking-[0.2em] text-[var(--cream)] hover:text-[var(--ball)]"
            >
              ARCHIVE
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

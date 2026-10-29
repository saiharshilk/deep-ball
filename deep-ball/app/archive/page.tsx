"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMyProfile } from "@/lib/api";
import { PastMatchSummary } from "@/lib/types";
import { TIERS } from "@/lib/tiers";
import { CourtScene } from "@/components/court/CourtScene";
import { MenuSheet } from "@/components/chrome/MenuSheet";
import { SoundToggle } from "@/components/chrome/SoundToggle";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const parseDay = (iso: string) => new Date(`${iso}T00:00:00Z`);
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

/** Calendar weeks (Mon-Sun) covering every released match, oldest first. */
function buildWeeks(history: PastMatchSummary[]) {
  const byDate = new Map(history.map((h) => [h.matchId, h]));
  const dates = history.map((h) => h.matchId).sort();
  if (!dates.length) return [];
  const first = parseDay(dates[0]);
  const last = parseDay(dates[dates.length - 1]);
  let cursor = addDays(first, -((first.getUTCDay() + 6) % 7)); // back to Monday
  const weeks: { date: string; match: PastMatchSummary | undefined }[][] = [];
  while (cursor <= last) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = isoDay(addDays(cursor, i));
      week.push({ date, match: byDate.get(date) });
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

export default function ArchivePage() {
  const router = useRouter();
  const [history, setHistory] = useState<PastMatchSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((p) => setHistory(p.history))
      .catch(() => setFailed(true));
  }, []);

  const weeks = useMemo(() => buildWeeks(history ?? []), [history]);
  const dates = (history ?? []).map((h) => h.matchId).sort();
  const playedCount = (history ?? []).filter((h) => h.played).length;

  const playHref = (m: PastMatchSummary) => (m.isToday ? "/play" : `/play?date=${m.matchId}`);

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
          <div className="pixel-box bg-[#14213D]/95 p-5 sm:p-6 flex flex-col items-center gap-2 text-center">
            <h1 className="font-display text-2xl sm:text-3xl text-[var(--chalk)] chromatic-title">THE ARCHIVE</h1>
            <p className="font-vt text-lg text-[var(--cream)]">
              Every past match, ready to play. Pick a day.
            </p>
            {history && (
              <p className="font-display text-[9px] tracking-[0.2em] text-[var(--net)] uppercase">
                {`${playedCount} of ${history.length} matches played`}
              </p>
            )}

            {dates.length > 0 && (
              <label className="mt-2 flex items-center gap-2 font-vt text-lg text-[var(--chalk)]">
                <span>Jump to</span>
                <input
                  type="date"
                  min={dates[0]}
                  max={dates[dates.length - 1]}
                  aria-label="Pick a match date"
                  className="bg-[#0B1220] border-2 border-[#2C3E66] px-2 py-1 font-vt text-lg text-[var(--ball)] focus:border-[var(--ball)] outline-none [color-scheme:dark]"
                  onChange={(e) => {
                    const m = history?.find((h) => h.matchId === e.target.value);
                    if (m) router.push(playHref(m));
                  }}
                />
              </label>
            )}
          </div>

          {failed && (
            <div className="pixel-box bg-[#14213D]/95 p-4 text-center font-vt text-lg text-[var(--clay)]">
              Couldn&apos;t load the archive. Refresh to try again.
            </div>
          )}

          {!history && !failed && (
            <div className="pixel-box bg-[#14213D]/95 p-4 text-center font-vt text-lg text-[var(--net)]">
              Loading matches…
            </div>
          )}

          {weeks.length > 0 && (
            <div className="pixel-box bg-[#14213D]/95 p-3 sm:p-4">
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center font-display text-[7px] sm:text-[9px] text-[var(--net)] tracking-wider">
                    {d}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1 sm:gap-2">
                {[...weeks].reverse().map((week) => (
                  <div key={week[0].date} className="grid grid-cols-7 gap-1 sm:gap-2">
                    {week.map(({ date, match }) => (
                      <DayTile key={date} date={date} match={match} href={match ? playHref(match) : null} />
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-vt text-sm text-[var(--net)]">
                <span><span className="text-[var(--ball)]">■</span> today</span>
                <span><span className="text-[#3FD0C9]">■</span> played</span>
                <span><span className="text-[var(--chalk)]">■</span> not played yet</span>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="self-center pixel-box px-4 py-1.5 font-display text-[10px] tracking-[0.2em] text-[var(--cream)] hover:text-[var(--ball)]"
          >
            ◀ BACK TO TODAY
          </Link>
        </div>
      </div>
    </main>
  );
}

function DayTile({ date, match, href }: { date: string; match?: PastMatchSummary; href: string | null }) {
  const day = Number(date.slice(8, 10));
  const month = parseDay(date).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();

  if (!match || !href) {
    return <div className="aspect-square border border-dashed border-[#2A3B63]/60 bg-[#0B1220]/40" aria-hidden="true" />;
  }

  const border = match.isToday
    ? "border-[var(--ball)]"
    : match.played
    ? "border-[#3FD0C9]"
    : "border-[#2C3E66] hover:border-[var(--chalk)]";

  const label = match.played
    ? `Match ${match.matchNumber}, ${match.dateLabel}: played, ${match.distance} feet. Play again for practice.`
    : `Match ${match.matchNumber}, ${match.dateLabel}: not played yet.`;

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`arcade-btn aspect-square border-2 ${border} bg-[#0B1220] p-1 flex flex-col items-center justify-between text-center`}
    >
      <span className="font-display text-[7px] sm:text-[8px] text-[var(--net)] leading-none">
        {day === 1 || match.matchNumber === 1 ? month : `#${match.matchNumber}`}
      </span>
      <span className={`font-display text-sm sm:text-lg leading-none ${match.isToday ? "text-[var(--ball)]" : "text-[var(--chalk)]"}`}>
        {day}
      </span>
      {match.played ? (
        <span className="w-full flex flex-col items-center gap-0.5">
          <span className="font-vt text-xs sm:text-sm text-[#3FD0C9] leading-none">{`${match.distance}ft`}</span>
          <span className="hidden sm:flex gap-px">
            {(match.tiers ?? []).map((t, i) => (
              <span key={i} className="w-1.5 h-1.5" style={{ backgroundColor: TIERS[t]?.color }} />
            ))}
          </span>
        </span>
      ) : (
        <span className={`font-display text-[7px] sm:text-[8px] leading-none ${match.isToday ? "text-[var(--ball)]" : "text-[var(--clay)]"}`}>
          {match.isToday ? "TODAY" : "PLAY"}
        </span>
      )}
    </Link>
  );
}

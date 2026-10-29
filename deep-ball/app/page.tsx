"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CompletedMatchRecord, DailyMatch } from "@/lib/types";
import { getTodayMatch } from "@/lib/api";
import { getTodayCompletedMatch } from "@/lib/stats";
import { CourtScene } from "@/components/court/CourtScene";
import { MenuSheet } from "@/components/chrome/MenuSheet";
import { SoundToggle } from "@/components/chrome/SoundToggle";
import { HowToPlay } from "@/components/chrome/HowToPlay";
import { Scorecard } from "@/components/results/Scorecard";

export default function HomePage() {
  const router = useRouter();
  const [match, setMatch] = useState<DailyMatch | null>(null);
  const [completedRecord, setCompletedRecord] =
    useState<CompletedMatchRecord | null>(null);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    // Only today's match counts as "already played"; yesterday's result shouldn't block a new day.
    getTodayMatch()
      .then((m) => {
        setMatch(m);
        const existing = getTodayCompletedMatch(m.matchId);
        if (existing) setCompletedRecord(existing);
      })
      .catch(() => {})
      .finally(() => setCheckedStorage(true));
  }, []);

  const handleServe = () => {
    router.push("/play");
  };

  return (
    <main className="relative w-full min-h-dvh overflow-hidden">
      {/* Top-left Hamburger Menu & Top-right Sound Toggle */}
      <div className="fixed top-3 left-3 sm:left-10 z-50">
        <MenuSheet />
      </div>
      <div className="fixed top-3 right-3 sm:right-10 z-50">
        <SoundToggle />
      </div>

      {/* Background Retro Pixel Court Scene */}
      <div className="fixed inset-0 z-0">
        <CourtScene
          cameraFt={completedRecord ? completedRecord.distance : 0}
          cameraDurationSec={0.9}
          cumulativeDistance={completedRecord ? completedRecord.distance : 0}
          ballFt={completedRecord ? completedRecord.distance : 0}
          ballTargetFt={completedRecord ? completedRecord.distance : 0}
          flightProgress={1}
          isBallFlying={false}
          hasBallLanded={Boolean(completedRecord)}
          playerState="idle"
          showIdleBallInHand={!completedRecord}
        />
      </div>

      {/* If today's match is already complete, show the Scorecard directly */}
      {checkedStorage && completedRecord ? (
        <Scorecard
          matchRecord={completedRecord}
          onReplay={() => {
            setCompletedRecord(null);
            router.push("/play");
          }}
        />
      ) : (
        /* Landing / Title Screen */
        <div className="relative z-30 min-h-dvh flex flex-col items-center justify-between px-4 py-12 sm:py-16 pointer-events-none">
          <div className="w-full max-w-[520px] my-auto flex flex-col items-center text-center gap-4 pointer-events-auto">
            {/* Title Panel */}
            <div className="w-full pixel-box p-6 sm:p-8 flex flex-col items-center gap-3 bg-[#14213D]/95">
              <div className="px-2.5 py-0.5 bg-[var(--purple)] border border-[var(--cream)]/50 font-vt text-xs sm:text-sm tracking-[0.25em] text-[var(--cream)] uppercase">
                NIGHT SESSION · CENTRE COURT
              </div>

              <h1 className="font-display text-3xl sm:text-5xl text-[var(--chalk)] tracking-tight chromatic-title mt-1">
                DEEP BALL
              </h1>

              <p className="font-display text-[9px] sm:text-xs tracking-[0.22em] sm:tracking-[0.38em] text-[var(--ball)] uppercase whitespace-nowrap">
                TENNIS EDITION
              </p>

              <p className="font-vt text-lg sm:text-xl text-[var(--chalk)]/95 tracking-wide mt-1 border-y border-[#2C3E66] py-1.5 w-full">
                7 prompts · 25 seconds each · rarer answers hit deeper
              </p>

              {/* Primary CTA: ▼ SERVE ▼ */}
              <button
                type="button"
                onClick={handleServe}
                className="arcade-btn w-full py-4 px-6 mt-2 pixel-box-yellow bg-[var(--navy)] hover:bg-[#1B2E54] font-display text-sm sm:text-base text-[var(--ball)] tracking-[0.2em] uppercase cursor-pointer flex items-center justify-center gap-3"
              >
                <svg
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  shapeRendering="crispEdges"
                  aria-hidden="true"
                >
                  <rect x="0" y="0" width="10" height="2" fill="currentColor" />
                  <rect x="2" y="2" width="6" height="2" fill="currentColor" />
                  <rect x="4" y="4" width="2" height="2" fill="currentColor" />
                </svg>
                <span>SERVE</span>
                <svg
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  shapeRendering="crispEdges"
                  aria-hidden="true"
                >
                  <rect x="0" y="0" width="10" height="2" fill="currentColor" />
                  <rect x="2" y="2" width="6" height="2" fill="currentColor" />
                  <rect x="4" y="4" width="2" height="2" fill="currentColor" />
                </svg>
              </button>
            </div>

            {/* Collapsible ▶ HOW TO PLAY panel */}
            <HowToPlay collapsible defaultOpen={false} />

            {/* Footer Chip: MATCH #3 · THU, OCT 29 */}
            <div className="pixel-box px-4 py-1.5 font-display text-[10px] sm:text-xs tracking-[0.2em] text-[var(--cream)] uppercase">
              {match
                ? `MATCH #${match.matchNumber} · ${match.dateLabel}`
                : "MATCH #3 · THU, OCT 29"}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CompletedMatchRecord, FieldStats, PlayerStatsSummary, PromptResultRecord } from "@/lib/types";
import { getCachedProfile, getFieldStats, getMyProfile, getTodayMatch } from "@/lib/api";
import { TIERS } from "@/lib/tiers";
import { getLandmarkReachedLabel } from "@/components/court/Landmarks";
import { StatsGrid } from "./StatsGrid";
import { DistributionChart } from "./DistributionChart";
import { ShareButton } from "./ShareButton";
import { MerchSurvey } from "@/components/chrome/MerchSurvey";

interface ScorecardProps {
  matchRecord: CompletedMatchRecord;
  onReplay?: () => void;
}

const EMPTY_STATS: PlayerStatsSummary = {
  streak: 0,
  bestStreak: 0,
  matchesPlayed: 0,
  averageFt: 0,
  bestMatchFt: 0,
  bestMatchNumber: 0,
  grandSlams: 0,
};

export function Scorecard({ matchRecord, onReplay }: ScorecardProps) {
  const [fieldStats, setFieldStats] = useState<FieldStats | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStatsSummary>(EMPTY_STATS);
  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [nextMatchAt, setNextMatchAt] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCachedProfile();
    if (cached) setPlayerStats(cached.stats);
    getMyProfile()
      .then((p) => setPlayerStats(p.stats))
      .catch(() => {});
    getFieldStats(matchRecord.matchId, matchRecord.distance).then(setFieldStats);
    getTodayMatch()
      .then((m) => setNextMatchAt(m.nextMatchAt))
      .catch(() => {});
  }, [matchRecord.matchId, matchRecord.distance]);

  // Live countdown to next match (the server's midnight, not the viewer's)
  useEffect(() => {
    if (!nextMatchAt) return;
    const target = new Date(nextMatchAt).getTime();
    const tick = () => {
      const remainingSec = Math.max(0, Math.floor((target - Date.now()) / 1000));
      if (remainingSec === 0) {
        setCountdownText(null);
        return;
      }
      const h = String(Math.floor(remainingSec / 3600)).padStart(2, "0");
      const m = String(Math.floor((remainingSec % 3600) / 60)).padStart(2, "0");
      const s = String(remainingSec % 60).padStart(2, "0");
      setCountdownText(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextMatchAt]);

  const reachedLabel = getLandmarkReachedLabel(matchRecord.distance);

  const promptRows: PromptResultRecord[] =
    matchRecord.results && matchRecord.results.length === 7
      ? matchRecord.results
      : matchRecord.tiers.map((tier, idx) => ({
          promptId: `p${idx + 1}`,
          promptIndex: idx + 1,
          promptText: `Prompt ${idx + 1}`,
          canonical: tier === "TIME_VIOLATION" ? "—" : "Valid Shot",
          tier,
          points: TIERS[tier].points,
        }));

  // Replays are practice: the server keeps the first finished run as the official result.
  const handlePlayAgain = () => {
    if (onReplay) {
      onReplay();
    } else {
      window.location.href = "/play";
    }
  };

  return (
    <div className="fixed inset-0 z-30 w-full h-dvh overflow-y-auto pt-16 pb-28 px-3 sm:px-6 bg-[#0B1220]/90">
      <div className="mx-auto w-full max-w-[640px] space-y-5">
        {/* Header: DEEP BALL left, MATCH #3 COMPLETE right */}
        <div className="pixel-box px-4 py-3 flex items-center justify-between">
          <span className="font-display text-xs sm:text-sm text-[var(--chalk)] chromatic-subtle">
            DEEP BALL
          </span>
          <span className="font-display text-[10px] sm:text-xs text-[var(--ball)]">
            {`MATCH #${matchRecord.matchNumber} COMPLETE`}
          </span>
        </div>

        {/* Hero Distance Banner */}
        <div className="pixel-box-yellow p-6 text-center flex flex-col items-center gap-2">
          <div className="font-vt text-sm tracking-[0.25em] text-[var(--cream)] uppercase">
            TOTAL DISTANCE HIT TODAY
          </div>
          <div className="font-display text-4xl sm:text-6xl text-[var(--chalk)] chromatic-title my-1">
            {matchRecord.distance}
          </div>
          <div className="font-display text-sm sm:text-base text-[#3FD0C9]">
            {`${matchRecord.distance} ft`}
          </div>
          <div className="mt-1 px-3 py-1 bg-[#0B1220] border border-[var(--ball)]/50 font-display text-[10px] sm:text-xs text-[var(--ball)] tracking-wider uppercase">
            {reachedLabel}
          </div>
        </div>

        {/* Per-prompt 7-row breakdown */}
        <section className="pixel-box p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#2A3B63] pb-2">
            <h3 className="font-display text-[10px] sm:text-xs text-[var(--cream)] tracking-wider uppercase">
              SHOT-BY-SHOT SCORECARD
            </h3>
            <span className="font-vt text-xs text-[var(--net)]">
              7 PROMPTS
            </span>
          </div>

          <div className="divide-y divide-[#233457]">
            {promptRows.map((row) => {
              const tierMeta = TIERS[row.tier];
              const isTimeout = row.tier === "TIME_VIOLATION";

              return (
                <div
                  key={row.promptIndex}
                  className="py-2.5 flex items-center justify-between gap-2 text-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-display text-[10px] text-[var(--net)] w-5 shrink-0">
                      {`#${row.promptIndex}`}
                    </span>
                    <div className="min-w-0">
                      <div className="font-display text-xs sm:text-sm text-[var(--chalk)] truncate">
                        {isTimeout ? "—" : row.canonical}
                      </div>
                      <div className="font-vt text-xs sm:text-sm text-[var(--net)] truncate">
                        {row.promptText}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 font-display text-[8px] sm:text-[9px] border border-black/80 ${
                        tierMeta.shimmer ? "grand-slam-shimmer" : ""
                      }`}
                      style={{
                        backgroundColor: "#0B1220",
                        color: tierMeta.color,
                        borderColor: tierMeta.color,
                      }}
                    >
                      {tierMeta.label}
                    </span>
                    <span className="font-display text-[10px] sm:text-xs text-[#3FD0C9] w-20 text-right whitespace-nowrap">
                      {`+${row.points} ft`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Share Button + Emoji Grid */}
        <ShareButton
          matchNumber={matchRecord.matchNumber}
          distance={matchRecord.distance}
          tiers={matchRecord.tiers}
        />

        {/* Today's Draw & Distribution Curve */}
        {fieldStats && (
          <DistributionChart
            fieldStats={fieldStats}
            myDistance={matchRecord.distance}
          />
        )}

        {/* Your Deep Ball 3x2 Stats Grid */}
        <StatsGrid stats={playerStats} />

        {/* Footer Countdown + Practice Replay */}
        <div className="pixel-box p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
          <div className="font-vt text-lg text-[var(--cream)] tracking-wider">
            {countdownText ? `next match in ${countdownText}` : nextMatchAt ? "a new match is ready, refresh to play" : "next match at midnight"}
          </div>
          <button
            type="button"
            onClick={handlePlayAgain}
            className="arcade-btn px-3 py-1.5 bg-[#0B1220] border border-[#2C3E66] hover:border-[var(--ball)] font-display text-[9px] text-[var(--net)] hover:text-[var(--ball)] cursor-pointer"
          >
            {`PRACTICE MATCH #${matchRecord.matchNumber} ↺`}
          </button>
          <Link
            href="/archive"
            className="arcade-btn px-3 py-1.5 bg-[#0B1220] border border-[#2C3E66] hover:border-[var(--ball)] font-display text-[9px] text-[var(--net)] hover:text-[var(--ball)]"
          >
            ◀ ARCHIVE
          </Link>
        </div>
      </div>

      {/* Dismissible Merch Survey */}
      <MerchSurvey />
    </div>
  );
}

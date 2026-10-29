"use client";

import React from "react";
import { PlayerStatsSummary } from "@/lib/types";

interface StatsGridProps {
  stats: PlayerStatsSummary;
}

/**
 * YOUR DEEP BALL, saved in this browser:
 * 3x2 grid of stat tiles:
 * STREAK (days), BEST STREAK, MATCHES played, AVERAGE (ft per match),
 * BEST MATCH (ft + match #), GRAND SLAMS (count of top-tier answers all time)
 */
export function StatsGrid({ stats }: StatsGridProps) {
  const tiles = [
    {
      label: "STREAK",
      value: `${stats.streak}`,
      sub: "days",
      color: "text-[var(--ball)]",
    },
    {
      label: "BEST STREAK",
      value: `${stats.bestStreak}`,
      sub: "days",
      color: "text-[var(--chalk)]",
    },
    {
      label: "MATCHES",
      value: `${stats.matchesPlayed}`,
      sub: "played",
      color: "text-[var(--chalk)]",
    },
    {
      label: "AVERAGE",
      value: `${stats.averageFt} ft`,
      sub: "per match",
      color: "text-[#3FD0C9]",
    },
    {
      label: "BEST MATCH",
      value: `${stats.bestMatchFt} ft`,
      sub: `match #${stats.bestMatchNumber}`,
      color: "text-[var(--clay)]",
    },
    {
      label: "GRAND SLAMS",
      value: `${stats.grandSlams}`,
      sub: "all-time top tier",
      color: "text-[#FF6B3D]",
    },
  ];

  return (
    <section className="pixel-box p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-[#2A3B63] pb-2">
        <h3 className="font-display text-[10px] sm:text-xs text-[var(--cream)] tracking-wider uppercase">
          YOUR DEEP BALL, saved in this browser
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="bg-[#0B1220] border-2 border-[#26385E] p-3 flex flex-col justify-between"
          >
            <div className="font-vt text-xs tracking-[0.18em] text-[var(--net)] uppercase">
              {t.label}
            </div>
            <div className={`font-display text-base sm:text-lg mt-1.5 ${t.color}`}>
              {t.value}
            </div>
            <div className="font-vt text-xs text-[var(--chalk)]/65 mt-0.5">
              {t.sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

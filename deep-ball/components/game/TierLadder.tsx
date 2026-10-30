"use client";

import React from "react";
import { motion } from "framer-motion";
import { TierKey } from "@/lib/types";
import { SCORING_LADDER_TIERS, TIERS } from "@/lib/tiers";

interface TierLadderProps {
  earnedTier: TierKey;
  pctOfPlayers?: number;
}

/**
 * Tier ladder on the right:
 * Dashed horizontal guide lines at each tier with a colored dot and label,
 * MOONBALL · 10, CROSSCOURT · 20, ...
 * The earned tier lights up and displays "% of players said this" if returned.
 */
export function TierLadder({ earnedTier, pctOfPlayers }: TierLadderProps) {
  return (
    <div
      className="w-full max-w-[300px] pixel-box p-3 space-y-1.5 z-30"
      aria-label="Scoring tier ladder"
    >
      <div className="font-vt text-xs tracking-[0.2em] text-[var(--net)] uppercase mb-1 flex items-center justify-between">
        <span>RARITY LADDER</span>
        <span>FT / PTS</span>
      </div>

      {SCORING_LADDER_TIERS.map((tierKey) => {
        const meta = TIERS[tierKey];
        const isEarned = earnedTier === tierKey;

        return (
          <motion.div
            key={tierKey}
            initial={false}
            animate={
              isEarned
                ? { scale: 1.03, backgroundColor: "rgba(11, 18, 32, 0.95)" }
                : { scale: 1, backgroundColor: "rgba(11, 18, 32, 0.4)" }
            }
            className={`px-2.5 py-1.5 border transition-colors ${
              isEarned
                ? "border-2 shadow-[0_0_12px_rgba(255,255,255,0.18)]"
                : "border-transparent opacity-65"
            }`}
            style={{
              borderColor: isEarned ? meta.color : "transparent",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 shrink-0 border border-black"
                style={{
                  backgroundColor: meta.color,
                  boxShadow: isEarned ? `0 0 8px ${meta.color}` : "none",
                }}
              />
              <span
                className={`font-display text-[9px] sm:text-[10px] tracking-wide whitespace-nowrap ${
                  meta.shimmer && isEarned ? "grand-slam-shimmer" : ""
                }`}
                style={{ color: meta.color }}
              >
                {meta.label}
              </span>
              <div className="flex-1 border-b border-dashed border-[var(--chalk)]/30 mx-1" />
              <span className="font-display text-[10px] text-[var(--chalk)]">
                {meta.points}
              </span>
            </div>

            {isEarned && typeof pctOfPlayers === "number" && (
              <div className="mt-1 text-right font-vt text-xs sm:text-sm text-[#3FD0C9]">
                {pctOfPlayers > 0 ? `${pctOfPlayers}% of players said this` : "nobody else has said this"}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

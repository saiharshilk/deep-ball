"use client";

import React from "react";
import { motion } from "framer-motion";
import { TierKey } from "@/lib/types";
import { TIERS } from "@/lib/tiers";
import { AnswerBanner } from "./AnswerBanner";
import { TierLadder } from "./TierLadder";

interface RevealStampProps {
  canonical: string;
  tier: TierKey;
  points: number;
  pctOfPlayers?: number;
  isTimeout: boolean;
  isLastPrompt: boolean;
  isShotLanded: boolean;
  onNext: () => void;
}

export function RevealStamp({
  canonical,
  tier,
  points,
  pctOfPlayers,
  isTimeout,
  isLastPrompt,
  isShotLanded,
  onNext,
}: RevealStampProps) {
  const tierMeta = TIERS[tier];

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-16 z-30 pointer-events-none flex flex-col justify-between p-4 sm:p-6"
      aria-live="polite"
    >
      {/* Top / Center area: Tilted Banner + Tier Stamp + Rarity Ladder */}
      <div className="my-auto mx-auto w-full max-w-[680px] flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 pointer-events-auto">
        {/* Left/Center Column: Banner & Stamp */}
        <div className="flex flex-col items-center text-center gap-3 flex-1">
          {!isTimeout ? (
            <AnswerBanner canonical={canonical} tier={tier} />
          ) : (
            <div className="px-4 py-1.5 bg-[#0B1220] border-2 border-[#3A4560] font-display text-sm text-[var(--net)]">
              —
            </div>
          )}

          {/* Centered Tier Stamp */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 280, damping: 22 }}
            className="pixel-box px-5 py-4 sm:px-7 sm:py-5 w-full max-w-[380px] flex flex-col items-center gap-2"
            style={{
              borderColor: tierMeta.color,
              boxShadow: `0 0 24px ${tierMeta.color}40, 0 6px 0 #050911`,
            }}
          >
            <div
              className={`font-display text-lg sm:text-2xl tracking-wider uppercase ${
                tierMeta.shimmer ? "grand-slam-shimmer" : ""
              }`}
              style={{ color: tierMeta.color }}
            >
              {tierMeta.label}
            </div>

            <div className="font-display text-xs sm:text-sm text-[var(--chalk)] bg-[#0B1220] px-3 py-1 border border-[#2C3E66]">
              {isTimeout
                ? "+0 PTS"
                : `+${points} PTS · +${points} ft`}
            </div>

            <p className="font-vt text-base sm:text-xl text-[var(--cream)] mt-0.5">
              {isTimeout ? "the shot clock beat you." : tierMeta.flavor}
            </p>
          </motion.div>
        </div>

        {/* Right Column: Tier Ladder */}
        {!isTimeout && (
          <TierLadder earnedTier={tier} pctOfPlayers={pctOfPlayers} />
        )}
      </div>

      {/* Bottom CTA Button */}
      <div className="mx-auto w-full max-w-[440px] pointer-events-auto pb-1">
        <button
          type="button"
          onClick={onNext}
          className="arcade-btn w-full py-3.5 px-6 pixel-box-yellow bg-[var(--navy)] hover:bg-[#1B2D52] font-display text-xs sm:text-sm text-[var(--ball)] tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2.5"
        >
          <span>
            {isLastPrompt ? "SEE THE SCORECARD" : "NEXT SHOT"}
          </span>
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
          {!isShotLanded && (
            <span className="font-vt text-xs text-[var(--chalk)]/70">
              (SKIP FLIGHT)
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { PromptResultRecord } from "@/lib/types";
import { ProgressPips } from "./ProgressPips";

interface HudProps {
  distance: number;
  score: number;
  currentPromptIndex: number; // 0..6
  totalPrompts?: number;
  results: PromptResultRecord[];
}

export function Hud({
  distance,
  score,
  currentPromptIndex,
  totalPrompts = 7,
  results,
}: HudProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none px-14 sm:px-20 pt-2.5">
      <div className="mx-auto max-w-[680px] flex items-center justify-between gap-2">
        {/* Left Box: DISTANCE */}
        <div className="pixel-box px-2.5 py-1.5 sm:px-3.5 sm:py-2 min-w-[84px] sm:min-w-[110px] pointer-events-auto">
          <div className="font-vt text-[11px] sm:text-xs tracking-[0.2em] text-[var(--chalk)]/70 uppercase leading-none">
            DISTANCE
          </div>
          <div className="font-display text-xs sm:text-sm text-[#3FD0C9] mt-1 leading-none">
            {`${distance} ft`}
          </div>
        </div>

        {/* Center Row: 7 Progress Pips + PROMPT X OF 7 */}
        <div className="pixel-box px-2.5 py-1.5 sm:px-4 sm:py-2 pointer-events-auto">
          <ProgressPips
            total={totalPrompts}
            currentIndex={currentPromptIndex}
            results={results}
          />
        </div>

        {/* Right Box: SCORE */}
        <div className="pixel-box px-2.5 py-1.5 sm:px-3.5 sm:py-2 min-w-[78px] sm:min-w-[104px] text-right pointer-events-auto">
          <div className="font-vt text-[11px] sm:text-xs tracking-[0.2em] text-[var(--chalk)]/70 uppercase leading-none">
            SCORE
          </div>
          <div className="font-display text-xs sm:text-sm text-[var(--clay)] mt-1 leading-none">
            {score}
          </div>
        </div>
      </div>
    </header>
  );
}

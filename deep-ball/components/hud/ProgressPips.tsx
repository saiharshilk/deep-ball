"use client";

import React from "react";
import { PromptResultRecord } from "@/lib/types";
import { TIERS } from "@/lib/tiers";

interface ProgressPipsProps {
  total: number;
  currentIndex: number; // 0-based (0..6)
  results: PromptResultRecord[];
}

export function ProgressPips({
  total = 7,
  currentIndex,
  results,
}: ProgressPipsProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex items-center gap-1.5 sm:gap-2"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Prompt ${currentIndex + 1} of ${total}`}
      >
        {Array.from({ length: total }).map((_, idx) => {
          const completed = results[idx];
          const isCurrent = idx === currentIndex && !completed;

          if (completed) {
            const tierMeta = TIERS[completed.tier];
            return (
              <div
                key={idx}
                title={`Prompt ${idx + 1}: ${tierMeta.label} (+${completed.points} ft)`}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-[#0B1220] transition-transform"
                style={{
                  backgroundColor: tierMeta.color,
                  boxShadow: "0 2px 0 #050911",
                }}
              />
            );
          }

          if (isCurrent) {
            return (
              <div
                key={idx}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-[var(--ball)] bg-[var(--navy)] animate-pulse"
                style={{
                  boxShadow: "0 0 8px rgba(215, 245, 66, 0.75), 0 2px 0 #050911",
                }}
              />
            );
          }

          return (
            <div
              key={idx}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-[#2A3B63] bg-[#0B1220]"
            />
          );
        })}
      </div>
      <div className="font-vt text-xs sm:text-sm tracking-[0.2em] text-[var(--chalk)]/90 uppercase">
        {`PROMPT ${Math.min(total, currentIndex + 1)} OF ${total}`}
      </div>
    </div>
  );
}

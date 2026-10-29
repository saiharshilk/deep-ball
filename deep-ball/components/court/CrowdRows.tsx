"use client";

import React from "react";
import { ftToBottomPx } from "./Landmarks";

interface CrowdRowsProps {
  ballFt: number;
  hasLanded: boolean;
}

const ROWS = [
  { ft: 112, count: 18, tier: "front" },
  { ft: 128, count: 18, tier: "front" },
  { ft: 146, count: 20, tier: "lower" },
  { ft: 164, count: 20, tier: "lower" },
  { ft: 184, count: 20, tier: "cheap" },
  { ft: 204, count: 22, tier: "cheap" },
  { ft: 224, count: 22, tier: "cheap" },
  { ft: 244, count: 22, tier: "cheap" },
  { ft: 262, count: 20, tier: "upper" },
  { ft: 315, count: 18, tier: "upper" },
  { ft: 335, count: 18, tier: "upper" },
];

const SHIRT_COLORS = ["#14213D", "#4B2E83", "#2F7D32", "#D9733B", "#243B67", "#F4F1E6"];
const HEAD_COLORS = ["#EAD9A6", "#D9B882", "#C59B6D", "#F4F1E6", "#8D5B4C"];

/**
 * Rows of pixel crowd heads in cream and navy with occasional camera flashes.
 * Heads near the ball's landing coordinate pop up (cheer) and track the ball.
 */
export function CrowdRows({ ballFt, hasLanded }: CrowdRowsProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-10 overflow-hidden">
      {ROWS.map((row, rIdx) => {
        const bottomPx = ftToBottomPx(row.ft);
        const distanceToBall = Math.abs(ballFt - row.ft);
        const isCheering = hasLanded && distanceToBall <= 36;
        const isBallAbove = ballFt > row.ft;

        return (
          <div
            key={row.ft}
            style={{ bottom: `${bottomPx}px` }}
            className="absolute inset-x-6 sm:inset-x-10 h-6 bg-[#0E182E] border-t-2 border-[#233559] flex items-end justify-around px-2"
          >
            {Array.from({ length: row.count }).map((_, cIdx) => {
              const seed = (rIdx * 31 + cIdx * 17) % 100;
              const headColor = HEAD_COLORS[seed % HEAD_COLORS.length];
              const shirtColor = SHIRT_COLORS[(seed + rIdx) % SHIRT_COLORS.length];
              const hasFlash = (rIdx * 7 + cIdx * 13) % 29 === 0;
              const cheerJump =
                isCheering && (cIdx + rIdx) % 2 === 0 ? -5 : isCheering ? -3 : 0;
              // Turn head slightly as ball passes
              const lookShift = isBallAbove ? (cIdx % 2 === 0 ? 1 : -1) : 0;

              return (
                <div
                  key={cIdx}
                  className="relative flex flex-col items-center transition-transform duration-150"
                  style={{
                    transform: `translate(${lookShift}px, ${cheerJump}px)`,
                  }}
                >
                  {/* Occasional camera flash in the stands */}
                  {hasFlash && (
                    <div
                      className="absolute -top-3 w-3 h-3 bg-[var(--chalk)] animate-pulse"
                      style={{
                        boxShadow: "0 0 12px 3px rgba(244, 241, 230, 0.9)",
                        animationDuration: `${1.8 + (seed % 4) * 0.6}s`,
                      }}
                    />
                  )}
                  {/* Pixel head */}
                  <div
                    className="w-2.5 h-2.5 border border-[#0B1220]"
                    style={{ backgroundColor: headColor }}
                  >
                    {/* Tiny pixel eyes looking toward court or sky */}
                    <div
                      className="w-1.5 h-0.5 bg-[#0B1220] mx-auto"
                      style={{ marginTop: isBallAbove ? "1px" : "4px" }}
                    />
                  </div>
                  {/* Shoulders */}
                  <div
                    className="w-3.5 h-2 border-x border-t border-[#0B1220]"
                    style={{ backgroundColor: shirtColor }}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import React from "react";
import { ftToBottomPx, WORLD_MAX_FT } from "./Landmarks";

interface DistanceRulerProps {
  currentDistance: number;
}

/**
 * Vertical distance ruler on the right edge:
 * - ticks every 10 ft
 * - labels every 50 ft
 * - "YOU ◂" marker in clay orange showing current cumulative distance
 */
export function DistanceRuler({ currentDistance }: DistanceRulerProps) {
  const ticks: number[] = [];
  for (let ft = 0; ft <= WORLD_MAX_FT; ft += 10) {
    ticks.push(ft);
  }

  const youBottomPx = ftToBottomPx(Math.min(WORLD_MAX_FT, Math.max(0, currentDistance)));

  return (
    <div
      className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-14 z-30 border-l border-[var(--chalk)]/25 bg-[var(--night)]/75"
      aria-hidden="true"
    >
      {ticks.map((ft) => {
        const isMajor = ft % 50 === 0;
        const bottomPx = ftToBottomPx(ft);

        return (
          <div
            key={ft}
            style={{ bottom: `${bottomPx}px` }}
            className="absolute right-0 flex items-center justify-end w-full"
          >
            {isMajor && (
              <span className="mr-1.5 font-vt text-[11px] sm:text-xs text-[var(--chalk)]/80 leading-none">
                {ft}
              </span>
            )}
            <div
              className={`h-[2px] ${
                isMajor
                  ? "w-3 bg-[var(--chalk)]/90"
                  : "w-1.5 bg-[var(--chalk)]/35"
              }`}
            />
          </div>
        );
      })}

      {/* "YOU ◂" Marker in clay orange */}
      <div
        className="absolute right-0 flex items-center z-40 transition-all duration-500 ease-out"
        style={{ bottom: `${youBottomPx - 10}px` }}
      >
        <div className="px-1.5 py-0.5 bg-[var(--clay)] text-[var(--chalk)] font-display text-[8px] sm:text-[9px] tracking-tighter border border-[var(--chalk)] shadow-[0_2px_0_#000] whitespace-nowrap mr-1 flex items-center gap-1">
          <span>YOU</span>
          <svg
            width="6"
            height="8"
            viewBox="0 0 6 8"
            shapeRendering="crispEdges"
            aria-hidden="true"
          >
            <rect x="4" y="0" width="2" height="8" fill="currentColor" />
            <rect x="2" y="2" width="2" height="4" fill="currentColor" />
            <rect x="0" y="3" width="2" height="2" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { ftToBottomPx } from "./Landmarks";

interface BallProps {
  currentFt: number;
  targetFt: number;
  flightProgress: number; // 0..1
  isFlying: boolean;
  hasLanded: boolean;
  isTimeoutDribble?: boolean;
}

/**
 * Optic-yellow pixel tennis ball with:
 * - parabolic arc height & ground shadow
 * - pixel trail when flying
 * - squash-and-stretch + dust puff when landing
 */
export function Ball({
  currentFt,
  targetFt,
  flightProgress,
  isFlying,
  hasLanded,
  isTimeoutDribble = false,
}: BallProps) {
  const bottomPx = ftToBottomPx(currentFt);

  // Parabolic arc height (peaks mid-flight, clears the net at 39ft with shadow)
  const maxArcPx = isTimeoutDribble
    ? 14
    : Math.min(130, Math.max(38, (targetFt || 40) * 0.25));
  const arcOffsetPx = isFlying
    ? Math.round(Math.sin(flightProgress * Math.PI) * maxArcPx)
    : 0;

  // Squash and stretch right on landing
  const scaleX = hasLanded && !isFlying ? 1.15 : isFlying ? 0.92 : 1;
  const scaleY = hasLanded && !isFlying ? 0.85 : isFlying ? 1.12 : 1;

  // Trail positions behind the ball while flying
  const trail1Ft = Math.max(0, currentFt - (isTimeoutDribble ? 2 : 7));
  const trail2Ft = Math.max(0, currentFt - (isTimeoutDribble ? 4 : 15));
  const trail3Ft = Math.max(0, currentFt - (isTimeoutDribble ? 6 : 24));

  return (
    <>
      {/* Pixel trail segments while in flight */}
      {isFlying && flightProgress > 0.05 && (
        <>
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[var(--ball)]/60 z-20"
            style={{
              bottom: `${ftToBottomPx(trail1Ft) + Math.round(arcOffsetPx * 0.85)}px`,
            }}
          />
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--ball)]/35 z-20"
            style={{
              bottom: `${ftToBottomPx(trail2Ft) + Math.round(arcOffsetPx * 0.65)}px`,
            }}
          />
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[var(--chalk)]/25 z-20"
            style={{
              bottom: `${ftToBottomPx(trail3Ft) + Math.round(arcOffsetPx * 0.45)}px`,
            }}
          />
        </>
      )}

      {/* Ground shadow at actual court/stands coordinate */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bg-black/60 z-20 transition-transform"
        style={{
          bottom: `${bottomPx - 3}px`,
          width: isFlying ? 10 : 14,
          height: isFlying ? 4 : 6,
        }}
      />

      {/* Dust puff ring on landing */}
      {hasLanded && !isFlying && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center"
          style={{ bottom: `${bottomPx - 8}px` }}
        >
          <div className="w-8 h-3 border-2 border-dashed border-[var(--chalk)]/75 animate-ping" />
          {!isTimeoutDribble && (
            <div className="absolute -top-6 px-1.5 py-0.5 bg-[var(--clay)] text-[var(--chalk)] font-display text-[9px] border border-[var(--chalk)] shadow-[0_2px_0_#000] whitespace-nowrap">
              {`${Math.round(currentFt)} FT`}
            </div>
          )}
        </div>
      )}

      {/* The Pixel Tennis Ball */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-30"
        style={{
          bottom: `${bottomPx + arcOffsetPx}px`,
          transform: `translateX(-50%) scale(${scaleX}, ${scaleY})`,
        }}
      >
        <div
          className="w-3.5 h-3.5 bg-[var(--ball)] border-2 border-[#0B1220] relative"
          style={{
            boxShadow:
              "0 0 10px rgba(215, 245, 66, 0.9), inset -2px -2px 0 #9BB818",
          }}
        >
          {/* White pixel seam */}
          <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[var(--chalk)]" />
        </div>
      </div>
    </>
  );
}

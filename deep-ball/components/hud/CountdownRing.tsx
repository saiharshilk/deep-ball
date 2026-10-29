"use client";

import React from "react";

interface CountdownRingProps {
  secondsLeft: number;
  totalSeconds?: number;
}

/**
 * Circular countdown ring showing seconds left.
 * Turns clay orange at <= 5s and shakes slightly at <= 3s.
 */
export function CountdownRing({
  secondsLeft,
  totalSeconds = 25,
}: CountdownRingProps) {
  const clamped = Math.max(0, Math.min(totalSeconds, secondsLeft));
  const displaySec = Math.ceil(clamped);
  const isWarning = displaySec <= 5;
  const isCritical = displaySec <= 3 && displaySec > 0;

  const size = 46;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = clamped / totalSeconds;
  const dashOffset = circumference * (1 - progress);

  const strokeColor = isWarning ? "var(--clay)" : "var(--ball)";

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none ${
        isCritical ? "animate-[bounce_0.22s_infinite]" : ""
      }`}
      style={{ width: size, height: size }}
      role="timer"
      aria-label={`${displaySec} seconds remaining`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="#0B1220"
          stroke="#26385E"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="butt"
          style={{
            transition: "stroke-dashoffset 100ms linear, stroke 200ms",
          }}
        />
      </svg>
      <span
        className={`absolute font-display text-xs tracking-tighter ${
          isWarning ? "text-[var(--clay)]" : "text-[var(--chalk)]"
        }`}
      >
        {displaySec}
      </span>
    </div>
  );
}

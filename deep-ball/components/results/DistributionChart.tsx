"use client";

import React from "react";
import { FieldStats } from "@/lib/types";

interface DistributionChartProps {
  fieldStats: FieldStats;
  myDistance: number;
}

/**
 * THE DRAW: 6,370 players so far (real finishers only)
 * Big percentile line: "61%  you hit deeper than 61% of players"
 * Below it: smooth distribution curve (SVG area chart, cyan stroke, navy fill)
 * over 0-700 ft with a dashed MEDIAN 265 line and a clay-orange vertical YOU · 310 line.
 */
export function DistributionChart({
  fieldStats,
  myDistance,
}: DistributionChartProps) {
  const width = 560;
  const height = 170;
  const padLeft = 24;
  const padRight = 24;
  const padTop = 28;
  const padBottom = 26;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const ftToX = (ft: number) =>
    padLeft + (Math.max(0, Math.min(700, ft)) / 700) * plotW;

  const maxDensity = Math.max(
    0.01,
    ...fieldStats.distribution.map((d) => d.density)
  );

  const densityToY = (density: number) =>
    padTop + plotH - (density / maxDensity) * plotH;

  // Build smooth SVG path across 0..700 ft
  const points = fieldStats.distribution.map((pt) => ({
    x: ftToX(pt.ft),
    y: densityToY(pt.density),
  }));

  const linePath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${ftToX(700).toFixed(1)} ${(
    padTop + plotH
  ).toFixed(1)} L ${ftToX(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  const medianX = ftToX(fieldStats.medianDistance);
  const youX = ftToX(myDistance);

  return (
    <section className="pixel-box p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-[#2A3B63] pb-2">
        <h3 className="font-display text-[10px] sm:text-xs text-[var(--cream)] tracking-wider uppercase">
          {`THE DRAW: ${fieldStats.playersFinished.toLocaleString()} ${fieldStats.playersFinished === 1 ? "player" : "players"} so far`}
        </h3>
      </div>

      {/* Big percentile callout */}
      <div className="flex flex-wrap items-baseline gap-2.5 pt-1">
        <span className="font-display text-2xl sm:text-3xl text-[var(--ball)]">
          {`${fieldStats.percentile}%`}
        </span>
        <span className="font-vt text-lg sm:text-xl text-[var(--chalk)]">
          {fieldStats.estimated
            ? `deeper than about ${fieldStats.percentile}% of a typical field`
            : `you hit deeper than ${fieldStats.percentile}% of players`}
        </span>
      </div>
      {fieldStats.estimated && (
        <p className="font-vt text-sm text-[var(--net)] -mt-1">
          Not many players yet, so this curve is the expected spread. It switches to real results as more people play.
        </p>
      )}

      {/* SVG Area Chart */}
      <div className="w-full bg-[#0B1220] border-2 border-[#26385E] p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label={`Field distance distribution chart. Median ${fieldStats.medianDistance} ft, your distance ${myDistance} ft.`}
        >
          <defs>
            <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3FD0C9" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#14213D" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          {/* Baseline axis */}
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={width - padRight}
            y2={padTop + plotH}
            stroke="#2C3E66"
            strokeWidth="2"
          />

          {/* Area under curve */}
          <path d={areaPath} fill="url(#curveFill)" />

          {/* Cyan stroke curve */}
          <path
            d={linePath}
            fill="none"
            stroke="#3FD0C9"
            strokeWidth="2.5"
          />

          {/* Dashed MEDIAN 265 vertical line */}
          <line
            x1={medianX}
            y1={padTop - 4}
            x2={medianX}
            y2={padTop + plotH}
            stroke="#C9CED6"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={medianX}
            y={padTop - 8}
            textAnchor="middle"
            fill="#C9CED6"
            fontSize="11"
            fontFamily="var(--font-vt323), monospace"
          >
            {`MEDIAN ${fieldStats.medianDistance}`}
          </text>

          {/* Clay-orange vertical YOU · X line */}
          <line
            x1={youX}
            y1={padTop - 6}
            x2={youX}
            y2={padTop + plotH}
            stroke="#D9733B"
            strokeWidth="2.5"
          />
          <rect
            x={Math.max(4, Math.min(width - 84, youX - 38))}
            y={4}
            width="76"
            height="16"
            fill="#D9733B"
          />
          <text
            x={Math.max(42, Math.min(width - 46, youX))}
            y={15}
            textAnchor="middle"
            fill="#F4F1E6"
            fontSize="11"
            fontWeight="bold"
            fontFamily="var(--font-vt323), monospace"
          >
            {`YOU · ${myDistance}`}
          </text>

          {/* X-axis tick labels (0..700 ft) */}
          {[0, 100, 200, 300, 400, 500, 600, 700].map((tick) => {
            const x = ftToX(tick);
            return (
              <g key={tick}>
                <line
                  x1={x}
                  y1={padTop + plotH}
                  x2={x}
                  y2={padTop + plotH + 4}
                  stroke="#C9CED6"
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  fill="#C9CED6"
                  fontSize="11"
                  fontFamily="var(--font-vt323), monospace"
                >
                  {`${tick}ft`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

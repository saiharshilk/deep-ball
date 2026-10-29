"use client";

import React, { useState } from "react";
import { TIERS, SCORING_LADDER_TIERS } from "@/lib/tiers";

interface HowToPlayProps {
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function HowToPlay({
  collapsible = false,
  defaultOpen = false,
}: HowToPlayProps) {
  const [open, setOpen] = useState(defaultOpen);

  const content = (
    <div className="space-y-3 text-left font-vt text-base sm:text-lg leading-snug text-[var(--chalk)]">
      <ol className="space-y-1.5 list-none">
        <li className="flex gap-2">
          <span className="text-[var(--ball)] font-display text-xs mt-1">1.</span>
          <span>
            You get <strong className="text-[var(--ball)]">7 tennis prompts</strong>, one at a time.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-[var(--ball)] font-display text-xs mt-1">2.</span>
          <span>
            You have <strong className="text-[var(--ball)]">25 seconds</strong> to type{" "}
            <strong className="text-[var(--chalk)]">one</strong> answer per prompt.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-[var(--ball)] font-display text-xs mt-1">3.</span>
          <span>
            Wrong guess? That&apos;s a <strong className="text-[var(--clay)]">fault</strong>. Try again while the clock runs.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-[var(--ball)] font-display text-xs mt-1">4.</span>
          <span>
            Every correct answer scores.{" "}
            <strong className="text-[#3FD0C9]">
              The rarer the answer, the deeper the ball flies.
            </strong>
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-[var(--ball)] font-display text-xs mt-1">5.</span>
          <span>
            Points = feet. Hit it past the far baseline, into the crowd, and over the roof.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-[var(--ball)] font-display text-xs mt-1">6.</span>
          <span>One match a day. Same prompts for everyone.</span>
        </li>
      </ol>

      <div className="pt-2 border-t border-[#2A3B63]">
        <div className="font-display text-[10px] text-[var(--cream)] mb-2 tracking-wider">
          RARITY SCORING TIERS
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-sm">
          {[...SCORING_LADDER_TIERS].reverse().map((tierKey) => {
            const t = TIERS[tierKey];
            return (
              <div
                key={tierKey}
                className="flex items-center justify-between bg-[#0B1220] px-2 py-1 border border-[#26385E]"
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 inline-block border border-black"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="font-vt text-sm" style={{ color: t.color }}>
                    {t.label}
                  </span>
                </span>
                <span className="font-display text-[10px] text-[var(--chalk)]">
                  {`+${t.points} ft`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (!collapsible) {
    return content;
  }

  return (
    <div className="w-full pixel-box">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full px-4 py-2.5 flex items-center justify-between font-display text-xs text-[var(--cream)] hover:text-[var(--ball)] transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          {open ? (
            <svg
              width="10"
              height="8"
              viewBox="0 0 10 8"
              shapeRendering="crispEdges"
              className="text-[var(--ball)]"
              aria-hidden="true"
            >
              <rect x="0" y="0" width="10" height="2" fill="currentColor" />
              <rect x="2" y="2" width="6" height="2" fill="currentColor" />
              <rect x="4" y="4" width="2" height="2" fill="currentColor" />
            </svg>
          ) : (
            <svg
              width="8"
              height="10"
              viewBox="0 0 8 10"
              shapeRendering="crispEdges"
              className="text-[var(--ball)]"
              aria-hidden="true"
            >
              <rect x="0" y="0" width="2" height="10" fill="currentColor" />
              <rect x="2" y="2" width="2" height="6" fill="currentColor" />
              <rect x="4" y="4" width="2" height="2" fill="currentColor" />
            </svg>
          )}
          <span>HOW TO PLAY</span>
        </span>
        <span className="font-vt text-sm text-[var(--chalk)]/70">
          {open ? "HIDE" : "RULES & TIERS"}
        </span>
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-[#26385E]">{content}</div>}
    </div>
  );
}

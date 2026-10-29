"use client";

import React, { useState } from "react";
import { TierKey } from "@/lib/types";
import { TIERS } from "@/lib/tiers";

interface ShareButtonProps {
  matchNumber: number;
  distance: number;
  tiers: TierKey[];
}

export function ShareButton({
  matchNumber,
  distance,
  tiers,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const emojiRow = tiers
    .map((t) => TIERS[t]?.emoji || "⬛")
    .join("");

  const shareText = `DEEP BALL #${matchNumber} 🎾 ${distance} ft\n${emojiRow}\ndeepball.game`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareText;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-2 w-full">
      <button
        type="button"
        onClick={handleCopy}
        className="arcade-btn w-full py-3.5 px-6 bg-[var(--ball)] text-[#0B1220] border-2 border-[var(--chalk)] font-display text-xs sm:text-sm tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(215,245,66,0.4),0_4px_0_#050911]"
      >
        <span>{copied ? "COPIED TO CLIPBOARD!" : "SHARE"}</span>
      </button>

      {/* Shareable emoji preview box */}
      <div className="w-full bg-[#0B1220] border border-[#2C3E66] px-3 py-2 text-center font-vt text-sm sm:text-base text-[var(--chalk)]/85 flex flex-col items-center">
        <div>{`DEEP BALL #${matchNumber} 🎾 ${distance} ft`}</div>
        <div className="tracking-widest text-base my-0.5">{emojiRow}</div>
        <div className="text-xs text-[var(--net)]">deepball.game</div>
      </div>

      {copied && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pixel-box-yellow px-4 py-2 font-display text-xs text-[var(--ball)] shadow-lg"
        >
          Copied!
        </div>
      )}
    </div>
  );
}

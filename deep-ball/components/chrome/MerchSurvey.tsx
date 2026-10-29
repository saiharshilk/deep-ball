"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { dismissMerchSurvey, isMerchDismissed } from "@/lib/stats";

export function MerchSurvey() {
  const [visible, setVisible] = useState(false);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    if (!isMerchDismissed()) {
      const timer = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  const handleVote = (choice: "up" | "down") => {
    dismissMerchSurvey(choice);
    setVoted(true);
    setTimeout(() => setVisible(false), 900);
  };

  const handleClose = () => {
    dismissMerchSurvey();
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Merchandise feedback survey"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[440px] pixel-box-yellow px-4 py-3 flex items-center justify-between gap-3"
    >
      {voted ? (
        <div className="w-full text-center font-display text-xs text-[var(--ball)] py-1">
          THANKS FOR THE CALL, UMPIRE!
        </div>
      ) : (
        <>
          <div className="flex flex-col">
            <span className="font-display text-[10px] sm:text-xs text-[var(--ball)]">
              THOUGHTS ON MERCH?
            </span>
            <span className="font-vt text-sm text-[var(--chalk)]/85">
              Retro pixel tennis caps & club tees?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleVote("up")}
              aria-label="Thumbs up on merch"
              className="arcade-btn bg-[#0B1220] border-2 border-[var(--ball)] px-2.5 py-1 text-base hover:bg-[var(--ball)] hover:text-[#0B1220] cursor-pointer"
            >
              👍
            </button>
            <button
              type="button"
              onClick={() => handleVote("down")}
              aria-label="Thumbs down on merch"
              className="arcade-btn bg-[#0B1220] border-2 border-[var(--chalk)]/50 px-2.5 py-1 text-base hover:bg-[var(--clay)] hover:text-[var(--chalk)] cursor-pointer"
            >
              👎
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Dismiss survey"
              className="arcade-btn p-1 text-[var(--chalk)]/70 hover:text-[var(--chalk)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { motion } from "framer-motion";
import { PromptPublic } from "@/lib/types";

interface PromptCardProps {
  prompt: PromptPublic;
  totalPrompts?: number;
  isCountdown: boolean;
  countdownNum: number;
}

export function PromptCard({
  prompt,
  totalPrompts = 7,
  isCountdown,
  countdownNum,
}: PromptCardProps) {
  return (
    <div
      className="w-full max-w-[540px] mx-auto px-4 flex flex-col items-center gap-3 z-30"
      aria-live="polite"
    >
      <motion.div
        key={prompt.id}
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="w-full pixel-box p-4 sm:p-6 text-center"
      >
        <div className="font-display text-[10px] sm:text-xs tracking-[0.2em] text-[var(--clay)] uppercase">
          {`PROMPT ${prompt.index} OF ${totalPrompts}`}
        </div>

        <h2 className="font-display text-sm sm:text-lg md:text-xl text-[var(--chalk)] leading-relaxed mt-2.5">
          {prompt.text}
        </h2>

        {prompt.hint && (
          <div className="font-vt text-base sm:text-lg text-[#3FD0C9] mt-2.5 flex items-center justify-center gap-1.5">
            <span className="text-xs">▼</span>
            <span>{prompt.hint}</span>
          </div>
        )}
      </motion.div>

      {/* Pre-prompt countdown pill */}
      {isCountdown && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="pixel-box-yellow px-4 py-1.5 font-vt text-base sm:text-lg tracking-wider text-[var(--ball)] uppercase"
        >
          {`serving · the clock starts in ${
            countdownNum >= 3
              ? "3… 2… 1…"
              : countdownNum === 2
              ? "2… 1…"
              : "1…"
          }`}
        </motion.div>
      )}
    </div>
  );
}

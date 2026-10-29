"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CountdownRing } from "@/components/hud/CountdownRing";

interface AnswerBarProps {
  secondsLeft: number;
  totalSeconds?: number;
  disabled: boolean;
  faultMessage: string | null;
  faultCount: number;
  onSubmit: (guess: string) => void;
}

export function AnswerBar({
  secondsLeft,
  totalSeconds = 25,
  disabled,
  faultMessage,
  faultCount,
  onSubmit,
}: AnswerBarProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus when input becomes enabled
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled, faultCount]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" &&
      !e.nativeEvent.isComposing &&
      e.keyCode !== 229
    ) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const pctRemaining = Math.max(
    0,
    Math.min(100, (secondsLeft / totalSeconds) * 100)
  );
  const isWarning = secondsLeft <= 5;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 sm:px-6 pb-3 pt-2 bg-gradient-to-t from-[#0B1220] via-[#0B1220]/95 to-transparent">
      <div className="mx-auto max-w-[600px] flex flex-col gap-2">
        {/* Inline FAULT message above input */}
        {faultMessage && (
          <motion.div
            key={faultCount}
            initial={{ x: -8, opacity: 1 }}
            animate={{ x: [0, -6, 6, -4, 4, 0], opacity: 1 }}
            transition={{ duration: 0.25 }}
            role="alert"
            aria-live="polite"
            className="pixel-box-clay bg-[#14213D] px-3 py-1.5 text-center font-vt text-base sm:text-lg text-[var(--clay)] tracking-wide shadow-[0_4px_0_#050911]"
          >
            {faultMessage}
          </motion.div>
        )}

        {/* Main Input Bar */}
        <motion.form
          key={`form-${faultCount}`}
          animate={faultCount > 0 ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
          transition={{ duration: 0.28 }}
          onSubmit={handleSubmit}
          className="pixel-box p-2 sm:p-2.5 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2.5">
            <CountdownRing
              secondsLeft={secondsLeft}
              totalSeconds={totalSeconds}
            />

            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="type one answer…"
              aria-label="Type one tennis answer"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 min-w-0 h-11 px-3 bg-[#0B1220] border-2 border-[#2C3E66] focus:border-[var(--ball)] text-[var(--chalk)] font-vt text-xl sm:text-2xl placeholder:text-[var(--net)]/45 outline-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={disabled || !value.trim()}
              className="arcade-btn h-11 px-4 sm:px-6 bg-[var(--ball)] text-[#0B1220] font-display text-xs sm:text-sm border-2 border-[var(--chalk)] disabled:opacity-45 cursor-pointer shrink-0"
            >
              HIT
            </button>
          </div>

          {/* Thin progress bar under input that drains over 25s */}
          <div className="w-full h-1.5 bg-[#0B1220] border border-[#26385E] overflow-hidden">
            <div
              className="h-full transition-all duration-100 ease-linear"
              style={{
                width: `${pctRemaining}%`,
                backgroundColor: isWarning ? "var(--clay)" : "var(--ball)",
              }}
            />
          </div>
        </motion.form>
      </div>
    </div>
  );
}

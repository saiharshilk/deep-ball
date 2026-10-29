"use client";

import React from "react";
import { motion } from "framer-motion";
import { TierKey } from "@/lib/types";
import { TIERS } from "@/lib/tiers";

interface AnswerBannerProps {
  canonical: string;
  tier: TierKey;
}

/**
 * Tilted banner (rotated -8 deg, navy with tier-colored glow border)
 * showing the canonical answer in caps: "RAFAEL NADAL" ▼
 */
export function AnswerBanner({ canonical, tier }: AnswerBannerProps) {
  const tierMeta = TIERS[tier];

  return (
    <motion.div
      initial={{ scale: 0.6, rotate: 0, opacity: 0 }}
      animate={{ scale: 1, rotate: -8, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className="inline-block px-4 py-2 sm:px-6 sm:py-2.5 bg-[var(--navy)] border-2 z-30"
      style={{
        borderColor: tierMeta.color,
        boxShadow: `0 0 18px ${tierMeta.color}66, 0 4px 0 #050911`,
      }}
    >
      <span className="font-display text-xs sm:text-base text-[var(--chalk)] uppercase tracking-wider inline-flex items-center gap-2">
        <span>{`"${canonical.toUpperCase()}"`}</span>
        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          shapeRendering="crispEdges"
          style={{ color: tierMeta.color }}
          aria-hidden="true"
        >
          <rect x="0" y="0" width="10" height="2" fill="currentColor" />
          <rect x="2" y="2" width="6" height="2" fill="currentColor" />
          <rect x="4" y="4" width="2" height="2" fill="currentColor" />
        </svg>
      </span>
    </motion.div>
  );
}

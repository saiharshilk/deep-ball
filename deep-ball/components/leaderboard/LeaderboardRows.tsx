"use client";

import React from "react";
import { formatPlayerName } from "@/lib/api";
import { LeaderboardEntry } from "@/lib/types";
import { TIERS } from "@/lib/tiers";

interface LeaderboardRowsProps {
  entries: (LeaderboardEntry & { matches?: number; streak?: number })[];
  unit?: string;
  showDetail?: boolean;
}

const MEDALS = ["var(--ball)", "#C9D3E3", "#D98B4A"];

export function LeaderboardRows({ entries, unit = "ft", showDetail = true }: LeaderboardRowsProps) {
  return (
    <ol className="divide-y divide-[#233457]">
      {entries.map((e) => (
        <li
          key={`${e.rank}-${e.isMe}`}
          className={`py-2 px-2 flex items-center justify-between gap-2 ${e.isMe ? "bg-[var(--ball)]/10 border-l-2 border-[var(--ball)]" : ""}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="font-display text-[10px] w-8 shrink-0 text-right"
              style={{ color: MEDALS[e.rank - 1] ?? "var(--net)" }}
            >
              {`#${e.rank}`}
            </span>
            <div className="min-w-0">
              <div className={`font-vt text-lg leading-tight truncate ${e.name ? "text-[var(--chalk)]" : "text-[var(--net)]"}`}>
                {formatPlayerName(e.name)}
                {e.isMe && <span className="ml-2 font-display text-[8px] text-[var(--ball)]">YOU</span>}
              </div>
              {showDetail && e.tiers.length > 0 && (
                <div className="flex gap-px mt-0.5" aria-hidden="true">
                  {e.tiers.map((t, i) => (
                    <span key={i} className="w-2 h-2" style={{ backgroundColor: TIERS[t]?.color }} />
                  ))}
                </div>
              )}
              {showDetail && e.matches !== undefined && (
                <div className="font-vt text-sm text-[var(--net)] leading-tight">
                  {`${e.matches} match${e.matches === 1 ? "" : "es"}${e.streak ? ` · ${e.streak}-day streak` : ""}`}
                </div>
              )}
            </div>
          </div>
          <span className="font-display text-[10px] sm:text-xs text-[#3FD0C9] whitespace-nowrap">
            {`${e.distance.toLocaleString("en-US")} ${unit}`}
          </span>
        </li>
      ))}
    </ol>
  );
}

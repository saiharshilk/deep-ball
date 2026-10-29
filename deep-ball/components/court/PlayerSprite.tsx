"use client";

import React, { useEffect, useState } from "react";

export type PlayerAnimState = "idle" | "swing" | "sad";

interface PlayerSpriteProps {
  state: PlayerAnimState;
  showBouncingBall?: boolean;
}

/**
 * Tiny 8-bit pixel tennis player at the near baseline (0 ft)
 * - 2-frame idle (with optional gently bouncing ball in hand)
 * - 4-frame swing sequence when launching a shot
 */
export function PlayerSprite({
  state,
  showBouncingBall = false,
}: PlayerSpriteProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (state === "idle") {
      const id = setInterval(() => {
        setFrame((f) => (f + 1) % 2);
      }, 480);
      return () => clearInterval(id);
    }

    if (state === "swing") {
      setFrame(0);
      const t1 = setTimeout(() => setFrame(1), 70);
      const t2 = setTimeout(() => setFrame(2), 140);
      const t3 = setTimeout(() => setFrame(3), 240);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    setFrame(0);
  }, [state]);

  const bobY = state === "idle" && frame === 1 ? 2 : 0;

  return (
    <div
      className="relative flex flex-col items-center select-none"
      style={{ width: 64, height: 64 }}
      aria-label="Tennis player at baseline"
    >
      {/* Ground shadow under player */}
      <div
        className="absolute bottom-1 w-10 h-3 bg-black/55"
        style={{ clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)" }}
      />

      {/* Bouncing ball in hand during idle on landing/countdown */}
      {showBouncingBall && state === "idle" && (
        <div
          className="absolute left-1.5 bottom-4 w-2.5 h-2.5 bg-[var(--ball)] border border-[#0B1220]"
          style={{
            transform: `translateY(${frame === 0 ? "-8px" : "0px"})`,
            boxShadow: "0 0 6px rgba(215, 245, 66, 0.8)",
          }}
        />
      )}

      {/* Pixel SVG Player Sprite (16x16 grid scaled to 48x48) */}
      <svg
        viewBox="0 0 16 16"
        width="48"
        height="48"
        shapeRendering="crispEdges"
        style={{ transform: `translateY(${bobY}px)` }}
        className="overflow-visible"
      >
        {/* Headband (white + clay stripe) */}
        <rect x="6" y="2" width="4" height="1" fill="#F4F1E6" />
        <rect x="6" y="3" width="4" height="1" fill="#D9733B" />
        {/* Hair */}
        <rect x="6" y="1" width="4" height="1" fill="#4A2C18" />
        {/* Head / skin */}
        <rect x="6" y="4" width="4" height="2" fill="#F2C29B" />

        {/* Polo Shirt (Chalk white with heritage purple trim) */}
        <rect x="5" y="6" width="6" height="4" fill="#F4F1E6" />
        <rect x="6" y="6" width="4" height="1" fill="#4B2E83" />

        {/* Left Arm */}
        <rect
          x="4"
          y={state === "swing" && frame === 1 ? "5" : "7"}
          width="1"
          height="2"
          fill="#F2C29B"
        />

        {/* Right Arm + Racket (4-frame swing or 2-frame idle) */}
        {state === "idle" && (
          <g>
            <rect x="11" y="7" width="1" height="2" fill="#F2C29B" />
            {/* Racket held to the right */}
            <rect x="12" y="6" width="1" height="2" fill="#D9733B" />
            <rect x="13" y="4" width="2" height="3" fill="#C9CED6" />
            <rect x="13" y="4" width="2" height="1" fill="#D9733B" />
          </g>
        )}

        {state === "swing" && frame === 0 && (
          /* Frame 0: Wind-up backswing */
          <g>
            <rect x="11" y="8" width="2" height="1" fill="#F2C29B" />
            <rect x="13" y="8" width="2" height="2" fill="#D9733B" />
            <rect x="14" y="9" width="2" height="3" fill="#C9CED6" />
          </g>
        )}

        {state === "swing" && frame === 1 && (
          /* Frame 1: Contact point with flash */
          <g>
            <rect x="11" y="5" width="2" height="1" fill="#F2C29B" />
            <rect x="12" y="3" width="3" height="3" fill="#D7F542" />
            <rect x="13" y="2" width="2" height="2" fill="#F4F1E6" />
          </g>
        )}

        {state === "swing" && (frame === 2 || frame === 3) && (
          /* Frame 2 & 3: High follow-through across left shoulder */
          <g>
            <rect x="4" y="5" width="1" height="2" fill="#F2C29B" />
            <rect x="3" y="3" width="1" height="2" fill="#D9733B" />
            <rect x="2" y="1" width="2" height="3" fill="#C9CED6" />
          </g>
        )}

        {state === "sad" && (
          /* Timeout slumped racket */
          <g>
            <rect x="11" y="8" width="1" height="2" fill="#F2C29B" />
            <rect x="12" y="10" width="2" height="2" fill="#D9733B" />
          </g>
        )}

        {/* Shorts (Navy) */}
        <rect x="5" y="10" width="6" height="2" fill="#14213D" />

        {/* Legs & Socks */}
        <rect
          x="6"
          y="12"
          width="1"
          height="2"
          fill="#F2C29B"
        />
        <rect
          x="9"
          y="12"
          width="1"
          height="2"
          fill="#F2C29B"
        />
        {/* Shoes */}
        <rect x="5" y="14" width="2" height="1" fill="#F4F1E6" />
        <rect x="9" y="14" width="2" height="1" fill="#F4F1E6" />
      </svg>
    </div>
  );
}

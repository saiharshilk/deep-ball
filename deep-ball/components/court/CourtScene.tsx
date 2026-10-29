"use client";

import React from "react";
import {
  ftToBottomPx,
  Landmarks,
  PIXELS_PER_FOOT,
  WORLD_HEIGHT_PX,
} from "./Landmarks";
import { PlayerAnimState, PlayerSprite } from "./PlayerSprite";
import { Ball } from "./Ball";
import { CrowdRows } from "./CrowdRows";
import { DistanceRuler } from "./DistanceRuler";

interface CourtSceneProps {
  /** Which foot coordinate the camera should center/focus on */
  cameraFt: number;
  /** Duration of camera scroll in seconds */
  cameraDurationSec?: number;
  /** Player cumulative distance (shown on YOU ◂ marker) */
  cumulativeDistance: number;
  /** Current ball position in ft */
  ballFt: number;
  /** Target ball ft for arc computation */
  ballTargetFt: number;
  /** 0..1 progress of active shot flight */
  flightProgress: number;
  /** Whether ball is actively flying */
  isBallFlying: boolean;
  /** Whether ball has landed at destination */
  hasBallLanded: boolean;
  /** Whether the shot was a timeout dribble into the net */
  isTimeoutDribble?: boolean;
  /** Player animation state */
  playerState: PlayerAnimState;
  /** Show gently bouncing ball in player hand on landing/idle */
  showIdleBallInHand?: boolean;
  /** Trigger small screen shake on ball impact */
  screenShake?: boolean;
  /** Previous shot landing marks in ft */
  previousMarks?: { ft: number; color: string; label: string }[];
}

/**
 * The complete 1984 retro night-session tennis stadium vertical pixel world (0 ft to 740 ft):
 * 1. Near baseline (0 ft) + worn brown patch + player sprite
 * 2. Grass court (0..78 ft) with alternating mowing stripes, chalk singles/doubles lines, service boxes, center mark
 * 3. The net (39 ft) with pixel mesh, white tape, net posts, and umpire high chair
 * 4. Line judges & ball kids along the sides
 * 5. Far baseline (78 ft) + back wall (100 ft) with purple & green scrolling marquee "DEEP BALL · DEEP BALL ·"
 * 6. Stands (100 ft+) with pixel crowd heads & camera flashes
 * 7. Press box (280 ft), Dot-matrix scoreboard (360 ft), Floodlight towers (450 ft), Roof edge (540 ft), Night sky + stars, Blimp (620 ft), Moon / Orbit (700 ft)
 */
export function CourtScene({
  cameraFt,
  cameraDurationSec = 0.8,
  cumulativeDistance,
  ballFt,
  ballTargetFt,
  flightProgress,
  isBallFlying,
  hasBallLanded,
  isTimeoutDribble = false,
  playerState,
  showIdleBallInHand = false,
  screenShake = false,
  previousMarks = [],
}: CourtSceneProps) {
  // Position cameraFt comfortably in the lower-middle of the viewport
  // At 0 ft, baseline sits ~96px from bottom of viewport. Higher up, it sits ~320px from bottom.
  const cameraBottomPx = ftToBottomPx(cameraFt);
  const viewportFocusOffset = cameraFt <= 10 ? 96 : 320;
  const translateY = Math.max(0, cameraBottomPx - viewportFocusOffset);

  // Court geometry in pixels
  const courtBottomPx = ftToBottomPx(0);
  const courtTopPx = ftToBottomPx(78);
  const courtHeightPx = courtTopPx - courtBottomPx; // 78 * 8 = 624px
  const netBottomPx = ftToBottomPx(39);
  const nearServicePx = ftToBottomPx(21);
  const farServicePx = ftToBottomPx(57);
  const backWallPx = ftToBottomPx(100);

  // Mowing stripes (13 stripes of 6 ft each across 78 ft court)
  const mowingStripes = Array.from({ length: 13 }, (_, i) => i);

  return (
    <div
      className={`relative w-full h-dvh overflow-hidden bg-[var(--night)] select-none ${
        screenShake ? "animate-[bounce_0.15s_ease-in-out_2]" : ""
      }`}
    >
      {/* Outer Left & Right Vertical Marquee Side Rails (Desktop) */}
      <div
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-7 bg-[#080E1A] border-r border-[var(--purple)]/60 z-30 overflow-hidden flex-col items-center"
        aria-hidden="true"
      >
        <div className="animate-marquee-vertical flex flex-col items-center py-2 text-[11px] font-vt tracking-[0.25em] text-[var(--cream)]/60 [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">
          <span>
            {"DEEP BALL · 7 PROMPTS · DEEPBALL.GAME · RARER ANSWERS HIT DEEPER · "}
          </span>
          <span>
            {"DEEP BALL · 7 PROMPTS · DEEPBALL.GAME · RARER ANSWERS HIT DEEPER · "}
          </span>
        </div>
      </div>

      <div
        className="hidden md:flex fixed right-0 top-0 bottom-0 w-7 bg-[#080E1A] border-l border-[var(--purple)]/60 z-30 overflow-hidden flex-col items-center"
        aria-hidden="true"
      >
        <div className="animate-marquee-vertical flex flex-col items-center py-2 text-[11px] font-vt tracking-[0.25em] text-[var(--cream)]/60 [writing-mode:vertical-rl] whitespace-nowrap">
          <span>
            {"DEEP BALL · 7 PROMPTS · DEEPBALL.GAME · RARER ANSWERS HIT DEEPER · "}
          </span>
          <span>
            {"DEEP BALL · 7 PROMPTS · DEEPBALL.GAME · RARER ANSWERS HIT DEEPER · "}
          </span>
        </div>
      </div>

      {/* Side stands background texture on wide screens */}
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "radial-gradient(#EAD9A6 1px, transparent 1px), radial-gradient(#14213D 1px, #0B1220 1px)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 8px 8px",
        }}
      />

      {/* Center Stadium Column (~760px wide on desktop, full width on mobile) */}
      <div className="relative mx-auto w-full max-w-[760px] h-full border-x-2 border-[#1E2F53] bg-[var(--night)] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)]">
        {/* TALL SCROLLING WORLD CONTAINER */}
        <div
          className="absolute left-0 right-0 bottom-0 will-change-transform"
          style={{
            height: `${WORLD_HEIGHT_PX}px`,
            transform: `translate3d(0, ${translateY}px, 0)`,
            transitionProperty: "transform",
            transitionDuration: `${cameraDurationSec}s`,
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* ============================================================
              ZONE 4: NIGHT SKY, PIXEL STARS, BLIMP (620 ft) & MOON (700 ft)
             ============================================================ */}
          <div
            className="absolute inset-x-0 top-0 bg-gradient-to-b from-[#04070F] via-[#080E1C] to-[#0B1220]"
            style={{
              bottom: `${ftToBottomPx(540)}px`,
            }}
          >
            {/* Pixel Stars */}
            {[
              { left: "12%", bottom: "18%", size: 3 },
              { left: "26%", bottom: "42%", size: 2 },
              { left: "44%", bottom: "25%", size: 4 },
              { left: "68%", bottom: "15%", size: 2 },
              { left: "82%", bottom: "38%", size: 3 },
              { left: "19%", bottom: "68%", size: 3 },
              { left: "35%", bottom: "78%", size: 2 },
              { left: "58%", bottom: "62%", size: 3 },
              { left: "75%", bottom: "84%", size: 2 },
              { left: "14%", bottom: "88%", size: 4 },
            ].map((star, idx) => (
              <div
                key={idx}
                className="absolute bg-[var(--chalk)] animate-pulse"
                style={{
                  left: star.left,
                  bottom: star.bottom,
                  width: star.size,
                  height: star.size,
                  animationDelay: `${idx * 0.3}s`,
                }}
              />
            ))}
          </div>

          {/* THE MOON / ORBIT (700 ft) */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
            style={{ bottom: `${ftToBottomPx(692)}px` }}
          >
            <svg
              viewBox="0 0 24 24"
              width="84"
              height="84"
              shapeRendering="crispEdges"
              style={{
                filter: "drop-shadow(0 0 24px rgba(234, 217, 166, 0.55))",
              }}
            >
              <rect x="6" y="2" width="12" height="2" fill="#EAD9A6" />
              <rect x="4" y="4" width="16" height="2" fill="#EAD9A6" />
              <rect x="2" y="6" width="20" height="12" fill="#EAD9A6" />
              <rect x="4" y="18" width="16" height="2" fill="#EAD9A6" />
              <rect x="6" y="20" width="12" height="2" fill="#EAD9A6" />
              {/* Pixel craters */}
              <rect x="7" y="7" width="3" height="3" fill="#C9B37B" />
              <rect x="14" y="11" width="4" height="3" fill="#C9B37B" />
              <rect x="8" y="15" width="2" height="2" fill="#C9B37B" />
            </svg>
          </div>

          {/* THE BLIMP (620 ft) */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
            style={{ bottom: `${ftToBottomPx(615)}px` }}
          >
            <div className="relative flex flex-col items-center">
              <div className="w-44 h-12 bg-[#14213D] border-2 border-[var(--chalk)] flex items-center justify-center relative shadow-[0_4px_0_#000]">
                <div className="absolute -left-3 top-2 w-3 h-8 bg-[var(--purple)] border-l-2 border-y-2 border-[var(--chalk)]" />
                <div className="absolute -right-3 top-1 w-3 h-10 bg-[var(--clay)] border-r-2 border-y-2 border-[var(--chalk)]" />
                <span className="font-display text-[9px] text-[var(--ball)] tracking-widest animate-pulse">
                  DEEPBALL.GAME
                </span>
              </div>
              <div className="w-10 h-3 bg-[#C9CED6] border-x-2 border-b-2 border-[#0B1220]" />
            </div>
          </div>

          {/* STADIUM ROOF EDGE (540 ft) */}
          <div
            className="absolute inset-x-0 z-10 flex flex-col"
            style={{ bottom: `${ftToBottomPx(536)}px` }}
          >
            <div className="h-5 bg-[#1B2A4A] border-t-4 border-[var(--net)] flex items-center justify-between px-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-4 h-3 bg-[#0B1220] border border-[#3A4D7A]" />
              ))}
            </div>
            <div className="h-4 bg-[#4B2E83] border-b-2 border-[#0B1220] flex items-center justify-center">
              <span className="font-vt text-xs tracking-[0.35em] text-[var(--cream)]">
                CENTRE COURT ROOF TRUSS · 540 FT
              </span>
            </div>
          </div>

          {/* FLOODLIGHT TOWERS (450 ft) with lens glow */}
          <div
            className="absolute inset-x-4 z-10 flex items-center justify-between"
            style={{ bottom: `${ftToBottomPx(442)}px` }}
          >
            {[0, 1].map((side) => (
              <div key={side} className="relative flex flex-col items-center">
                {/* Radial glow behind floodlight bank */}
                <div
                  className="pointer-events-none absolute -inset-10 rounded-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(244,241,230,0.45) 0%, rgba(215,245,66,0.12) 45%, transparent 72%)",
                  }}
                />
                <div className="grid grid-cols-4 gap-1 p-1.5 bg-[#1E2B48] border-2 border-[var(--net)] shadow-[0_4px_0_#000]">
                  {Array.from({ length: 8 }).map((_, bulb) => (
                    <div
                      key={bulb}
                      className="w-3 h-3 bg-[var(--cream)]"
                      style={{
                        boxShadow: "0 0 8px #F4F1E6",
                      }}
                    />
                  ))}
                </div>
                <div className="w-4 h-8 bg-[#2A395C] border-x-2 border-[#0B1220]" />
              </div>
            ))}
          </div>

          {/* DOT-MATRIX SCOREBOARD (360 ft) */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-10 w-[82%] max-w-[500px]"
            style={{ bottom: `${ftToBottomPx(354)}px` }}
          >
            <div className="bg-[#090F1C] border-4 border-[#2C3E66] p-2.5 shadow-[0_6px_0_#000]">
              <div className="flex items-center justify-between border-b border-[#2C3E66] pb-1 mb-1.5 font-vt text-xs text-[var(--cream)]">
                <span>CENTRE COURT · NIGHT SESSION</span>
                <span className="text-[var(--ball)]">LIVE MATRIX</span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-display text-[10px] text-[var(--cream)]">
                <div className="bg-[#14213D] p-1.5 border border-[#2C3E66]">
                  <div className="text-[8px] text-[var(--net)]">PLAYER</div>
                  <div className="text-[var(--ball)] mt-0.5">YOU</div>
                </div>
                <div className="bg-[#14213D] p-1.5 border border-[#2C3E66]">
                  <div className="text-[8px] text-[var(--net)]">TOTAL FT</div>
                  <div className="text-[#3FD0C9] mt-0.5">{cumulativeDistance}</div>
                </div>
                <div className="bg-[#14213D] p-1.5 border border-[#2C3E66]">
                  <div className="text-[8px] text-[var(--net)]">SURFACE</div>
                  <div className="text-[var(--cream)] mt-0.5">GRASS</div>
                </div>
              </div>
            </div>
          </div>

          {/* THE PRESS BOX (280 ft) */}
          <div
            className="absolute inset-x-8 z-10"
            style={{ bottom: `${ftToBottomPx(276)}px` }}
          >
            <div className="bg-[#14213D] border-2 border-[var(--purple)] p-2 shadow-[0_4px_0_#000]">
              <div className="text-center font-vt text-xs tracking-[0.25em] text-[var(--cream)] bg-[var(--purple)] py-0.5 mb-1.5">
                BROADCAST & PRESS BOX
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, wIdx) => (
                  <div
                    key={wIdx}
                    className="h-6 bg-[#0B1220] border border-[#3A4D7A] flex items-end justify-center p-0.5"
                  >
                    <div className="w-2.5 h-2.5 bg-[var(--cream)]/80" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================
              ZONE 3: CROWD STANDS (100 ft to 350 ft)
             ============================================================ */}
          <div
            className="absolute inset-x-0 bg-gradient-to-b from-[#0E172B] to-[#13203B] border-t-4 border-[var(--purple)]"
            style={{
              bottom: `${backWallPx}px`,
              height: `${ftToBottomPx(350) - backWallPx}px`,
            }}
          />

          <CrowdRows ballFt={ballFt} hasLanded={hasBallLanded} />

          {/* ============================================================
              ZONE 2: BACK WALL (100 ft) WITH SCROLLING MARQUEE BANNER
             ============================================================ */}
          <div
            className="absolute inset-x-0 z-10 overflow-hidden bg-[#1D5424] border-y-4 border-[var(--purple)]"
            style={{
              bottom: `${backWallPx - 14}px`,
              height: "28px",
            }}
          >
            <div className="animate-marquee-horizontal flex items-center h-full whitespace-nowrap font-display text-[10px] tracking-widest text-[var(--cream)]">
              <span className="mx-4">
                {"DEEP BALL · DEEP BALL · RARER ANSWERS HIT DEEPER · DEEP BALL · DEEP BALL · RARER ANSWERS HIT DEEPER · "}
              </span>
              <span className="mx-4">
                {"DEEP BALL · DEEP BALL · RARER ANSWERS HIT DEEPER · DEEP BALL · DEEP BALL · RARER ANSWERS HIT DEEPER · "}
              </span>
            </div>
          </div>

          {/* ============================================================
              ZONE 1: SURROUND APRON & GRASS COURT (0 ft to 100 ft)
             ============================================================ */}
          {/* Dark green stadium apron from bottom of world up to back wall (100 ft) */}
          <div
            className="absolute inset-x-0 bottom-0 bg-[#235F27]"
            style={{ height: `${backWallPx - 14}px` }}
          >
            {/* Radial floodlight pools on the grass */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 35%, rgba(215, 245, 66, 0.14) 0%, transparent 55%), radial-gradient(circle at 50% 78%, rgba(244, 241, 230, 0.12) 0%, transparent 50%)",
              }}
            />

            {/* Worn brown baseline dirt patch behind far baseline (78 ft) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-36 h-4 bg-[#6E5536]/75"
              style={{
                bottom: `${courtTopPx + 2}px`,
                clipPath: "polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)",
              }}
            />

            {/* Worn brown baseline dirt patch behind near baseline (0 ft) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-44 h-6 bg-[#6E5536]/80"
              style={{
                bottom: `${courtBottomPx - 16}px`,
                clipPath: "polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)",
              }}
            />

            {/* THE GRASS COURT (0 ft to 78 ft) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[74%] max-w-[440px] border-2 border-[var(--chalk)] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.35)]"
              style={{
                bottom: `${courtBottomPx}px`,
                height: `${courtHeightPx}px`,
              }}
            >
              {/* Alternating light & dark mowing stripes */}
              <div className="w-full h-full flex flex-col">
                {mowingStripes.map((stripeIdx) => (
                  <div
                    key={stripeIdx}
                    className="flex-1 w-full"
                    style={{
                      backgroundColor:
                        stripeIdx % 2 === 0 ? "var(--grass-1)" : "var(--grass-2)",
                    }}
                  />
                ))}
              </div>

              {/* Singles sidelines (inset 12.5% from each doubles sideline) */}
              <div className="absolute top-0 bottom-0 left-[12.5%] w-[2px] bg-[var(--chalk)]" />
              <div className="absolute top-0 bottom-0 right-[12.5%] w-[2px] bg-[var(--chalk)]" />

              {/* Far service line (57 ft = 21 ft from net) */}
              <div
                className="absolute left-[12.5%] right-[12.5%] h-[2px] bg-[var(--chalk)]"
                style={{
                  bottom: `${farServicePx - courtBottomPx}px`,
                }}
              />

              {/* Near service line (21 ft) */}
              <div
                className="absolute left-[12.5%] right-[12.5%] h-[2px] bg-[var(--chalk)]"
                style={{
                  bottom: `${nearServicePx - courtBottomPx}px`,
                }}
              />

              {/* Center service line (between 21 ft and 57 ft) */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-[2px] bg-[var(--chalk)]"
                style={{
                  bottom: `${nearServicePx - courtBottomPx}px`,
                  height: `${farServicePx - nearServicePx}px`,
                }}
              />

              {/* Near & Far Baseline Center Marks */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-2.5 bg-[var(--chalk)]" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-2.5 bg-[var(--chalk)]" />
            </div>

            {/* THE NET (39 ft): pixel mesh, white tape, net posts, and umpire high chair */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[82%] max-w-[490px] z-20 flex items-center"
              style={{ bottom: `${netBottomPx - 4}px` }}
            >
              {/* Left Net Post */}
              <div className="w-2.5 h-5 bg-[#4B2E83] border border-[var(--chalk)]" />

              {/* Net Mesh & White Tape */}
              <div className="flex-1 flex flex-col">
                {/* White top tape */}
                <div className="h-1.5 bg-[var(--chalk)] border-y border-[#0B1220]" />
                {/* Pixel mesh */}
                <div
                  className="h-2.5 w-full opacity-90"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, var(--net) 1px, transparent 1px), linear-gradient(var(--net) 1px, rgba(11,18,32,0.5) 1px)",
                    backgroundSize: "4px 4px",
                  }}
                />
                {/* Net ground shadow */}
                <div className="h-1 bg-black/45 w-full" />
              </div>

              {/* Right Net Post */}
              <div className="w-2.5 h-5 bg-[#4B2E83] border border-[var(--chalk)]" />

              {/* Umpire's High Chair on Left of Net */}
              <div className="absolute -left-6 -bottom-2 flex flex-col items-center">
                <div className="w-3.5 h-3.5 bg-[var(--cream)] border border-[#0B1220]" />
                <div className="w-4 h-6 bg-[#D9733B] border border-[#0B1220]" />
              </div>
            </div>

            {/* Line Judges & Ball Kids Sprites */}
            {[
              { ft: 4, side: "left", role: "judge" },
              { ft: 4, side: "right", role: "judge" },
              { ft: 38, side: "right", role: "ballkid" },
              { ft: 76, side: "left", role: "judge" },
              { ft: 76, side: "right", role: "judge" },
            ].map((npc, idx) => (
              <div
                key={idx}
                className={`absolute z-10 flex flex-col items-center ${
                  npc.side === "left" ? "left-4 sm:left-8" : "right-14 sm:right-16"
                }`}
                style={{ bottom: `${ftToBottomPx(npc.ft)}px` }}
              >
                <div className="w-2.5 h-2.5 bg-[var(--cream)] border border-[#0B1220]" />
                <div
                  className={`w-3.5 h-3 border border-[#0B1220] ${
                    npc.role === "judge" ? "bg-[#4B2E83]" : "bg-[#14213D]"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* ============================================================
              PREVIOUS SHOT MARKS ON THE COURT / STANDS
             ============================================================ */}
          {previousMarks.map((mark, i) => (
            <div
              key={i}
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-15 flex items-center gap-1 opacity-75"
              style={{
                bottom: `${ftToBottomPx(mark.ft)}px`,
                marginLeft: `${((i % 3) - 1) * 28}px`,
              }}
            >
              <div
                className="w-2.5 h-2.5 border border-[#0B1220]"
                style={{ backgroundColor: mark.color }}
              />
              <span className="font-vt text-[11px] bg-[var(--night)]/85 px-1 text-[var(--chalk)] border border-[var(--chalk)]/20">
                {mark.label}
              </span>
            </div>
          ))}

          {/* ============================================================
              PLAYER SPRITE AT NEAR BASELINE (0 ft)
             ============================================================ */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-25"
            style={{ bottom: `${courtBottomPx - 26}px` }}
          >
            <PlayerSprite
              state={playerState}
              showBouncingBall={showIdleBallInHand}
            />
          </div>

          {/* ============================================================
              OPTIC-YELLOW PIXEL BALL
             ============================================================ */}
          {(isBallFlying || hasBallLanded) && (
            <Ball
              currentFt={ballFt}
              targetFt={ballTargetFt}
              flightProgress={flightProgress}
              isFlying={isBallFlying}
              hasLanded={hasBallLanded}
              isTimeoutDribble={isTimeoutDribble}
            />
          )}

          {/* ============================================================
              LANDMARK CALLOUTS & RIGHT-HAND DISTANCE RULER
             ============================================================ */}
          <Landmarks currentDistance={cumulativeDistance} />
          <DistanceRuler currentDistance={cumulativeDistance} />
        </div>
      </div>

      {/* Subtle CRT scanline & vignette overlay */}
      <div className="crt-overlay fixed inset-0 z-40" aria-hidden="true" />
    </div>
  );
}

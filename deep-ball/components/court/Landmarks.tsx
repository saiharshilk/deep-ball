import React from "react";

export const PIXELS_PER_FOOT = 8;
export const WORLD_MAX_FT = 740;
export const BASELINE_BOTTOM_PX = 96;
export const WORLD_HEIGHT_PX = BASELINE_BOTTOM_PX + WORLD_MAX_FT * PIXELS_PER_FOOT;

export function ftToBottomPx(ft: number): number {
  return Math.round(BASELINE_BOTTOM_PX + ft * PIXELS_PER_FOOT);
}

export const LANDMARKS = [
  { ft: 0, label: "the baseline" },
  { ft: 21, label: "the service line" },
  { ft: 39, label: "the net" },
  { ft: 78, label: "the far baseline" },
  { ft: 100, label: "the back wall" },
  { ft: 130, label: "the front row" },
  { ft: 200, label: "the cheap seats" },
  { ft: 280, label: "the press box" },
  { ft: 360, label: "the scoreboard" },
  { ft: 450, label: "the floodlights" },
  { ft: 540, label: "over the roof" },
  { ft: 620, label: "the blimp" },
  { ft: 700, label: "orbit" },
];

export function getLandmarkReachedLabel(distanceFt: number): string {
  let reached = LANDMARKS[0];
  for (const lm of LANDMARKS) {
    if (distanceFt >= lm.ft) {
      reached = lm;
    } else {
      break;
    }
  }

  switch (reached.ft) {
    case 0:
      return "AT THE BASELINE";
    case 21:
      return "PAST THE SERVICE LINE";
    case 39:
      return "OVER THE NET";
    case 78:
      return "DEEP PAST THE FAR BASELINE";
    case 100:
      return "OVER THE BACK WALL";
    case 130:
      return "INTO THE FRONT ROW";
    case 200:
      return "UP IN THE CHEAP SEATS";
    case 280:
      return "INTO THE PRESS BOX";
    case 360:
      return "RATTLING THE SCOREBOARD";
    case 450:
      return "UP IN THE FLOODLIGHTS";
    case 540:
      return "CLEAR OVER THE ROOF";
    case 620:
      return "GRAZING THE BLIMP";
    case 700:
    default:
      return "INTO LOW EARTH ORBIT";
  }
}

interface LandmarksProps {
  currentDistance: number;
}

export function Landmarks({ currentDistance }: LandmarksProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      aria-hidden="true"
    >
      {LANDMARKS.map((lm, index) => {
        const bottomPx = ftToBottomPx(lm.ft);
        const isLeft = index % 2 === 0;
        const isPassed = currentDistance >= lm.ft && currentDistance > 0;

        return (
          <div
            key={lm.ft}
            style={{ bottom: `${bottomPx}px` }}
            className={`absolute flex items-center gap-1.5 text-xs sm:text-sm tracking-wider transition-colors duration-300 ${
              isLeft ? "left-2 sm:left-4" : "right-10 sm:right-14"
            } ${
              isPassed
                ? "text-[var(--ball)] drop-shadow-[0_1px_0_#000]"
                : "text-[var(--chalk)]/75 drop-shadow-[0_1px_0_#000]"
            }`}
          >
            {isLeft ? (
              <span className="font-vt bg-[var(--night)]/80 px-1.5 py-0.5 border border-[var(--chalk)]/20">
                {`— ${lm.label}`}
              </span>
            ) : (
              <span className="font-vt bg-[var(--night)]/80 px-1.5 py-0.5 border border-[var(--chalk)]/20">
                {`${lm.label} —`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

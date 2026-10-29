import { TierKey } from "./types";

export interface TierMeta {
  key: TierKey;
  label: string;
  points: number;
  color: string;
  flavor: string;
  emoji: string;
  shimmer?: boolean;
}

export const TIERS: Record<TierKey, TierMeta> = {
  MOONBALL: {
    key: "MOONBALL",
    label: "MOONBALL",
    points: 10,
    color: "#C9CED6",
    flavor: "Everyone's first thought. Still in.",
    emoji: "⬜",
  },
  CROSSCOURT: {
    key: "CROSSCOURT",
    label: "CROSSCOURT",
    points: 20,
    color: "#D7F542",
    flavor: "Solid, safe, and in play.",
    emoji: "🟨",
  },
  DOWN_THE_LINE: {
    key: "DOWN_THE_LINE",
    label: "DOWN THE LINE",
    points: 30,
    color: "#3FD0C9",
    flavor: "Good pull. Most fans would know it.",
    emoji: "🟩",
  },
  PASSING_SHOT: {
    key: "PASSING_SHOT",
    label: "PASSING SHOT",
    points: 50,
    color: "#4C8DF6",
    flavor: "Ripped past the field.",
    emoji: "🟦",
  },
  ACE: {
    key: "ACE",
    label: "ACE",
    points: 80,
    color: "#B26BFF",
    flavor: "Untouchable. Barely anyone said this.",
    emoji: "🟪",
  },
  GRAND_SLAM: {
    key: "GRAND_SLAM",
    label: "GRAND SLAM",
    points: 100,
    color: "#FF6B3D",
    flavor: "Nobody else found this one.",
    emoji: "🟥",
    shimmer: true,
  },
  TIME_VIOLATION: {
    key: "TIME_VIOLATION",
    label: "TIME VIOLATION",
    points: 0,
    color: "#3A4560",
    flavor: "The shot clock beat you.",
    emoji: "⬛",
  },
};

export const SCORING_LADDER_TIERS: TierKey[] = [
  "GRAND_SLAM",
  "ACE",
  "PASSING_SHOT",
  "DOWN_THE_LINE",
  "CROSSCOURT",
  "MOONBALL",
];

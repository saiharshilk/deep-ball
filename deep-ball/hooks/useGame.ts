"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DailyMatch,
  PromptPublic,
  PromptResultRecord,
  TierKey,
} from "@/lib/types";
import {
  getTodayMatch,
  reportTimeout,
  startPrompt,
  submitAnswer,
} from "@/lib/api";
import {
  getSettings,
} from "@/lib/stats";
import {
  playCountdownTick,
  playFaultBuzz,
  playHitPock,
  playLandingAndTierSound,
  playTimeoutThud,
} from "@/lib/sound";
import { PlayerAnimState } from "@/components/court/PlayerSprite";

export type GamePhase =
  | "loading"
  | "idle"
  | "countdown"
  | "answering"
  | "revealing"
  | "finished";

export interface RevealData {
  canonical: string;
  tier: TierKey;
  points: number;
  pctOfPlayers?: number;
  isTimeout: boolean;
}

export function useGame(autoStart = false) {
  const [match, setMatch] = useState<DailyMatch | null>(null);
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [promptIndex, setPromptIndex] = useState(0); // 0..6
  const [countdownNum, setCountdownNum] = useState(3); // 3, 2, 1
  const [secondsLeft, setSecondsLeft] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faultMessage, setFaultMessage] = useState<string | null>(null);
  const [faultCount, setFaultCount] = useState(0);

  const [results, setResults] = useState<PromptResultRecord[]>([]);
  const [cumulativeDistance, setCumulativeDistance] = useState(0);
  const [revealData, setRevealData] = useState<RevealData | null>(null);
  const [isShotLanded, setIsShotLanded] = useState(false);

  // Court & ball animation states
  const [cameraFt, setCameraFt] = useState(0);
  const [cameraDurationSec, setCameraDurationSec] = useState(0.8);
  const [ballFt, setBallFt] = useState(0);
  const [ballTargetFt, setBallTargetFt] = useState(0);
  const [flightProgress, setFlightProgress] = useState(0);
  const [isBallFlying, setIsBallFlying] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerAnimState>("idle");
  const [screenShake, setScreenShake] = useState(false);

  const rafRef = useRef<number | null>(null);
  const timeoutTriggeredRef = useRef(false);

  const currentPrompt: PromptPublic | null =
    match && match.prompts[promptIndex] ? match.prompts[promptIndex] : null;

  // Load match on mount
  useEffect(() => {
    let active = true;
    getTodayMatch().then((m) => {
      if (!active) return;
      setMatch(m);
      if (autoStart) {
        beginCountdown(0);
      } else {
        setPhase("idle");
      }
    });
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoStart]);

  const beginCountdown = useCallback((nextIdx: number) => {
    setPromptIndex(nextIdx);
    setFaultMessage(null);
    setRevealData(null);
    setIsShotLanded(false);
    setIsBallFlying(false);
    setPlayerState("idle");
    setCameraDurationSec(0.75);
    setCameraFt(0);
    setBallFt(0);
    setCountdownNum(3);
    setSecondsLeft(25);
    timeoutTriggeredRef.current = false;
    setPhase("countdown");
  }, []);

  const startMatch = useCallback(() => {
    setResults([]);
    setCumulativeDistance(0);
    beginCountdown(0);
  }, [beginCountdown]);

  // Pre-prompt 3..2..1 countdown effect
  useEffect(() => {
    if (phase !== "countdown") return;

    playCountdownTick(false);
    const t1 = setTimeout(() => {
      setCountdownNum(2);
      playCountdownTick(false);
    }, 650);
    const t2 = setTimeout(() => {
      setCountdownNum(1);
      playCountdownTick(false);
    }, 1300);
    const t3 = setTimeout(() => {
      playCountdownTick(true);
      setSecondsLeft(currentPrompt?.timeLimitSec ?? 25);
      setPhase("answering");
      if (match && currentPrompt) {
        startPrompt(match.matchId, currentPrompt.id).catch(() => {});
      }
    }, 1950);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase, currentPrompt, match]);

  // Animate shot flight from 0 ft to targetFt
  const animateShotFlight = useCallback(
    (
      targetFt: number,
      isTimeout: boolean,
      tier: TierKey,
      onComplete: () => void
    ) => {
      const settings = getSettings();
      const prefersReduced =
        settings.reducedMotion ||
        (typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches);

      const durationSec = prefersReduced
        ? 0.05
        : isTimeout
        ? 0.65
        : Number((1.6 + (targetFt / 100) * 0.4).toFixed(2));

      setBallTargetFt(targetFt);
      setIsBallFlying(true);
      setIsShotLanded(false);
      setFlightProgress(0);

      // Scroll camera to follow ball
      setCameraDurationSec(prefersReduced ? 0 : durationSec);
      setCameraFt(isTimeout ? 28 : targetFt);

      if (prefersReduced) {
        setBallFt(targetFt);
        setFlightProgress(1);
        setIsBallFlying(false);
        setIsShotLanded(true);
        if (!isTimeout) {
          playLandingAndTierSound(tier);
        }
        onComplete();
        return;
      }

      const startTime = performance.now();
      const durationMs = durationSec * 1000;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const rawProgress = Math.min(1, elapsed / durationMs);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - rawProgress, 3);

        setFlightProgress(rawProgress);
        setBallFt(targetFt * eased);

        if (rawProgress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setBallFt(targetFt);
          setIsBallFlying(false);
          setIsShotLanded(true);
          if (!isTimeout) {
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 320);
            playLandingAndTierSound(tier);
          }
          onComplete();
        }
      };

      rafRef.current = requestAnimationFrame(step);
    },
    []
  );

  // Handle timeout when 25s clock expires
  const handleTimeout = useCallback(async () => {
    if (!match || !currentPrompt || timeoutTriggeredRef.current) return;
    timeoutTriggeredRef.current = true;
    setIsSubmitting(true);
    setFaultMessage(null);

    // A failed report shouldn't freeze the match; the server just misses this timeout.
    await reportTimeout(match.matchId, currentPrompt.id).catch(() => {});
    playTimeoutThud();
    setPlayerState("sad");

    const record: PromptResultRecord = {
      promptId: currentPrompt.id,
      promptIndex: currentPrompt.index,
      promptText: currentPrompt.text,
      canonical: "—",
      tier: "TIME_VIOLATION",
      points: 0,
    };

    const nextResults = [...results, record];
    setResults(nextResults);
    setRevealData({
      canonical: "—",
      tier: "TIME_VIOLATION",
      points: 0,
      isTimeout: true,
    });
    setIsSubmitting(false);
    setPhase("revealing");

    // Ball dribbles into the net (36 ft, right in front of 39 ft net)
    animateShotFlight(36, true, "TIME_VIOLATION", () => {});
  }, [match, currentPrompt, results, animateShotFlight]);

  // 25-second answering timer
  useEffect(() => {
    if (phase !== "answering") return;

    const interval = setInterval(() => {
      if (isSubmitting) return;
      setSecondsLeft((prev) => {
        const next = Math.max(0, Number((prev - 0.1).toFixed(1)));
        if (next <= 0 && !timeoutTriggeredRef.current) {
          handleTimeout();
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [phase, isSubmitting, handleTimeout]);

  // Submit player guess
  const submitGuess = useCallback(
    async (rawGuess: string) => {
      const trimmed = rawGuess.trim();
      if (!trimmed || !match || !currentPrompt || isSubmitting || phase !== "answering") {
        return;
      }

      setIsSubmitting(true);
      setFaultMessage(null);

      try {
        const res = await submitAnswer(match.matchId, currentPrompt.id, trimmed);

        if (res.status === "invalid" || res.status === "duplicate") {
          playFaultBuzz();
          setFaultMessage(res.message);
          setFaultCount((c) => c + 1);
          setIsSubmitting(false);
          return;
        }

        // Valid answer!
        playHitPock();
        setPlayerState("swing");

        const newTotalDistance = cumulativeDistance + res.points;
        const record: PromptResultRecord = {
          promptId: currentPrompt.id,
          promptIndex: currentPrompt.index,
          promptText: currentPrompt.text,
          canonical: res.canonical,
          tier: res.tier,
          points: res.points,
          pctOfPlayers: res.pctOfPlayers,
        };

        const nextResults = [...results, record];
        setResults(nextResults);
        setCumulativeDistance(newTotalDistance);
        setRevealData({
          canonical: res.canonical,
          tier: res.tier,
          points: res.points,
          pctOfPlayers: res.pctOfPlayers,
          isTimeout: false,
        });
        setIsSubmitting(false);
        setPhase("revealing");

        animateShotFlight(newTotalDistance, false, res.tier, () => {});
      } catch {
        setFaultMessage("LET — connection hiccup, hit it again");
        setIsSubmitting(false);
      }
    },
    [
      match,
      currentPrompt,
      isSubmitting,
      phase,
      cumulativeDistance,
      results,
      animateShotFlight,
    ]
  );

  // Move to next prompt or finish match after prompt 7
  const nextShot = useCallback(() => {
    if (!match) return;
    if (promptIndex + 1 >= match.prompts.length) {
      // The server records the finished match as the last answer lands; nothing to save here.
      setPhase("finished");
    } else {
      beginCountdown(promptIndex + 1);
    }
  }, [match, promptIndex, beginCountdown]);

  return {
    match,
    phase,
    promptIndex,
    currentPrompt,
    countdownNum,
    secondsLeft,
    isSubmitting,
    faultMessage,
    faultCount,
    results,
    cumulativeDistance,
    revealData,
    isShotLanded,
    cameraFt,
    cameraDurationSec,
    ballFt,
    ballTargetFt,
    flightProgress,
    isBallFlying,
    playerState,
    screenShake,
    startMatch,
    submitGuess,
    nextShot,
    forceTimeout: handleTimeout,
  };
}

"use client";

import React from "react";
import { useGame } from "@/hooks/useGame";
import { TIERS } from "@/lib/tiers";
import { CourtScene } from "@/components/court/CourtScene";
import { Hud } from "@/components/hud/Hud";
import { MenuSheet } from "@/components/chrome/MenuSheet";
import { SoundToggle } from "@/components/chrome/SoundToggle";
import { PromptCard } from "@/components/game/PromptCard";
import { AnswerBar } from "@/components/game/AnswerBar";
import { RevealStamp } from "@/components/game/RevealStamp";
import { Scorecard } from "@/components/results/Scorecard";

export default function PlayPage() {
  const {
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
  } = useGame(true);

  // Build previous shot marks on the court/stands
  let runningFt = 0;
  const previousMarks = results
    .map((r) => {
      if (r.points <= 0) return null;
      runningFt += r.points;
      return {
        ft: runningFt,
        color: TIERS[r.tier].color,
        label: `${r.canonical} (${runningFt}ft)`,
      };
    })
    .filter(Boolean) as { ft: number; color: string; label: string }[];

  const completedMatchRecord =
    match && phase === "finished"
      ? {
          matchId: match.matchId,
          matchNumber: match.matchNumber,
          dateLabel: match.dateLabel,
          date: match.matchId,
          distance: cumulativeDistance,
          grandSlams: results.filter((r) => r.tier === "GRAND_SLAM").length,
          tiers: results.map((r) => r.tier),
          results,
        }
      : null;

  return (
    <main className="relative w-full h-dvh overflow-hidden">
      {/* Top-left Hamburger Menu & Top-right Sound Toggle */}
      <div className="fixed top-2.5 left-2.5 sm:left-9 z-50">
        <MenuSheet />
      </div>
      <div className="fixed top-2.5 right-2.5 sm:right-9 z-50">
        <SoundToggle />
      </div>

      {/* Fixed Top HUD (shown during countdown, answering, and revealing) */}
      {phase !== "finished" && (
        <Hud
          distance={cumulativeDistance}
          score={cumulativeDistance}
          currentPromptIndex={promptIndex}
          totalPrompts={match?.prompts.length ?? 7}
          results={results}
        />
      )}

      {/* Tall Scrolling Pixel Court World */}
      <div className="fixed inset-0 z-0">
        <CourtScene
          cameraFt={cameraFt}
          cameraDurationSec={cameraDurationSec}
          cumulativeDistance={cumulativeDistance}
          ballFt={ballFt}
          ballTargetFt={ballTargetFt}
          flightProgress={flightProgress}
          isBallFlying={isBallFlying}
          hasBallLanded={isShotLanded}
          isTimeoutDribble={revealData?.isTimeout}
          playerState={playerState}
          showIdleBallInHand={phase === "countdown"}
          screenShake={screenShake}
          previousMarks={previousMarks}
        />
      </div>

      {/* Countdown & Answering UI */}
      {(phase === "countdown" || phase === "answering") && currentPrompt && (
        <>
          <div className="fixed inset-x-0 top-24 sm:top-28 z-30 pointer-events-none flex justify-center">
            <div className="w-full pointer-events-auto">
              <PromptCard
                prompt={currentPrompt}
                totalPrompts={match?.prompts.length ?? 7}
                isCountdown={phase === "countdown"}
                countdownNum={countdownNum}
              />
            </div>
          </div>

          <AnswerBar
            secondsLeft={secondsLeft}
            totalSeconds={currentPrompt.timeLimitSec}
            disabled={phase === "countdown" || isSubmitting}
            faultMessage={faultMessage}
            faultCount={faultCount}
            onSubmit={submitGuess}
          />
        </>
      )}

      {/* Shot Reveal Stamp & Tier Ladder */}
      {phase === "revealing" && revealData && (
        <RevealStamp
          canonical={revealData.canonical}
          tier={revealData.tier}
          points={revealData.points}
          pctOfPlayers={revealData.pctOfPlayers}
          isTimeout={revealData.isTimeout}
          isLastPrompt={promptIndex === (match?.prompts.length ?? 7) - 1}
          isShotLanded={isShotLanded}
          onNext={nextShot}
        />
      )}

      {/* Final Results Scorecard */}
      {phase === "finished" && completedMatchRecord && (
        <Scorecard
          matchRecord={completedMatchRecord}
          onReplay={() => startMatch()}
        />
      )}
    </main>
  );
}

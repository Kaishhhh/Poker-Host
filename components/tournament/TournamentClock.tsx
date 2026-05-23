"use client";

import { useCallback, useRef } from "react";
import { useClock } from "@/hooks/useClock";
import type { BlindLevel } from "@/app/generated/prisma/client";

interface Props {
  tournamentId: string;
  currentLevelIndex: number;
  levelStartedAt: number | null;
  isPaused: boolean;
  pausedSecondsRemaining: number | null;
  status: string;
  currentLevel: BlindLevel | null;
  nextLevel: BlindLevel | null;
  serverTime?: number;
  onUpdate?: () => void;
}

export function TournamentClock({
  tournamentId,
  currentLevelIndex,
  levelStartedAt,
  isPaused,
  pausedSecondsRemaining,
  status,
  currentLevel,
  nextLevel,
  serverTime,
  onUpdate,
}: Props) {
  const advancingRef = useRef(false);

  const handleExpire = useCallback(async () => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    try {
      await fetch(`/api/tournaments/${tournamentId}/next-level`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentLevelIndex }),
      });
      onUpdate?.();
    } finally {
      advancingRef.current = false;
    }
  }, [tournamentId, currentLevelIndex, onUpdate]);

  const { display, isWarning, isExpired } = useClock({
    levelStartedAt,
    isPaused,
    pausedSecondsRemaining,
    durationMinutes: currentLevel?.durationMinutes ?? 20,
    serverTime,
    onExpire: handleExpire,
  });

  async function handlePause() {
    await fetch(`/api/tournaments/${tournamentId}/pause`, { method: "POST" });
    onUpdate?.();
  }

  async function handleResume() {
    await fetch(`/api/tournaments/${tournamentId}/resume`, { method: "POST" });
    onUpdate?.();
  }

  async function handleNextLevel() {
    await fetch(`/api/tournaments/${tournamentId}/next-level`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentLevelIndex }),
    });
    onUpdate?.();
  }

  async function handleStart() {
    await fetch(`/api/tournaments/${tournamentId}/start`, { method: "POST" });
    onUpdate?.();
  }

  const isRunning = ["RUNNING", "BREAK"].includes(status);
  const isSetup = ["SETUP", "REGISTERING"].includes(status);
  const isComplete = status === "COMPLETE";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
      {/* Level label */}
      <div className="text-sm font-medium text-zinc-400 mb-1">
        {currentLevel?.isBreak
          ? currentLevel.label ?? "Break"
          : `Level ${currentLevelIndex + 1}`}
      </div>

      {/* Clock display */}
      <div
        className={`text-7xl font-mono font-bold tabular-nums mb-2 transition-colors ${
          isExpired
            ? "text-red-400"
            : isWarning
            ? "text-yellow-400"
            : isPaused
            ? "text-zinc-500"
            : "text-white"
        }`}
      >
        {isComplete ? "DONE" : display}
      </div>

      {/* Blinds */}
      {currentLevel && !currentLevel.isBreak && (
        <div className="text-lg text-zinc-300 mb-1">
          {currentLevel.smallBlind?.toLocaleString()}/
          {currentLevel.bigBlind?.toLocaleString()}
          {currentLevel.ante ? (
            <span className="text-zinc-500 text-base">
              {" "}
              ante {currentLevel.ante?.toLocaleString()}
            </span>
          ) : null}
        </div>
      )}

      {/* Next level info */}
      {nextLevel && (
        <div className="text-xs text-zinc-500 mb-4">
          Next:{" "}
          {nextLevel.isBreak
            ? nextLevel.label ?? "Break"
            : `${nextLevel.smallBlind?.toLocaleString()}/${nextLevel.bigBlind?.toLocaleString()}`}{" "}
          ({nextLevel.durationMinutes}m)
        </div>
      )}

      {/* Controls */}
      {!isComplete && (
        <div className="flex gap-2 justify-center flex-wrap mt-4">
          {isSetup ? (
            <button
              onClick={handleStart}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors"
            >
              Start Tournament
            </button>
          ) : isRunning ? (
            <>
              {isPaused ? (
                <button
                  onClick={handleResume}
                  className="px-5 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors"
                >
                  ▶ Resume
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="px-5 py-2 bg-yellow-700 hover:bg-yellow-600 rounded-lg font-medium transition-colors"
                >
                  ⏸ Pause
                </button>
              )}
              <button
                onClick={handleNextLevel}
                className="px-5 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
              >
                Next Level →
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

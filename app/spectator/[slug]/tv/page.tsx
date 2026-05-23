"use client";

import useSWR from "swr";
import { use } from "react";
import { useClock } from "@/hooks/useClock";
import { formatMoney } from "@/lib/payout";
import type { SpectatorSnapshot } from "@/types/tournament";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function TVClock({ snapshot }: { snapshot: SpectatorSnapshot }) {
  const { display, isWarning, isExpired } = useClock({
    levelStartedAt: snapshot.tournament.levelStartedAt,
    isPaused: snapshot.tournament.isPaused,
    pausedSecondsRemaining: snapshot.tournament.pausedSecondsRemaining,
    durationMinutes: snapshot.currentLevel?.durationMinutes ?? 20,
    serverTime: snapshot.serverTime,
  });

  return (
    <div
      className={`text-[12rem] font-mono font-black tabular-nums leading-none transition-colors ${
        isExpired
          ? "text-red-400"
          : isWarning
          ? "text-yellow-300"
          : snapshot.tournament.isPaused
          ? "text-zinc-600"
          : "text-white"
      }`}
    >
      {display}
    </div>
  );
}

export default function TVPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const { data } = useSWR<SpectatorSnapshot>(
    `/api/spectator/${slug}`,
    fetcher,
    { refreshInterval: 2000, revalidateOnFocus: false }
  );

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-700 text-2xl font-mono">
        Loading...
      </div>
    );
  }

  const { tournament, currentLevel, nextLevel } = data;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-10 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-zinc-400">{tournament.name}</h1>
        <div className="flex gap-8 text-right">
          <div>
            <div className="text-xs text-zinc-600 uppercase">Players</div>
            <div className="text-xl font-bold">{tournament.activePlayers}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-600 uppercase">Prize Pool</div>
            <div className="text-xl font-bold text-green-400">
              {formatMoney(tournament.prizePool)}
            </div>
          </div>
        </div>
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {/* Level label */}
        <div className="text-3xl font-semibold text-zinc-400 uppercase tracking-widest">
          {tournament.status === "BREAK"
            ? currentLevel?.label ?? "Break"
            : `Level ${tournament.currentLevelIndex + 1}`}
          {tournament.isPaused && (
            <span className="ml-4 text-yellow-400">PAUSED</span>
          )}
        </div>

        {/* Clock */}
        <TVClock snapshot={data} />

        {/* Blinds */}
        {currentLevel && !currentLevel.isBreak && (
          <div className="text-5xl font-light text-zinc-300">
            {currentLevel.smallBlind?.toLocaleString()}/
            {currentLevel.bigBlind?.toLocaleString()}
            {currentLevel.ante ? (
              <span className="text-zinc-500 text-3xl ml-4">
                ante {currentLevel.ante.toLocaleString()}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="px-10 pb-8 pt-4 flex items-center justify-between">
        {nextLevel ? (
          <div className="text-zinc-600">
            <span className="text-zinc-700 mr-2">Next:</span>
            {nextLevel.isBreak
              ? nextLevel.label ?? "Break"
              : `${nextLevel.smallBlind?.toLocaleString()}/${nextLevel.bigBlind?.toLocaleString()}`}{" "}
            · {nextLevel.durationMinutes}m
          </div>
        ) : (
          <div />
        )}
        <div className="text-zinc-800 text-sm">Poker Host</div>
      </div>
    </div>
  );
}

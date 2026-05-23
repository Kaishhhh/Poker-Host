"use client";

import useSWR from "swr";
import { use } from "react";
import { useClock } from "@/hooks/useClock";
import { formatMoney } from "@/lib/payout";
import type { SpectatorSnapshot } from "@/types/tournament";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function SpectatorClock({ snapshot }: { snapshot: SpectatorSnapshot }) {
  const { display, isWarning, isExpired } = useClock({
    levelStartedAt: snapshot.tournament.levelStartedAt,
    isPaused: snapshot.tournament.isPaused,
    pausedSecondsRemaining: snapshot.tournament.pausedSecondsRemaining,
    durationMinutes: snapshot.currentLevel?.durationMinutes ?? 20,
    serverTime: snapshot.serverTime,
  });

  return (
    <div
      className={`text-8xl font-mono font-bold tabular-nums ${
        isExpired
          ? "text-red-400"
          : isWarning
          ? "text-yellow-400"
          : snapshot.tournament.isPaused
          ? "text-zinc-500"
          : "text-white"
      }`}
    >
      {snapshot.tournament.status === "COMPLETE" ? "DONE" : display}
    </div>
  );
}

export default function SpectatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const { data, error } = useSWR<SpectatorSnapshot>(
    `/api/spectator/${slug}`,
    fetcher,
    { refreshInterval: 2000, revalidateOnFocus: true }
  );

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <div className="text-4xl mb-3">🃏</div>
          <h1 className="text-xl font-bold mb-2">Tournament not found</h1>
          <p className="text-zinc-500">This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-500">
        Loading...
      </div>
    );
  }

  const { tournament, currentLevel, nextLevel, upcomingLevels, tables } = data;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg">{tournament.name}</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-400">{tournament.activePlayers} players</span>
          <span className="text-green-400 font-medium">
            {formatMoney(tournament.prizePool)} prize pool
          </span>
          <Link
            href={`/spectator/${slug}/tv`}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            TV mode
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">
        {/* Current level label */}
        <div className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
          {tournament.status === "BREAK"
            ? currentLevel?.label ?? "Break"
            : `Level ${tournament.currentLevelIndex + 1}`}
          {tournament.isPaused && (
            <span className="ml-2 text-yellow-400">· Paused</span>
          )}
        </div>

        {/* Clock */}
        <SpectatorClock snapshot={data} />

        {/* Blinds */}
        {currentLevel && !currentLevel.isBreak && (
          <div className="text-center">
            <div className="text-3xl font-semibold">
              {currentLevel.smallBlind?.toLocaleString()}/
              {currentLevel.bigBlind?.toLocaleString()}
            </div>
            {currentLevel.ante ? (
              <div className="text-zinc-400 text-sm mt-1">
                Ante: {currentLevel.ante.toLocaleString()}
              </div>
            ) : null}
          </div>
        )}

        {/* Next level */}
        {nextLevel && (
          <div className="text-sm text-zinc-500 text-center">
            Next:{" "}
            {nextLevel.isBreak
              ? nextLevel.label ?? "Break"
              : `${nextLevel.smallBlind?.toLocaleString()}/${nextLevel.bigBlind?.toLocaleString()}`}{" "}
            · {nextLevel.durationMinutes}m
          </div>
        )}

        {/* Table summary */}
        {tables.length > 0 && (
          <div className="flex gap-3 flex-wrap justify-center">
            {tables.map((t) => (
              <div
                key={t.tableNumber}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-center"
              >
                <div className="text-xs text-zinc-500">Table {t.tableNumber}</div>
                <div className="text-sm font-medium">{t.playerCount} players</div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming levels */}
        {upcomingLevels.length > 0 && (
          <div className="w-full max-w-sm">
            <div className="text-xs text-zinc-600 uppercase tracking-wider mb-2">
              Coming up
            </div>
            <div className="space-y-1">
              {upcomingLevels.slice(0, 4).map((level, i) => (
                <div
                  key={i}
                  className="flex justify-between text-xs text-zinc-500 py-0.5"
                >
                  <span>
                    {level.isBreak
                      ? level.label ?? "Break"
                      : `${level.smallBlind?.toLocaleString()}/${level.bigBlind?.toLocaleString()}`}
                  </span>
                  <span>{level.durationMinutes}m</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

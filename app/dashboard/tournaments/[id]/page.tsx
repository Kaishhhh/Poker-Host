"use client";

import useSWR from "swr";
import { use, useState, useCallback } from "react";
import { TournamentClock } from "@/components/tournament/TournamentClock";
import { PlayerList } from "@/components/tournament/PlayerList";
import { LevelSchedule } from "@/components/tournament/LevelSchedule";
import { TableMap } from "@/components/tournament/TableMap";
import { UndoBar } from "@/components/tournament/UndoBar";
import { formatMoney } from "@/lib/payout";
import { ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import type { TournamentWithRelations } from "@/types/tournament";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const { data: tournament, mutate } = useSWR<TournamentWithRelations>(
    `/api/tournaments/${id}`,
    fetcher,
    { refreshInterval: 2000 }
  );

  const handleUpdate = useCallback(() => {
    mutate();
  }, [mutate]);

  const handlePlayerUpdate = useCallback(() => {
    setLastAction(null);
    mutate().then((t) => {
      if (!t) return;
      const lastLog = t as unknown as { actionLogs?: { actionType: string }[] };
      // Can't fetch action logs from this endpoint — track via separate state
    });
    handleUpdate();
  }, [handleUpdate, mutate]);

  if (!tournament) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500">
        Loading tournament...
      </div>
    );
  }

  const currentLevel = tournament.blindLevels[tournament.currentLevelIndex] ?? null;
  const nextLevel = tournament.blindLevels[tournament.currentLevelIndex + 1] ?? null;
  const spectatorUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/spectator/${tournament.slug}`;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-zinc-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{tournament.name}</h1>
            <p className="text-sm text-zinc-400">
              {tournament.totalEntries} players ·{" "}
              {formatMoney(tournament.prizePool)} prize pool
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
          >
            <Share2 size={14} />
            Share
          </button>
        </div>
      </div>

      {/* Share modal */}
      {shareOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-semibold mb-3">Spectator Link</h2>
            <p className="text-sm text-zinc-400 mb-3">
              Share this link so anyone can watch the tournament live.
            </p>
            <div className="bg-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 mb-3 break-all">
              {spectatorUrl}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(spectatorUrl);
                }}
                className="flex-1 bg-green-700 hover:bg-green-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                Copy Link
              </button>
              <Link
                href={spectatorUrl}
                target="_blank"
                className="flex-1 text-center bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                Open
              </Link>
              <button
                onClick={() => setShareOpen(false)}
                className="px-3 py-2 text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clock — spans 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <TournamentClock
            tournamentId={id}
            currentLevelIndex={tournament.currentLevelIndex}
            levelStartedAt={
              tournament.levelStartedAt ? Number(tournament.levelStartedAt) : null
            }
            isPaused={tournament.isPaused}
            pausedSecondsRemaining={tournament.pausedSecondsRemaining}
            status={tournament.status}
            currentLevel={currentLevel}
            nextLevel={nextLevel}
            onUpdate={handleUpdate}
          />
          <LevelSchedule
            levels={tournament.blindLevels}
            currentLevelIndex={tournament.currentLevelIndex}
          />
          <TableMap
            tables={tournament.tables as TournamentWithRelations["tables"]}
            tournamentId={id}
            onUpdate={handleUpdate}
          />
        </div>

        {/* Player list */}
        <div>
          <PlayerList
            players={tournament.players}
            hasRebuys={!!tournament.rebuyAmount}
            hasAddOns={!!tournament.addOnAmount}
            tournamentId={id}
            onUpdate={() => {
              setLastAction("PLAYER_REGISTERED");
              handleUpdate();
            }}
          />
        </div>
      </div>

      <UndoBar
        lastAction={lastAction}
        tournamentId={id}
        onUndo={() => {
          setLastAction(null);
          handleUpdate();
        }}
      />
    </div>
  );
}

"use client";

import type { Table, Player } from "@/app/generated/prisma/client";
import { useState } from "react";

interface TableWithPlayers extends Table {
  players: Player[];
}

interface Props {
  tables: TableWithPlayers[];
  tournamentId: string;
  onUpdate?: () => void;
}

export function TableMap({ tables, tournamentId, onUpdate }: Props) {
  const [rebalanceMoves, setRebalanceMoves] = useState<
    {
      playerId: string;
      fromTableId: string;
      toTableId: string;
      toSeat: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  async function addTable() {
    await fetch(`/api/tournaments/${tournamentId}/tables`, { method: "POST" });
    onUpdate?.();
  }

  async function computeRebalance() {
    setLoading(true);
    const res = await fetch(`/api/tournaments/${tournamentId}/tables/rebalance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apply: false }),
    });
    const data = await res.json();
    setRebalanceMoves(data.moves ?? []);
    setLoading(false);
  }

  async function applyRebalance() {
    setLoading(true);
    await fetch(`/api/tournaments/${tournamentId}/tables/rebalance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apply: true }),
    });
    setRebalanceMoves([]);
    setLoading(false);
    onUpdate?.();
  }

  async function assignSeats() {
    await fetch(`/api/tournaments/${tournamentId}/tables/assign`, { method: "POST" });
    onUpdate?.();
  }

  const activeCount = tables.reduce((sum, t) => sum + t.players.filter(p => p.status === "ACTIVE").length, 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Tables</h2>
        <div className="flex gap-2">
          {tables.length > 0 && (
            <button
              onClick={assignSeats}
              className="text-xs px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
            >
              Assign Seats
            </button>
          )}
          {tables.length > 1 && activeCount > 0 && (
            <button
              onClick={rebalanceMoves.length > 0 ? applyRebalance : computeRebalance}
              disabled={loading}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                rebalanceMoves.length > 0
                  ? "bg-green-700 hover:bg-green-600 text-white"
                  : "bg-zinc-700 hover:bg-zinc-600"
              }`}
            >
              {loading
                ? "..."
                : rebalanceMoves.length > 0
                ? `Apply ${rebalanceMoves.length} moves`
                : "Rebalance"}
            </button>
          )}
          <button
            onClick={addTable}
            className="text-xs px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
          >
            + Table
          </button>
        </div>
      </div>

      {rebalanceMoves.length > 0 && (
        <div className="mb-3 bg-blue-950/40 border border-blue-900 rounded-lg p-3 text-xs space-y-1">
          <p className="font-medium text-blue-300">Suggested moves:</p>
          {rebalanceMoves.map((m, i) => {
            const fromTable = tables.find((t) => t.id === m.fromTableId);
            const toTable = tables.find((t) => t.id === m.toTableId);
            const player = tables
              .flatMap((t) => t.players)
              .find((p) => p.id === m.playerId);
            return (
              <p key={i} className="text-blue-200">
                {player?.name ?? "Player"}: Table {fromTable?.tableNumber} →
                Table {toTable?.tableNumber} seat {m.toSeat}
              </p>
            );
          })}
        </div>
      )}

      {tables.length === 0 ? (
        <p className="text-zinc-600 text-sm text-center py-4">
          No tables yet. Add a table to start seating players.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {tables.map((table) => {
            const activePlayers = table.players.filter((p) => p.status === "ACTIVE");
            return (
              <div
                key={table.id}
                className="bg-zinc-800 rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    Table {table.tableNumber}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {activePlayers.length}/{table.maxSeats}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: table.maxSeats }, (_, i) => {
                    const seat = i + 1;
                    const player = activePlayers.find(
                      (p) => p.seatNumber === seat
                    );
                    const isMove = rebalanceMoves.some(
                      (m) => m.fromTableId === table.id && m.playerId === player?.id
                    );
                    return (
                      <div
                        key={seat}
                        className={`text-center rounded px-1 py-0.5 text-xs ${
                          player
                            ? isMove
                              ? "bg-yellow-900 text-yellow-300"
                              : "bg-zinc-700 text-zinc-200"
                            : "bg-zinc-900 text-zinc-600"
                        }`}
                        title={player?.name}
                      >
                        {player ? player.name.slice(0, 4) : `S${seat}`}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

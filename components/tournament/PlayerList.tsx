"use client";

import { useState } from "react";
import type { Player } from "@/app/generated/prisma/client";
import { UserMinus, RefreshCw, Plus } from "lucide-react";

interface Props {
  players: Player[];
  hasRebuys: boolean;
  hasAddOns: boolean;
  tournamentId: string;
  onUpdate?: () => void;
}

export function PlayerList({ players, hasRebuys, hasAddOns, tournamentId, onUpdate }: Props) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "eliminated">("all");

  const active = players.filter((p) => p.status === "ACTIVE");
  const eliminated = players.filter((p) => p.status === "ELIMINATED");
  const displayed =
    filter === "active" ? active : filter === "eliminated" ? eliminated : players;

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    await fetch(`/api/tournaments/${tournamentId}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    setAdding(false);
    onUpdate?.();
  }

  async function eliminate(playerId: string) {
    if (!confirm("Eliminate this player?")) return;
    await fetch(`/api/tournaments/${tournamentId}/players/${playerId}/eliminate`, {
      method: "POST",
    });
    onUpdate?.();
  }

  async function rebuy(playerId: string) {
    await fetch(`/api/tournaments/${tournamentId}/players/${playerId}/rebuy`, {
      method: "POST",
    });
    onUpdate?.();
  }

  async function addOn(playerId: string) {
    await fetch(`/api/tournaments/${tournamentId}/players/${playerId}/add-on`, {
      method: "POST",
    });
    onUpdate?.();
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">
          Players{" "}
          <span className="text-zinc-400 font-normal text-sm">
            ({active.length} active / {eliminated.length} out)
          </span>
        </h2>
        <div className="flex gap-1">
          {(["all", "active", "eliminated"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2 py-1 rounded capitalize transition-colors ${
                filter === f
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Add player form */}
      <form onSubmit={addPlayer} className="flex gap-2 mb-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Player name"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="flex items-center gap-1 px-3 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Plus size={14} />
          Add
        </button>
      </form>

      {/* Player list */}
      <div className="space-y-1.5 max-h-96 overflow-y-auto">
        {displayed.length === 0 && (
          <p className="text-center text-zinc-600 text-sm py-4">
            {filter === "eliminated" ? "No eliminated players" : "No players yet"}
          </p>
        )}
        {displayed.map((player) => (
          <div
            key={player.id}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              player.status === "ELIMINATED"
                ? "bg-zinc-800/50 text-zinc-500"
                : "bg-zinc-800"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate font-medium">{player.name}</span>
              {player.rebuys > 0 && (
                <span className="text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">
                  R{player.rebuys}
                </span>
              )}
              {player.addOns > 0 && (
                <span className="text-xs bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded">
                  A{player.addOns}
                </span>
              )}
              {player.status === "ELIMINATED" && player.finishPosition && (
                <span className="text-xs text-zinc-600">
                  #{player.finishPosition}
                </span>
              )}
            </div>
            {player.status === "ACTIVE" && (
              <div className="flex gap-1 ml-2">
                {hasRebuys && (
                  <button
                    onClick={() => rebuy(player.id)}
                    title="Rebuy"
                    className="p-1 text-zinc-500 hover:text-blue-400 transition-colors"
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
                {hasAddOns && (
                  <button
                    onClick={() => addOn(player.id)}
                    title="Add-On"
                    className="p-1 text-zinc-500 hover:text-purple-400 transition-colors text-xs font-bold"
                  >
                    A+
                  </button>
                )}
                <button
                  onClick={() => eliminate(player.id)}
                  title="Eliminate"
                  className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <UserMinus size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

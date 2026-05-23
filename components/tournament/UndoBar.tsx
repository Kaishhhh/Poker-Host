"use client";

import { useState, useEffect } from "react";
import { Undo2 } from "lucide-react";

interface Props {
  lastAction: string | null;
  tournamentId: string;
  onUndo?: () => void;
}

export function UndoBar({ lastAction, tournamentId, onUndo }: Props) {
  const [visible, setVisible] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lastAction) {
      setVisible(false);
      return;
    }
    setVisible(true);

    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setVisible(false), 30000);
    setTimer(t);

    return () => clearTimeout(t);
  }, [lastAction]);

  async function handleUndo() {
    const res = await fetch(`/api/tournaments/${tournamentId}/undo`, {
      method: "POST",
    });
    if (res.ok) {
      setVisible(false);
      onUndo?.();
    }
  }

  if (!visible || !lastAction) return null;

  const labels: Record<string, string> = {
    PLAYER_REGISTERED: "Player registered",
    PLAYER_ELIMINATED: "Player eliminated",
    REBUY: "Rebuy added",
    ADD_ON: "Add-on added",
    LEVEL_ADVANCE: "Level advanced",
    PLAYER_MOVED: "Player moved",
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-full shadow-xl px-5 py-3">
      <span className="text-sm text-zinc-300">
        {labels[lastAction] ?? lastAction}
      </span>
      <button
        onClick={handleUndo}
        className="flex items-center gap-1.5 text-sm font-medium text-white bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-full transition-colors"
      >
        <Undo2 size={14} />
        Undo
      </button>
    </div>
  );
}

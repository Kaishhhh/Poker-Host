"use client";

import type { BlindLevel } from "@/app/generated/prisma/client";

interface Props {
  levels: BlindLevel[];
  currentLevelIndex: number;
}

export function LevelSchedule({ levels, currentLevelIndex }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <h2 className="font-semibold mb-3">Level Schedule</h2>
      <div className="overflow-y-auto max-h-72">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500 text-xs border-b border-zinc-800">
              <th className="pb-2 pr-3">#</th>
              <th className="pb-2 pr-3">Blinds</th>
              <th className="pb-2 pr-3">Ante</th>
              <th className="pb-2">Min</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level, i) => {
              const isCurrent = i === currentLevelIndex;
              const isPast = i < currentLevelIndex;

              return (
                <tr
                  key={level.id}
                  className={`border-b border-zinc-800/50 ${
                    isCurrent
                      ? "bg-green-950/40"
                      : isPast
                      ? "opacity-40"
                      : ""
                  }`}
                >
                  <td className="py-1.5 pr-3 text-zinc-500 tabular-nums">
                    {level.isBreak ? "—" : i + 1}
                    {isCurrent && (
                      <span className="ml-1 text-green-400">▶</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3">
                    {level.isBreak ? (
                      <span className="text-orange-400">
                        {level.label ?? "Break"}
                      </span>
                    ) : (
                      <span>
                        {level.smallBlind?.toLocaleString()}/
                        {level.bigBlind?.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3 text-zinc-400">
                    {level.isBreak ? "—" : (level.ante ?? 0).toLocaleString()}
                  </td>
                  <td className="py-1.5 tabular-nums">{level.durationMinutes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

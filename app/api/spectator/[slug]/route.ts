import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/spectator/[slug]">
) {
  const { slug } = await ctx.params;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      blindLevels: { orderBy: { levelIndex: "asc" } },
      tables: {
        where: { status: "ACTIVE" },
        include: { players: { where: { status: "ACTIVE" } } },
        orderBy: { tableNumber: "asc" },
      },
      players: { where: { status: "ACTIVE" } },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const current = tournament.blindLevels[tournament.currentLevelIndex] ?? null;
  const next = tournament.blindLevels[tournament.currentLevelIndex + 1] ?? null;
  const upcoming = tournament.blindLevels.slice(tournament.currentLevelIndex + 1, tournament.currentLevelIndex + 6);

  const response = {
    serverTime: Date.now(),
    tournament: {
      id: tournament.id,
      name: tournament.name,
      slug: tournament.slug,
      status: tournament.status,
      currentLevelIndex: tournament.currentLevelIndex,
      levelStartedAt: tournament.levelStartedAt ? Number(tournament.levelStartedAt) : null,
      isPaused: tournament.isPaused,
      pausedSecondsRemaining: tournament.pausedSecondsRemaining,
      prizePool: tournament.prizePool,
      totalEntries: tournament.totalEntries,
      activePlayers: tournament.players.length,
    },
    currentLevel: current,
    nextLevel: next,
    upcomingLevels: upcoming,
    tables: tournament.tables.map((t) => ({
      tableNumber: t.tableNumber,
      playerCount: t.players.length,
    })),
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

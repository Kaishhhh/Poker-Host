import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRemainingSeconds } from "@/lib/clock";
import { jsonResponse } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/pause">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      blindLevels: {
        where: { levelIndex: { gte: 0 } },
        orderBy: { levelIndex: "asc" },
      },
    },
  });

  if (!tournament || tournament.hostId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  if (tournament.status !== "RUNNING" || tournament.isPaused) {
    return NextResponse.json({ error: "Tournament is not running" }, { status: 409 });
  }

  const currentLevel = tournament.blindLevels[tournament.currentLevelIndex];
  if (!currentLevel) {
    return NextResponse.json({ error: "Invalid level" }, { status: 500 });
  }

  const remaining = getRemainingSeconds({
    levelStartedAt: tournament.levelStartedAt,
    isPaused: tournament.isPaused,
    pausedSecondsRemaining: tournament.pausedSecondsRemaining,
    durationMinutes: currentLevel.durationMinutes,
  });

  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      isPaused: true,
      pausedSecondsRemaining: Math.ceil(remaining),
    },
  });

  return jsonResponse(updated);
}

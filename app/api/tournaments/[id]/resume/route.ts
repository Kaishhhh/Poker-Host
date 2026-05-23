import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/resume">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const tournament = await prisma.tournament.findUnique({ where: { id } });

  if (!tournament || tournament.hostId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  if (tournament.status !== "RUNNING" || !tournament.isPaused) {
    return NextResponse.json({ error: "Tournament is not paused" }, { status: 409 });
  }

  const remaining = tournament.pausedSecondsRemaining ?? 0;

  // Fetch the current blind level to compute elapsed time
  const levelData = await prisma.blindLevel.findFirst({
    where: { tournamentId: id, levelIndex: tournament.currentLevelIndex },
  });

  if (!levelData) {
    return NextResponse.json({ error: "Level not found" }, { status: 500 });
  }

  const durationSeconds = levelData.durationMinutes * 60;
  const elapsedSeconds = durationSeconds - remaining;
  const levelStartedAt = BigInt(Date.now()) - BigInt(elapsedSeconds * 1000);

  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      isPaused: false,
      pausedSecondsRemaining: null,
      levelStartedAt,
    },
  });

  return NextResponse.json(updated);
}

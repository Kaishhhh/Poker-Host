import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { logAction } from "@/lib/actions";
import { z } from "zod";

const Schema = z.object({
  currentLevelIndex: z.number().int().min(0),
});

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/next-level">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "currentLevelIndex required" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { blindLevels: { orderBy: { levelIndex: "asc" } } },
  });

  if (!tournament || tournament.hostId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  // Idempotency guard: if level already advanced, return current state
  if (tournament.currentLevelIndex !== parsed.data.currentLevelIndex) {
    return NextResponse.json(tournament, { status: 200 });
  }

  const nextIndex = tournament.currentLevelIndex + 1;

  if (nextIndex >= tournament.blindLevels.length) {
    // No more levels — mark complete
    const updated = await prisma.tournament.update({
      where: { id },
      data: { status: "COMPLETE", completedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  const nextLevel = tournament.blindLevels[nextIndex];
  const newStatus = nextLevel.isBreak ? "BREAK" : "RUNNING";

  await logAction(id, "LEVEL_ADVANCE", {
    previousLevelIndex: tournament.currentLevelIndex,
    previousStatus: tournament.status,
    previousLevelStartedAt: tournament.levelStartedAt?.toString(),
  });

  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      currentLevelIndex: nextIndex,
      status: newStatus,
      levelStartedAt: BigInt(Date.now()),
      isPaused: false,
      pausedSecondsRemaining: null,
    },
  });

  return NextResponse.json(updated);
}

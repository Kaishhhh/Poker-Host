import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/start">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { blindLevels: { orderBy: { levelIndex: "asc" } } },
  });

  if (!tournament || tournament.hostId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  if (!["SETUP", "REGISTERING"].includes(tournament.status)) {
    return NextResponse.json(
      { error: "Tournament is not in a startable state" },
      { status: 409 }
    );
  }

  if (tournament.blindLevels.length === 0) {
    return NextResponse.json(
      { error: "Tournament has no blind levels" },
      { status: 422 }
    );
  }

  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      status: "RUNNING",
      startedAt: tournament.startedAt ?? new Date(),
      currentLevelIndex: 0,
      levelStartedAt: BigInt(Date.now()),
      isPaused: false,
      pausedSecondsRemaining: null,
    },
  });

  return NextResponse.json(updated);
}

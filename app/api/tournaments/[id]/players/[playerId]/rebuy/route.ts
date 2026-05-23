import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/players/[playerId]/rebuy">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, playerId } = await ctx.params;
  const tournament = await prisma.tournament.findUnique({ where: { id } });

  if (!tournament || tournament.hostId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  if (!tournament.rebuyAmount) {
    return NextResponse.json({ error: "Rebuys not configured" }, { status: 422 });
  }

  if (
    tournament.rebuyDeadline != null &&
    tournament.currentLevelIndex > tournament.rebuyDeadline
  ) {
    return NextResponse.json({ error: "Rebuy period has ended" }, { status: 409 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player || player.tournamentId !== id) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  await logAction(id, "REBUY", {
    player: { id: player.id, rebuys: player.rebuys, chipCount: player.chipCount },
    buyInAmount: tournament.rebuyAmount,
  });

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { rebuys: { increment: 1 } },
  });

  await prisma.tournament.update({
    where: { id },
    data: {
      totalRebuys: { increment: 1 },
      prizePool: { increment: tournament.rebuyAmount },
    },
  });

  return NextResponse.json(updated);
}

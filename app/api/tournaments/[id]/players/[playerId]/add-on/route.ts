import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/players/[playerId]/add-on">
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

  if (!tournament.addOnAmount) {
    return NextResponse.json({ error: "Add-ons not configured" }, { status: 422 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player || player.tournamentId !== id) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  await logAction(id, "ADD_ON", {
    player: { id: player.id, addOns: player.addOns },
    addOnAmount: tournament.addOnAmount,
  });

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { addOns: { increment: 1 } },
  });

  await prisma.tournament.update({
    where: { id },
    data: {
      totalAddOns: { increment: 1 },
      prizePool: { increment: tournament.addOnAmount },
    },
  });

  return NextResponse.json(updated);
}

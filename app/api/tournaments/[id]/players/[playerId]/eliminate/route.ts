import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/players/[playerId]/eliminate">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, playerId } = await ctx.params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { players: { where: { status: "ACTIVE" } } },
  });

  if (!tournament || tournament.hostId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player || player.tournamentId !== id) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
  if (player.status === "ELIMINATED") {
    return NextResponse.json({ error: "Player already eliminated" }, { status: 409 });
  }

  // Finish position = number of active players remaining (including this one)
  const finishPosition = tournament.players.length;

  await logAction(id, "PLAYER_ELIMINATED", {
    player: {
      id: player.id,
      status: player.status,
      tableId: player.tableId,
      seatNumber: player.seatNumber,
      finishPosition: player.finishPosition,
      eliminatedAt: player.eliminatedAt?.toISOString() ?? null,
    },
  });

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: {
      status: "ELIMINATED",
      finishPosition,
      eliminatedAt: new Date(),
      tableId: null,
      seatNumber: null,
    },
  });

  return NextResponse.json(updated);
}

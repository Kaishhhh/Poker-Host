import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/actions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MoveSchema = z.object({
  tableId: z.string(),
  seatNumber: z.number().int().min(1).max(10),
});

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/players/[playerId]/move">
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

  const body = await req.json();
  const parsed = MoveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "tableId and seatNumber required" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player || player.tournamentId !== id) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  await logAction(id, "PLAYER_MOVED", {
    playerId: player.id,
    fromTableId: player.tableId,
    fromSeat: player.seatNumber,
  });

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { tableId: parsed.data.tableId, seatNumber: parsed.data.seatNumber },
  });

  return NextResponse.json(updated);
}

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeRebalanceMoves } from "@/lib/rebalance";
import { logAction } from "@/lib/actions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({ apply: z.boolean().default(false) });

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/tables/rebalance">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      tables: {
        where: { status: "ACTIVE" },
        include: {
          players: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  if (!tournament || tournament.hostId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { apply } = Schema.parse(body);

  const moves = computeRebalanceMoves(
    tournament.tables.map((t) => ({
      id: t.id,
      tableNumber: t.tableNumber,
      maxSeats: t.maxSeats,
      players: t.players.map((p) => ({ id: p.id, seatNumber: p.seatNumber })),
    }))
  );

  if (apply && moves.length > 0) {
    for (const move of moves) {
      const player = await prisma.player.findUnique({ where: { id: move.playerId } });
      await logAction(id, "PLAYER_MOVED", {
        playerId: move.playerId,
        fromTableId: player?.tableId ?? null,
        fromSeat: player?.seatNumber ?? null,
      });
      await prisma.player.update({
        where: { id: move.playerId },
        data: { tableId: move.toTableId, seatNumber: move.toSeat },
      });
    }
  }

  return NextResponse.json({ moves, applied: apply });
}

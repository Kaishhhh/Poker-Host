import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assignSeatsBalanced } from "@/lib/seating";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/tables/assign">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      players: { where: { status: "ACTIVE" } },
      tables: { where: { status: "ACTIVE" } },
    },
  });

  if (!tournament || tournament.hostId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  if (tournament.tables.length === 0) {
    return NextResponse.json({ error: "No tables created yet" }, { status: 422 });
  }

  const unseated = tournament.players.filter((p) => p.tableId === null);
  if (unseated.length === 0) {
    return NextResponse.json({ error: "All players already seated" }, { status: 422 });
  }

  const tableConfigs = tournament.tables.map((t) => ({
    id: t.id,
    maxSeats: t.maxSeats,
    currentPlayerCount: tournament.players.filter(
      (p) => p.tableId === t.id
    ).length,
  }));

  const assignments = assignSeatsBalanced(
    unseated.map((p) => p.id),
    tableConfigs
  );

  // Apply all assignments
  await Promise.all(
    assignments.map((a) =>
      prisma.player.update({
        where: { id: a.playerId },
        data: { tableId: a.tableId, seatNumber: a.seatNumber },
      })
    )
  );

  const updatedTables = await prisma.table.findMany({
    where: { tournamentId: id },
    include: { players: true },
    orderBy: { tableNumber: "asc" },
  });

  return NextResponse.json({ assignments, tables: updatedTables });
}

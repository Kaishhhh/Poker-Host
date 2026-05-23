import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

async function verifyOwner(tournamentId: string, userId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { hostId: true },
  });
  if (!tournament) return null;
  if (tournament.hostId !== userId) return null;
  return tournament;
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      blindLevels: { orderBy: { levelIndex: "asc" } },
      players: { orderBy: { registeredAt: "asc" } },
      tables: {
        include: { players: true },
        orderBy: { tableNumber: "asc" },
      },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (tournament.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return jsonResponse(tournament);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const owned = await verifyOwner(id, session.user.id);
  if (!owned) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  await prisma.tournament.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

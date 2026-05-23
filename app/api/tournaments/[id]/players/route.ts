import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/actions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(1).max(60),
});

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/players">
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

  const players = await prisma.player.findMany({
    where: { tournamentId: id },
    orderBy: { registeredAt: "asc" },
  });

  return NextResponse.json(players);
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/players">
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

  if (!["SETUP", "REGISTERING", "RUNNING", "PAUSED", "BREAK"].includes(tournament.status)) {
    return NextResponse.json({ error: "Registration is closed" }, { status: 409 });
  }

  // Late registration check
  if (
    tournament.lateRegLevels > 0 &&
    tournament.currentLevelIndex >= tournament.lateRegLevels &&
    tournament.status !== "SETUP"
  ) {
    return NextResponse.json(
      { error: "Late registration period has ended" },
      { status: 409 }
    );
  }

  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const player = await prisma.player.create({
    data: {
      tournamentId: id,
      name: parsed.data.name,
    },
  });

  await prisma.tournament.update({
    where: { id },
    data: {
      totalEntries: { increment: 1 },
      prizePool: { increment: tournament.buyInAmount },
      status: tournament.status === "SETUP" ? "REGISTERING" : tournament.status,
    },
  });

  await logAction(id, "PLAYER_REGISTERED", { playerId: player.id, name: player.name });

  return NextResponse.json(player, { status: 201 });
}

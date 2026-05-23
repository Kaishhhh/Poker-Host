import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateTableSchema = z.object({
  maxSeats: z.number().int().min(2).max(10).default(9),
});

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/tables">
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

  const tables = await prisma.table.findMany({
    where: { tournamentId: id },
    include: { players: { where: { status: "ACTIVE" } } },
    orderBy: { tableNumber: "asc" },
  });

  return NextResponse.json(tables);
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/tables">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { tables: true },
  });
  if (!tournament || tournament.hostId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = CreateTableSchema.safeParse(body);

  const tableNumber = tournament.tables.length + 1;
  const table = await prisma.table.create({
    data: {
      tournamentId: id,
      tableNumber,
      maxSeats: parsed.success ? parsed.data.maxSeats : 9,
    },
  });

  return NextResponse.json(table, { status: 201 });
}

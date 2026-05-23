import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/complete">
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

  if (tournament.status === "COMPLETE") {
    return jsonResponse(tournament);
  }

  const updated = await prisma.tournament.update({
    where: { id },
    data: { status: "COMPLETE", completedAt: new Date() },
  });

  return jsonResponse(updated);
}

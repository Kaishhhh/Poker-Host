import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BlindLevelSchema = z.object({
  levelIndex: z.number().int().min(0),
  isBreak: z.boolean(),
  smallBlind: z.number().int().min(1).optional(),
  bigBlind: z.number().int().min(1).optional(),
  ante: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(1),
  label: z.string().optional(),
});

const CreateTournamentSchema = z.object({
  name: z.string().min(1).max(100),
  buyInAmount: z.number().int().min(1),
  rebuyAmount: z.number().int().min(1).optional(),
  rebuyDeadline: z.number().int().min(0).optional(),
  addOnAmount: z.number().int().min(1).optional(),
  addOnBreakLevel: z.number().int().min(0).optional(),
  lateRegLevels: z.number().int().min(0).default(0),
  blindLevels: z.array(BlindLevelSchema).min(1),
  payoutStructure: z
    .array(
      z.object({
        place: z.number().int().min(1),
        percentage: z.number().min(0).max(100),
        amount: z.number().int().min(0),
      })
    )
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tournaments = await prisma.tournament.findMany({
    where: { hostId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      totalEntries: true,
      prizePool: true,
      createdAt: true,
    },
  });

  return NextResponse.json(tournaments);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateTournamentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const slug = generateSlug();

  const tournament = await prisma.tournament.create({
    data: {
      slug,
      hostId: session.user.id,
      name: data.name,
      buyInAmount: data.buyInAmount,
      rebuyAmount: data.rebuyAmount,
      rebuyDeadline: data.rebuyDeadline,
      addOnAmount: data.addOnAmount,
      addOnBreakLevel: data.addOnBreakLevel,
      lateRegLevels: data.lateRegLevels,
      payoutStructure: data.payoutStructure as object[] | undefined,
      blindLevels: {
        create: data.blindLevels.map((level) => ({
          levelIndex: level.levelIndex,
          isBreak: level.isBreak,
          smallBlind: level.smallBlind,
          bigBlind: level.bigBlind,
          ante: level.ante,
          durationMinutes: level.durationMinutes,
          label: level.label,
        })),
      },
    },
    include: { blindLevels: true },
  });

  return NextResponse.json(tournament, { status: 201 });
}

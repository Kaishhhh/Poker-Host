import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getNextActionSequence } from "@/lib/actions";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/tournaments/[id]/undo">
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

  // Find the most recent undoable action
  const lastAction = await prisma.actionLog.findFirst({
    where: { tournamentId: id, reversedBy: null },
    orderBy: { sequence: "desc" },
  });

  if (!lastAction) {
    return NextResponse.json({ error: "Nothing to undo" }, { status: 422 });
  }

  const payload = lastAction.payload as Record<string, unknown>;
  const undoSequence = await getNextActionSequence(id);

  switch (lastAction.actionType) {
    case "PLAYER_REGISTERED": {
      const p = payload as { playerId: string };
      await prisma.player.delete({ where: { id: p.playerId } });
      await prisma.tournament.update({
        where: { id },
        data: {
          totalEntries: { decrement: 1 },
          prizePool: { decrement: tournament.buyInAmount },
        },
      });
      break;
    }

    case "PLAYER_ELIMINATED": {
      const p = payload as {
        player: { id: string; status: string; tableId: string | null; seatNumber: number | null; finishPosition: number | null; eliminatedAt: string | null };
        tournament: { prizePool: number; totalEntries: number };
      };
      await prisma.player.update({
        where: { id: p.player.id },
        data: {
          status: "ACTIVE",
          tableId: p.player.tableId,
          seatNumber: p.player.seatNumber,
          finishPosition: null,
          eliminatedAt: null,
        },
      });
      break;
    }

    case "REBUY": {
      const p = payload as { player: { id: string; rebuys: number; chipCount: number | null }; buyInAmount: number };
      await prisma.player.update({
        where: { id: p.player.id },
        data: { rebuys: p.player.rebuys, chipCount: p.player.chipCount },
      });
      await prisma.tournament.update({
        where: { id },
        data: {
          totalRebuys: { decrement: 1 },
          prizePool: { decrement: p.buyInAmount },
        },
      });
      break;
    }

    case "ADD_ON": {
      const p = payload as { player: { id: string; addOns: number }; addOnAmount: number };
      await prisma.player.update({
        where: { id: p.player.id },
        data: { addOns: p.player.addOns },
      });
      await prisma.tournament.update({
        where: { id },
        data: {
          totalAddOns: { decrement: 1 },
          prizePool: { decrement: p.addOnAmount },
        },
      });
      break;
    }

    case "LEVEL_ADVANCE": {
      const p = payload as {
        previousLevelIndex: number;
        previousStatus: string;
        previousLevelStartedAt: string | null;
      };
      await prisma.tournament.update({
        where: { id },
        data: {
          currentLevelIndex: p.previousLevelIndex,
          status: p.previousStatus as never,
          levelStartedAt: p.previousLevelStartedAt
            ? BigInt(p.previousLevelStartedAt)
            : null,
        },
      });
      break;
    }

    case "PLAYER_MOVED": {
      const p = payload as { playerId: string; fromTableId: string | null; fromSeat: number | null };
      await prisma.player.update({
        where: { id: p.playerId },
        data: { tableId: p.fromTableId, seatNumber: p.fromSeat },
      });
      break;
    }

    default:
      return NextResponse.json(
        { error: `Cannot undo action type: ${lastAction.actionType}` },
        { status: 422 }
      );
  }

  // Mark original action as reversed
  await prisma.actionLog.update({
    where: { tournamentId_sequence: { tournamentId: id, sequence: lastAction.sequence } },
    data: { reversedBy: undoSequence },
  });

  // Write undo log entry
  await prisma.actionLog.create({
    data: {
      tournamentId: id,
      sequence: undoSequence,
      actionType: "UNDO",
      payload: { undoneSequence: lastAction.sequence, undoneAction: lastAction.actionType },
    },
  });

  const updated = await prisma.tournament.findUnique({
    where: { id },
    include: {
      blindLevels: { orderBy: { levelIndex: "asc" } },
      players: { orderBy: { registeredAt: "asc" } },
      tables: { include: { players: true }, orderBy: { tableNumber: "asc" } },
    },
  });

  return NextResponse.json({ tournament: updated, undone: lastAction.actionType });
}

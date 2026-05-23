import { prisma } from "@/lib/prisma";

export async function getNextActionSequence(tournamentId: string): Promise<number> {
  const last = await prisma.actionLog.findFirst({
    where: { tournamentId },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });
  return (last?.sequence ?? 0) + 1;
}

export async function logAction(
  tournamentId: string,
  actionType: string,
  payload: object
) {
  const sequence = await getNextActionSequence(tournamentId);
  return prisma.actionLog.create({
    data: { tournamentId, sequence, actionType, payload },
  });
}

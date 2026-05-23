import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const tournaments = await prisma.tournament.findMany({
    where: { hostId: session!.user!.id! },
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Tournaments</h1>
        <Link
          href="/dashboard/tournaments/new"
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          + New Tournament
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <div className="text-4xl mb-4">🃏</div>
          <p className="text-lg mb-2">No tournaments yet</p>
          <p className="text-sm">Create your first tournament to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tournaments.map((t: typeof tournaments[number]) => (
            <Link
              key={t.id}
              href={`/dashboard/tournaments/${t.id}`}
              className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg">{t.name}</h2>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    {t.totalEntries} players · Prize pool: $
                    {(t.prizePool / 100).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    SETUP: "bg-zinc-700 text-zinc-300",
    REGISTERING: "bg-blue-900 text-blue-300",
    RUNNING: "bg-green-900 text-green-300",
    PAUSED: "bg-yellow-900 text-yellow-300",
    BREAK: "bg-orange-900 text-orange-300",
    COMPLETE: "bg-zinc-800 text-zinc-400",
  };
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors[status] ?? "bg-zinc-700 text-zinc-300"}`}
    >
      {status}
    </span>
  );
}

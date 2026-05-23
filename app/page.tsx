import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg tracking-tight">Poker Host</span>
        <nav>
          {session ? (
            <Link
              href="/dashboard"
              className="text-sm bg-green-600 hover:bg-green-500 px-4 py-2 rounded-md font-medium transition-colors"
            >
              My Tournaments
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="text-sm bg-white text-zinc-950 hover:bg-zinc-100 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Host Sign In
            </Link>
          )}
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center gap-8 py-20">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Run your poker tournament,{" "}
            <span className="text-green-400">stress-free.</span>
          </h1>
          <p className="text-xl text-zinc-400 leading-relaxed">
            Live blind clock, multi-table balancing, automatic payouts, and a
            shareable spectator view. No app required for players — just share a
            link.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/signin"
            className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold text-lg transition-colors"
          >
            Start a Tournament
          </Link>
          <Link
            href="#features"
            className="px-8 py-3 border border-zinc-700 hover:border-zinc-500 rounded-lg font-semibold text-lg transition-colors"
          >
            See Features
          </Link>
        </div>

        <div
          id="features"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mt-8 text-left"
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-800 px-6 py-4 text-center text-sm text-zinc-600">
        Poker Host — built for home game warriors
      </footer>
    </div>
  );
}

const features = [
  {
    icon: "⏱",
    title: "Live Blind Clock",
    desc: "Real-time countdown with automatic level advancement. Works across all your devices in sync.",
  },
  {
    icon: "🎲",
    title: "Multi-Table Support",
    desc: "Balanced seating, rebalancing alerts, and automatic Final Table detection.",
  },
  {
    icon: "📺",
    title: "Spectator View",
    desc: "Shareable read-only URL with QR code. TV-friendly layout for the big screen.",
  },
  {
    icon: "💰",
    title: "Auto Payouts",
    desc: "Prize pool calculates in real time. Supports chop deals and custom structures.",
  },
  {
    icon: "↩️",
    title: "Full Undo",
    desc: "Made a mistake? Undo any action — elimination, rebuy, seat move — instantly.",
  },
  {
    icon: "📱",
    title: "Zero Friction",
    desc: "Players and spectators need no account. Works on any phone, tablet, or TV.",
  },
];

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg tracking-tight hover:text-green-400 transition-colors">
          Poker Host
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{session.user.email}</span>
          <Link
            href="/api/auth/signout"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Sign out
          </Link>
        </div>
      </header>
      <main className="px-4 py-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}

import { auth } from "@/auth";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  return auth(req as Parameters<typeof auth>[0]);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/tournaments/:path*"],
};

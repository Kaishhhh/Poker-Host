import { NextResponse } from "next/server";

// NextResponse.json uses JSON.stringify which can't handle BigInt.
// Use this instead for any response that may contain tournament data.
export function jsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  const body = JSON.stringify(data, (_, v) =>
    typeof v === "bigint" ? Number(v) : v
  );
  return new NextResponse(body, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

import { NextResponse } from "next/server";
import { clearToken } from "@/lib/auth/token-store";

/** POST /api/auth/logout → forget the stored Upwork tokens. */
export async function POST() {
  await clearToken();
  return NextResponse.json({ ok: true });
}

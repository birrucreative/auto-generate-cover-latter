import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/upwork/oauth";
import { consumeOauthState, saveToken } from "@/lib/auth/token-store";

/**
 * GET /api/auth/callback?code=...&state=...
 * Upwork redirects here after the user grants access. We verify the CSRF state,
 * exchange the code for tokens, store them, then bounce back to the app.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const home = new URL("/", url.origin);

  if (error) {
    home.searchParams.set("auth", "denied");
    return NextResponse.redirect(home);
  }
  if (!code || !state) {
    home.searchParams.set("auth", "invalid");
    return NextResponse.redirect(home);
  }

  const expected = await consumeOauthState();
  if (!expected || expected !== state) {
    home.searchParams.set("auth", "state_mismatch");
    return NextResponse.redirect(home);
  }

  try {
    const token = await exchangeCodeForToken(code);
    await saveToken(token);
    home.searchParams.set("auth", "connected");
  } catch {
    home.searchParams.set("auth", "error");
  }
  return NextResponse.redirect(home);
}

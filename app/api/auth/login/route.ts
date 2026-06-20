import { NextResponse } from "next/server";
import { buildAuthorizeUrl, UpworkAuthError } from "@/lib/upwork/oauth";
import { randomState } from "@/lib/auth/crypto";
import { saveOauthState } from "@/lib/auth/token-store";

/** GET /api/auth/login → redirect the user to Upwork's consent screen. */
export async function GET() {
  try {
    const state = randomState();
    await saveOauthState(state);
    return NextResponse.redirect(buildAuthorizeUrl(state));
  } catch (err) {
    const message =
      err instanceof UpworkAuthError ? err.message : "Failed to start OAuth flow.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

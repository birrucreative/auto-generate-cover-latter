import { NextResponse } from "next/server";
import { getConfig, demoModeReason } from "@/lib/config";
import { isLiveReady } from "@/lib/upwork";

/**
 * GET /api/auth/status → tells the UI whether we're connected to the real API,
 * running in demo mode, or configured-but-not-yet-authorized.
 */
export async function GET() {
  const cfg = getConfig();
  const connected = await isLiveReady();

  return NextResponse.json({
    demoMode: cfg.demoMode,
    demoReason: demoModeReason(cfg),
    /** Credentials present but the OAuth flow hasn't been completed yet. */
    credentialsConfigured: Boolean(cfg.clientId && cfg.clientSecret),
    connected,
  });
}

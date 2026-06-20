/**
 * Centralized, server-only configuration.
 *
 * IMPORTANT: this module reads secrets from process.env and must NEVER be
 * imported into a client component. All consumers live under lib/upwork or in
 * route handlers (server runtime only).
 */

import "server-only";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export interface AppConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri: string;
  tenantId?: string;
  authSecret: string;
  /**
   * When true, the app serves dummy data and never calls the real Upwork API.
   * Turns on automatically if credentials are missing, OR when explicitly set
   * via UPWORK_DEMO_MODE=true.
   */
  demoMode: boolean;
}

export function getConfig(): AppConfig {
  const clientId = env("UPWORK_CLIENT_ID");
  const clientSecret = env("UPWORK_CLIENT_SECRET");

  const explicit = env("UPWORK_DEMO_MODE");
  const credentialsMissing = !clientId || !clientSecret;

  // Demo mode if explicitly requested, OR if we simply can't reach the API.
  const demoMode =
    explicit === "true" || (explicit !== "false" && credentialsMissing);

  return {
    clientId,
    clientSecret,
    redirectUri:
      env("UPWORK_REDIRECT_URI") ?? "http://localhost:3000/api/auth/callback",
    tenantId: env("UPWORK_TENANT_ID"),
    authSecret: env("AUTH_SECRET") ?? "dev-insecure-secret-change-me",
    demoMode,
  };
}

/** Human-readable reason demo mode is on, for surfacing in the UI/logs. */
export function demoModeReason(cfg: AppConfig): string | null {
  if (!cfg.demoMode) return null;
  if (!cfg.clientId || !cfg.clientSecret) {
    return "No Upwork API credentials found — running with demo data.";
  }
  return "UPWORK_DEMO_MODE=true — running with demo data.";
}

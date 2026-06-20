/**
 * Upwork OAuth2 (Authorization Code grant).
 *
 * Flow:
 *   1. buildAuthorizeUrl()  → redirect the user to Upwork's consent screen.
 *   2. Upwork redirects back to UPWORK_REDIRECT_URI with ?code & ?state.
 *   3. exchangeCodeForToken(code) → access + refresh tokens.
 *   4. refreshAccessToken(refreshToken) when the access token expires.
 *
 * Verified against the official Upwork OAuth2 SDKs.
 * Server-only.
 */

import "server-only";
import { getConfig } from "../config";
import { UPWORK } from "./constants";
import type { StoredToken } from "../auth/token-store";

interface UpworkTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  /** Lifetime of the access token in seconds. */
  expires_in: number;
}

export class UpworkAuthError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "UpworkAuthError";
  }
}

/** Build the consent-screen URL. Pass a CSRF `state` you also store in a cookie. */
export function buildAuthorizeUrl(state: string): string {
  const cfg = getConfig();
  if (!cfg.clientId) {
    throw new UpworkAuthError("UPWORK_CLIENT_ID is not configured.");
  }
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    state,
  });
  return `${UPWORK.AUTHORIZE_URL}?${params.toString()}`;
}

function toStoredToken(res: UpworkTokenResponse, tenantId?: string): StoredToken {
  return {
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
    // Refresh 60s early to avoid races against expiry.
    expiresAt: Date.now() + (res.expires_in - 60) * 1000,
    tenantId,
  };
}

async function postToken(body: URLSearchParams): Promise<UpworkTokenResponse> {
  const res = await fetch(UPWORK.TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new UpworkAuthError(
      `Token request failed (${res.status}): ${text.slice(0, 300)}`,
      res.status
    );
  }
  try {
    return JSON.parse(text) as UpworkTokenResponse;
  } catch {
    throw new UpworkAuthError(`Unexpected token response: ${text.slice(0, 200)}`);
  }
}

export async function exchangeCodeForToken(code: string): Promise<StoredToken> {
  const cfg = getConfig();
  if (!cfg.clientId || !cfg.clientSecret) {
    throw new UpworkAuthError("Upwork client credentials are not configured.");
  }
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
  });
  return toStoredToken(await postToken(body), cfg.tenantId);
}

export async function refreshAccessToken(
  current: StoredToken
): Promise<StoredToken> {
  const cfg = getConfig();
  if (!cfg.clientId || !cfg.clientSecret) {
    throw new UpworkAuthError("Upwork client credentials are not configured.");
  }
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: current.refreshToken,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  });
  const refreshed = toStoredToken(await postToken(body), current.tenantId);
  // Upwork may not re-issue a refresh token; keep the old one if so.
  if (!refreshed.refreshToken) {
    refreshed.refreshToken = current.refreshToken;
  }
  return refreshed;
}

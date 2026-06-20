/**
 * OAuth token storage backed by an encrypted, httpOnly cookie.
 *
 * We keep the Upwork access/refresh tokens server-side only, encrypted with
 * AUTH_SECRET, so they never reach client JavaScript. Server-only.
 */

import "server-only";
import { cookies } from "next/headers";
import { decrypt, encrypt } from "./crypto";
import { getConfig } from "../config";

const COOKIE_NAME = "upwork_token";
const STATE_COOKIE = "upwork_oauth_state";

export interface StoredToken {
  accessToken: string;
  refreshToken: string;
  /** Epoch millis when the access token expires. */
  expiresAt: number;
  /** Optional organization/tenant id captured at auth time. */
  tenantId?: string;
}

export async function saveToken(token: StoredToken): Promise<void> {
  const { authSecret } = getConfig();
  const jar = await cookies();
  jar.set(COOKIE_NAME, encrypt(JSON.stringify(token), authSecret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days; refresh token lives here
  });
}

export async function readToken(): Promise<StoredToken | null> {
  const { authSecret } = getConfig();
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const json = decrypt(raw, authSecret);
  if (!json) return null;
  try {
    return JSON.parse(json) as StoredToken;
  } catch {
    return null;
  }
}

export async function clearToken(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/* ───────────── OAuth CSRF `state` round-trip ───────────── */

export async function saveOauthState(state: string): Promise<void> {
  const jar = await cookies();
  jar.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes to complete the round-trip
  });
}

export async function consumeOauthState(): Promise<string | null> {
  const jar = await cookies();
  const v = jar.get(STATE_COOKIE)?.value ?? null;
  if (v) jar.delete(STATE_COOKIE);
  return v;
}

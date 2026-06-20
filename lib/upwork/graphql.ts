/**
 * Authenticated GraphQL transport for the Upwork API.
 *
 * Responsibilities:
 *   - Attach the bearer token + optional tenant header.
 *   - Transparently refresh an expired access token (once) and retry.
 *   - Surface GraphQL + HTTP + rate-limit errors as typed exceptions.
 *
 * Server-only.
 */

import "server-only";
import { UPWORK } from "./constants";
import { refreshAccessToken } from "./oauth";
import {
  readToken,
  saveToken,
  clearToken,
  type StoredToken,
} from "../auth/token-store";

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not connected to Upwork. Complete the OAuth flow first.");
    this.name = "NotAuthenticatedError";
  }
}

export class UpworkApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly graphqlErrors?: unknown
  ) {
    super(message);
    this.name = "UpworkApiError";
  }
}

export class RateLimitError extends UpworkApiError {
  constructor(readonly retryAfterSeconds: number | null) {
    super("Upwork API rate limit reached.", 429);
    this.name = "RateLimitError";
  }
}

/** Thrown when the API key lacks the scopes needed for job search. */
export class PermissionScopeError extends UpworkApiError {
  constructor(message: string) {
    super(message, 200);
    this.name = "PermissionScopeError";
  }
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

async function rawRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  token: StoredToken
): Promise<{ status: number; json: GraphQLResponse<T> | null; text: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `bearer ${token.accessToken}`,
  };
  if (token.tenantId) headers[UPWORK.TENANT_HEADER] = token.tenantId;

  const res = await fetch(UPWORK.GRAPHQL_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const text = await res.text();
  let json: GraphQLResponse<T> | null = null;
  try {
    json = JSON.parse(text) as GraphQLResponse<T>;
  } catch {
    /* non-JSON error body (e.g. HTML 5xx) */
  }
  return { status: res.status, json, text };
}

/** Ensure we have a non-expired token, refreshing + persisting if needed. */
async function ensureFreshToken(): Promise<StoredToken> {
  let token = await readToken();
  if (!token) throw new NotAuthenticatedError();

  if (Date.now() >= token.expiresAt) {
    token = await refreshAccessToken(token);
    await saveToken(token);
  }
  return token;
}

/**
 * Execute a GraphQL operation against the Upwork API.
 * Retries exactly once on a 401 by forcing a token refresh.
 */
export async function upworkGraphql<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  let token = await ensureFreshToken();

  let { status, json, text } = await rawRequest<T>(query, variables, token);

  // Token may have been revoked/expired server-side → refresh once and retry.
  if (status === 401) {
    try {
      token = await refreshAccessToken(token);
      await saveToken(token);
    } catch (err) {
      await clearToken();
      throw new NotAuthenticatedError();
    }
    ({ status, json, text } = await rawRequest<T>(query, variables, token));
  }

  if (status === 429) {
    // Upwork doesn't always send Retry-After; caller can back off.
    throw new RateLimitError(null);
  }

  if (status >= 400 || !json) {
    throw new UpworkApiError(
      `Upwork API HTTP ${status}: ${text.slice(0, 300)}`,
      status
    );
  }

  if (json.errors && json.errors.length > 0) {
    // Upwork returns HTTP 200 with errors[] for GraphQL/permission failures.
    const combined = json.errors.map((e) => e.message).join("; ");
    if (/permission|scope/i.test(combined)) {
      throw new PermissionScopeError(
        `Your Upwork API key is missing required scopes. Ensure it has "Common Entities - Read-Only Access" and marketplace job-posting read access. (${combined})`
      );
    }
    throw new UpworkApiError(combined, status, json.errors);
  }

  if (json.data === undefined) {
    throw new UpworkApiError("Upwork API returned no data.", status);
  }
  return json.data;
}

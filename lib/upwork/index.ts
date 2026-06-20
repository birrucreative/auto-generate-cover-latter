/**
 * Provider facade.
 *
 * The single entry point the rest of the app uses to search jobs. It transparently
 * routes to the live Upwork client or the demo provider based on config, and
 * gracefully falls back to demo data if a live call fails (e.g. not yet connected).
 *
 * Server-only.
 */

import "server-only";
import type { Job, JobSearchParams, JobSearchResult } from "../types";
import { getConfig } from "../config";
import { demoSearch, demoJobById } from "./demo";
import { searchJobsLive, getJobLive } from "./client";
import { readToken } from "../auth/token-store";
import { NotAuthenticatedError } from "./graphql";

export interface SearchOptions {
  /** Inject a synthesized fresh posting in demo mode (used by polling). */
  includeFresh?: boolean;
}

/** True when the live Upwork API is usable right now (config + a stored token). */
export async function isLiveReady(): Promise<boolean> {
  const cfg = getConfig();
  if (cfg.demoMode || !cfg.clientId || !cfg.clientSecret) return false;
  return (await readToken()) !== null;
}

export async function searchJobs(
  params: JobSearchParams,
  opts: SearchOptions = {}
): Promise<JobSearchResult> {
  const cfg = getConfig();

  if (cfg.demoMode) {
    return demoSearch(params, opts);
  }

  try {
    return await searchJobsLive(params);
  } catch (err) {
    // Not connected yet → fall back to demo so the UI still works, but make the
    // fallback visible (source stays "demo") and re-throw genuine API errors.
    if (err instanceof NotAuthenticatedError) {
      return demoSearch(params, opts);
    }
    throw err;
  }
}

export async function getJob(id: string): Promise<Job | null> {
  const cfg = getConfig();
  if (cfg.demoMode) return demoJobById(id);

  try {
    return await getJobLive(id);
  } catch (err) {
    if (err instanceof NotAuthenticatedError) return demoJobById(id);
    throw err;
  }
}

/**
 * Pure helpers for the auto-refresh / polling feature.
 *
 * The UI polls the search endpoint on an interval; these functions compute what
 * is *new* between two result sets so we can highlight and notify, without any
 * stateful machinery in the component.
 */

import type { Job } from "./types";

export interface PollDiff {
  /** Jobs present now that were not in the previous set (by id). */
  newJobs: Job[];
  /** Ids that existed before and still exist (unchanged). */
  seenIds: string[];
  /** Merged list: new jobs first, then the previous jobs, deduped by id. */
  merged: Job[];
}

/**
 * Compare a freshly fetched list against the previously known ids.
 * `knownIds` is the set of job ids the user has already seen.
 */
export function diffJobs(
  fresh: Job[],
  knownIds: Iterable<string>,
  previous: Job[] = []
): PollDiff {
  const known = new Set(knownIds);
  const newJobs = fresh.filter((j) => !known.has(j.id));

  const mergedMap = new Map<string, Job>();
  for (const j of newJobs) mergedMap.set(j.id, j);
  for (const j of fresh) if (!mergedMap.has(j.id)) mergedMap.set(j.id, j);
  for (const j of previous) if (!mergedMap.has(j.id)) mergedMap.set(j.id, j);

  return {
    newJobs,
    seenIds: fresh.filter((j) => known.has(j.id)).map((j) => j.id),
    merged: [...mergedMap.values()],
  };
}

/** Clamp a user-supplied polling interval to a sane, API-friendly range. */
export function normalizePollInterval(
  seconds: number,
  { min = 30, max = 3600 } = {}
): number {
  if (!Number.isFinite(seconds)) return min;
  return Math.min(max, Math.max(min, Math.round(seconds)));
}

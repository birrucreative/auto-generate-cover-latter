/**
 * Pure filtering & sorting over normalized jobs.
 *
 * Used by the demo provider to emulate Upwork-side filtering, and available
 * for optional client-side refinement of real API results.
 */

import type { Job, JobSearchParams, SortKey } from "./types";

/** Effective budget value used for min/max comparisons (USD). */
function budgetValue(job: Job): number | null {
  const r = job.type === "hourly" ? job.hourlyBudget : job.fixedBudget;
  if (!r) return null;
  // Compare against the upper bound so a "$50–$200" job passes a "min $100" filter.
  return r.max ?? r.min;
}

function matchesQuery(job: Job, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  // Split on whitespace; every term must appear somewhere (AND semantics).
  const haystack = [
    job.title,
    job.description,
    job.category ?? "",
    job.subcategory ?? "",
    job.skills.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((term) => haystack.includes(term));
}

export function applyFilters(jobs: Job[], params: JobSearchParams): Job[] {
  const nowMs = Date.now();

  return jobs.filter((job) => {
    if (params.query && !matchesQuery(job, params.query)) return false;

    if (params.jobType && params.jobType !== "all" && job.type !== params.jobType) {
      return false;
    }

    if (
      params.experienceLevel &&
      params.experienceLevel !== "all" &&
      job.experienceLevel !== params.experienceLevel
    ) {
      return false;
    }

    if (params.category && job.category !== params.category) return false;

    if (params.budgetMin != null || params.budgetMax != null) {
      const v = budgetValue(job);
      if (v == null) return false;
      if (params.budgetMin != null && v < params.budgetMin) return false;
      if (params.budgetMax != null && v > params.budgetMax) return false;
    }

    if (params.paymentVerifiedOnly && job.client.paymentVerified !== true) {
      return false;
    }

    if (params.clientCountries && params.clientCountries.length > 0) {
      if (
        !job.client.country ||
        !params.clientCountries.includes(job.client.country)
      ) {
        return false;
      }
    }

    if (params.postedWithinHours != null) {
      const postedMs = new Date(job.postedAt).getTime();
      const ageHours = (nowMs - postedMs) / 3_600_000;
      if (Number.isFinite(ageHours) && ageHours > params.postedWithinHours) {
        return false;
      }
    }

    if (params.skills && params.skills.length > 0) {
      const jobSkills = new Set(job.skills.map((s) => s.toLowerCase()));
      const wantsAll = params.skills.every((s) => jobSkills.has(s.toLowerCase()));
      if (!wantsAll) return false;
    }

    return true;
  });
}

export function sortJobs(jobs: Job[], sort: SortKey = "recency"): Job[] {
  const copy = [...jobs];
  switch (sort) {
    case "recency":
      return copy.sort(
        (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
      );
    case "clientSpend":
      return copy.sort(
        (a, b) => (b.client.totalSpent ?? 0) - (a.client.totalSpent ?? 0)
      );
    case "relevance":
    default:
      // Without a real relevance score, keep provider order.
      return copy;
  }
}

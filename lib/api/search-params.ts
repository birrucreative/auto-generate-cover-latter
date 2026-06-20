/**
 * Parse & validate job-search parameters from a request (query string or JSON
 * body) into our typed JobSearchParams. Centralized so every route validates
 * identically.
 */

import { z } from "zod";
import type { JobSearchParams } from "../types";

const jobType = z.enum(["hourly", "fixed", "unknown", "all"]);
const experience = z.enum(["entry", "intermediate", "expert", "unknown", "all"]);
const sort = z.enum(["recency", "relevance", "clientSpend"]);

/** Coerce a possibly-string value to number, dropping NaN. */
const numeric = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? v : Number.parseFloat(v)))
  .refine((v) => Number.isFinite(v), "must be a number");

/** Accept either an array or a comma-separated string → string[]. */
const stringList = z
  .union([z.string(), z.array(z.string())])
  .transform((v) =>
    (Array.isArray(v) ? v : v.split(","))
      .map((s) => s.trim())
      .filter(Boolean)
  );

export const searchParamsSchema = z
  .object({
    query: z.string().trim().optional(),
    jobType: jobType.optional(),
    category: z.string().trim().optional(),
    budgetMin: numeric.optional(),
    budgetMax: numeric.optional(),
    experienceLevel: experience.optional(),
    clientCountries: stringList.optional(),
    paymentVerifiedOnly: z
      .union([z.boolean(), z.string()])
      .transform((v) => v === true || v === "true" || v === "1")
      .optional(),
    postedWithinHours: numeric.optional(),
    skills: stringList.optional(),
    sort: sort.optional(),
    cursor: z.string().optional(),
    limit: numeric.pipe(z.number().min(1).max(50)).optional(),
  })
  .strip();

export function parseSearchParams(input: unknown): JobSearchParams {
  return searchParamsSchema.parse(input) as JobSearchParams;
}

/** Build a plain object from URLSearchParams, collapsing repeats into arrays. */
export function searchParamsToObject(sp: URLSearchParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(sp.keys())) {
    const all = sp.getAll(key);
    out[key] = all.length > 1 ? all : all[0];
  }
  return out;
}

/**
 * Export helpers — turn normalized jobs into CSV / JSON for download.
 * Pure functions, usable on both server and client.
 */

import type { Job } from "./types";

/** Columns exported to CSV, in order. */
const CSV_COLUMNS: { header: string; get: (j: Job) => string }[] = [
  { header: "id", get: (j) => j.id },
  { header: "title", get: (j) => j.title },
  { header: "type", get: (j) => j.type },
  { header: "budget", get: (j) => formatBudget(j) },
  { header: "posted_at", get: (j) => j.postedAt },
  { header: "category", get: (j) => j.category ?? "" },
  { header: "experience_level", get: (j) => j.experienceLevel },
  { header: "duration", get: (j) => j.duration ?? "" },
  { header: "workload", get: (j) => j.workload ?? "" },
  { header: "proposals", get: (j) => j.proposals ?? "" },
  { header: "skills", get: (j) => j.skills.join("; ") },
  { header: "client_country", get: (j) => j.client.country ?? "" },
  {
    header: "client_total_spent",
    get: (j) => (j.client.totalSpent != null ? String(j.client.totalSpent) : ""),
  },
  {
    header: "client_rating",
    get: (j) => (j.client.rating != null ? j.client.rating.toFixed(2) : ""),
  },
  {
    header: "client_payment_verified",
    get: (j) =>
      j.client.paymentVerified == null
        ? ""
        : j.client.paymentVerified
        ? "yes"
        : "no",
  },
  { header: "url", get: (j) => j.url },
];

function formatBudget(j: Job): string {
  const r = j.type === "hourly" ? j.hourlyBudget : j.fixedBudget;
  if (!r) return "";
  const suffix = j.type === "hourly" ? "/hr" : "";
  if (r.min != null && r.max != null && r.min !== r.max) {
    return `${r.currency} ${r.min}-${r.max}${suffix}`;
  }
  const v = r.min ?? r.max;
  return v != null ? `${r.currency} ${v}${suffix}` : "";
}

/** RFC-4180 CSV escaping. */
function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Build a CSV string. Prefixed with a UTF-8 BOM so Excel opens it with correct
 * encoding (accents, currency symbols, etc.).
 */
export function jobsToCsv(jobs: Job[]): string {
  const head = CSV_COLUMNS.map((c) => csvCell(c.header)).join(",");
  const rows = jobs.map((j) =>
    CSV_COLUMNS.map((c) => csvCell(c.get(j))).join(",")
  );
  return "﻿" + [head, ...rows].join("\r\n");
}

/** Pretty JSON of the jobs (raw provider payload stripped to keep it small). */
export function jobsToJson(jobs: Job[]): string {
  const clean = jobs.map(({ raw: _raw, ...rest }) => rest);
  return JSON.stringify(clean, null, 2);
}

export type ExportFormat = "csv" | "json";

export interface ExportPayload {
  body: string;
  contentType: string;
  filename: string;
}

export function buildExport(
  jobs: Job[],
  format: ExportFormat,
  /** Pass a timestamp from the caller — keeps this function pure/testable. */
  isoTimestamp: string
): ExportPayload {
  const stamp = isoTimestamp.replace(/[:.]/g, "-");
  if (format === "json") {
    return {
      body: jobsToJson(jobs),
      contentType: "application/json; charset=utf-8",
      filename: `upwork-jobs-${stamp}.json`,
    };
  }
  return {
    body: jobsToCsv(jobs),
    contentType: "text/csv; charset=utf-8",
    filename: `upwork-jobs-${stamp}.csv`,
  };
}

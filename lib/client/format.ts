/** Presentation helpers for the client UI. Pure, no side effects. */

import type { Job } from "../types";

/** "7m ago", "3h ago", "2d ago", or a date for older posts. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Compact money: 86000 → "$86k", 1500 → "$1.5k", 420 → "$420". */
export function compactMoney(value: number | null, currency = "USD"): string {
  if (value == null) return "—";
  const sym = currency === "USD" ? "$" : `${currency} `;
  if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) {
    const k = value / 1_000;
    return `${sym}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `${sym}${value}`;
}

/** Human budget label for a job card / detail header. */
export function budgetLabel(job: Job): string {
  if (job.type === "hourly") {
    const r = job.hourlyBudget;
    if (!r) return "Hourly";
    const c = r.currency === "USD" ? "$" : `${r.currency} `;
    if (r.min != null && r.max != null && r.min !== r.max)
      return `${c}${r.min}–${r.max}/hr`;
    const v = r.min ?? r.max;
    return v != null ? `${c}${v}/hr` : "Hourly";
  }
  const r = job.fixedBudget;
  if (!r) return "Fixed price";
  const c = r.currency === "USD" ? "$" : `${r.currency} `;
  const v = r.max ?? r.min;
  return v != null ? `${c}${v.toLocaleString()}` : "Fixed price";
}

const EXPERIENCE_LABEL: Record<string, string> = {
  entry: "Entry",
  intermediate: "Intermediate",
  expert: "Expert",
  unknown: "—",
};

export function experienceLabel(level: string): string {
  return EXPERIENCE_LABEL[level] ?? level;
}

const STATUS_LABEL: Record<string, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  rejected: "Rejected",
  hired: "Hired",
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

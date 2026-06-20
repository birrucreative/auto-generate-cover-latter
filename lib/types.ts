/**
 * Normalized domain types.
 *
 * These are OUR types — deliberately independent of Upwork's raw GraphQL wire
 * format. The Upwork client (lib/upwork/client.ts) maps the raw API response
 * into these shapes, so the rest of the app (UI, bookmarks, export, polling)
 * never depends on Upwork's exact field names. If Upwork changes its schema,
 * only the mapper changes.
 */

export type JobType = "hourly" | "fixed" | "unknown";

export type ExperienceLevel =
  | "entry"
  | "intermediate"
  | "expert"
  | "unknown";

export interface MoneyRange {
  /** Lower bound (inclusive). null when open-ended or not provided. */
  min: number | null;
  /** Upper bound (inclusive). null when open-ended or not provided. */
  max: number | null;
  /** ISO-4217 currency code, e.g. "USD". */
  currency: string;
}

export interface ClientInfo {
  country: string | null;
  city: string | null;
  /** Total amount the client has spent on Upwork, in USD. */
  totalSpent: number | null;
  totalHires: number | null;
  /** Average feedback score, 0–5. */
  rating: number | null;
  reviewsCount: number | null;
  paymentVerified: boolean | null;
  /** Total number of jobs the client has posted. */
  totalJobsPosted: number | null;
  /** Percentage of jobs that resulted in a hire, 0–100. */
  hireRate: number | null;
}

/**
 * The canonical job shape used everywhere in the app.
 */
export interface Job {
  /** Stable unique id (Upwork ciphertext / job key, or demo id). */
  id: string;
  title: string;
  description: string;
  /** Public URL to the job posting on upwork.com. */
  url: string;

  type: JobType;
  /** For fixed-price jobs: the budget. null for hourly jobs. */
  fixedBudget: MoneyRange | null;
  /** For hourly jobs: the hourly rate range. null for fixed jobs. */
  hourlyBudget: MoneyRange | null;

  /** ISO-8601 timestamp of when the job was posted. */
  postedAt: string;

  category: string | null;
  subcategory: string | null;
  skills: string[];

  experienceLevel: ExperienceLevel;
  /** Human-readable engagement / duration, e.g. "1 to 3 months". */
  duration: string | null;
  /** Estimated workload, e.g. "Less than 30 hrs/week". */
  workload: string | null;

  /** Number of proposals already submitted (bucketed range string if exact unknown). */
  proposals: string | null;
  client: ClientInfo;

  /** Raw provider payload kept for debugging / future fields. Never rendered directly. */
  raw?: unknown;
}

/* ─────────────────────────────  Search  ───────────────────────────── */

export type SortKey = "recency" | "relevance" | "clientSpend";

export interface JobSearchParams {
  /** Free-text query, mapped to Upwork's search expression. */
  query?: string;
  /** Filter by job type. */
  jobType?: JobType | "all";
  category?: string;
  /** Minimum fixed budget OR minimum hourly rate (USD), inclusive. */
  budgetMin?: number;
  budgetMax?: number;
  experienceLevel?: ExperienceLevel | "all";
  /** ISO country codes the client must be located in. */
  clientCountries?: string[];
  paymentVerifiedOnly?: boolean;
  /** Only jobs posted within the last N hours. */
  postedWithinHours?: number;
  skills?: string[];
  sort?: SortKey;
  /** Pagination: opaque cursor from a previous page. */
  cursor?: string;
  /** Page size (Upwork caps this; we default to 20). */
  limit?: number;
}

export interface JobSearchResult {
  jobs: Job[];
  /** Cursor to fetch the next page, or null when there are no more results. */
  nextCursor: string | null;
  /** Total matching jobs if the provider reports it. */
  total: number | null;
  /** Where the data came from — useful for the UI to show a "DEMO" badge. */
  source: "upwork" | "demo";
  /** Server timestamp of when this result was produced (ISO-8601). */
  fetchedAt: string;
}

/* ─────────────────────────────  Bookmarks  ───────────────────────────── */

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "rejected"
  | "hired";

export interface Bookmark {
  job: Job;
  status: ApplicationStatus;
  /** Free-form user note. */
  note: string;
  /** ISO-8601 timestamp of when the job was bookmarked. */
  savedAt: string;
  /** ISO-8601 timestamp of last status/note change. */
  updatedAt: string;
}

/**
 * Live Upwork provider — calls the official GraphQL `marketplaceJobPostingsSearch`
 * query and maps the raw result into our normalized Job type.
 *
 * Query, argument names, filter fields, and node fields were extracted from the
 * official Upwork GraphQL reference:
 * https://www.upwork.com/developer/documentation/graphql/api/docs/index.html
 *
 * Filtering strategy: we send only HIGH-confidence filters to Upwork
 * (searchExpression, jobType, experienceLevel, daysPosted, verifiedPaymentOnly,
 * locations, pagination). Budget/rating/skill refinement runs client-side via
 * applyFilters() because the IntRange/FloatRange input shapes were not verifiable
 * against primary docs — sending a malformed filter would fail the whole query.
 *
 * Server-only.
 */

import "server-only";
import type {
  ExperienceLevel,
  Job,
  JobSearchParams,
  JobSearchResult,
  JobType,
  MoneyRange,
  SortKey,
} from "../types";
import { applyFilters, sortJobs } from "../filter";
import { upworkGraphql } from "./graphql";

/* ─────────────────────────── GraphQL query ─────────────────────────── */

const JOB_SEARCH_QUERY = /* GraphQL */ `
  query SearchJobs(
    $filter: MarketplaceJobPostingsSearchFilter
    $sort: [MarketplaceJobPostingSearchSortAttribute]
  ) {
    marketplaceJobPostingsSearch(
      marketPlaceJobFilter: $filter
      searchType: USER_JOBS_SEARCH
      sortAttributes: $sort
    ) {
      totalCount
      edges {
        node {
          id
          ciphertext
          title
          description
          amount { rawValue currency }
          hourlyBudgetType
          hourlyBudgetMin { rawValue currency }
          hourlyBudgetMax { rawValue currency }
          createdDateTime
          publishedDateTime
          category
          subcategory
          durationLabel
          engagement
          experienceLevel
          totalApplicants
          skills { name prettyName }
          client {
            totalHires
            totalPostedJobs
            totalReviews
            totalFeedback
            totalSpent { rawValue currency }
            verificationStatus
            location { country city }
          }
        }
      }
      pageInfo { endCursor hasNextPage }
    }
  }
`;

/* ─────────────────────────── Raw response types ─────────────────────────── */

interface RawMoney {
  rawValue: string | null;
  currency: string | null;
}
interface RawSkill {
  name: string | null;
  prettyName: string | null;
}
interface RawLocation {
  country: string | null;
  city: string | null;
}
interface RawClient {
  totalHires: number | null;
  totalPostedJobs: number | null;
  totalReviews: number | null;
  totalFeedback: number | null;
  totalSpent: RawMoney | null;
  verificationStatus: string | null;
  location: RawLocation | null;
}
interface RawNode {
  id: string;
  ciphertext: string | null;
  title: string;
  description: string;
  amount: RawMoney | null;
  hourlyBudgetType: string | null;
  hourlyBudgetMin: RawMoney | null;
  hourlyBudgetMax: RawMoney | null;
  createdDateTime: string | null;
  publishedDateTime: string | null;
  category: string | null;
  subcategory: string | null;
  durationLabel: string | null;
  engagement: string | null;
  experienceLevel: string | null;
  totalApplicants: number | null;
  skills: (RawSkill | null)[] | null;
  client: RawClient | null;
}
interface RawSearchResponse {
  marketplaceJobPostingsSearch: {
    totalCount: number | null;
    edges: ({ node: RawNode } | null)[] | null;
    pageInfo: { endCursor: string | null; hasNextPage: boolean | null } | null;
  } | null;
}

/* ─────────────────────────── Mapping helpers ─────────────────────────── */

function money(m: RawMoney | null | undefined): number | null {
  if (!m || m.rawValue == null) return null;
  const n = Number.parseFloat(m.rawValue);
  return Number.isFinite(n) ? n : null;
}

function currencyOf(...ms: (RawMoney | null | undefined)[]): string {
  for (const m of ms) if (m?.currency) return m.currency;
  return "USD";
}

function mapExperience(raw: string | null): ExperienceLevel {
  switch ((raw ?? "").toUpperCase()) {
    case "ENTRY_LEVEL":
      return "entry";
    case "INTERMEDIATE":
      return "intermediate";
    case "EXPERT":
      return "expert";
    default:
      return "unknown";
  }
}

function mapNode(node: RawNode): Job {
  const hourlyMin = money(node.hourlyBudgetMin);
  const hourlyMax = money(node.hourlyBudgetMax);
  const isHourly =
    !!node.hourlyBudgetType || hourlyMin != null || hourlyMax != null;

  const type: JobType = isHourly ? "hourly" : node.amount ? "fixed" : "unknown";

  const hourlyBudget: MoneyRange | null = isHourly
    ? {
        min: hourlyMin,
        max: hourlyMax,
        currency: currencyOf(node.hourlyBudgetMin, node.hourlyBudgetMax),
      }
    : null;

  const fixedAmount = money(node.amount);
  const fixedBudget: MoneyRange | null =
    !isHourly && fixedAmount != null
      ? { min: fixedAmount, max: fixedAmount, currency: currencyOf(node.amount) }
      : null;

  const c = node.client;
  const ciphertext = node.ciphertext ?? node.id;

  return {
    id: node.id,
    title: node.title,
    description: node.description ?? "",
    url: `https://www.upwork.com/jobs/~${ciphertext}`,
    type,
    fixedBudget,
    hourlyBudget,
    postedAt:
      node.createdDateTime ?? node.publishedDateTime ?? new Date(0).toISOString(),
    category: node.category,
    subcategory: node.subcategory,
    skills: (node.skills ?? [])
      .map((s) => s?.prettyName || s?.name || "")
      .filter((s): s is string => s.length > 0),
    experienceLevel: mapExperience(node.experienceLevel),
    duration: node.durationLabel,
    workload: node.engagement,
    proposals: node.totalApplicants != null ? String(node.totalApplicants) : null,
    client: {
      country: c?.location?.country ?? null,
      city: c?.location?.city ?? null,
      totalSpent: money(c?.totalSpent),
      totalHires: c?.totalHires ?? null,
      rating: c?.totalFeedback ?? null,
      reviewsCount: c?.totalReviews ?? null,
      paymentVerified:
        c?.verificationStatus == null
          ? null
          : c.verificationStatus.toUpperCase() === "VERIFIED",
      totalJobsPosted: c?.totalPostedJobs ?? null,
      hireRate: null, // not exposed by the search node
    },
    raw: node,
  };
}

/* ─────────────────────────── Filter / sort mapping ─────────────────────────── */

function mapSort(sort: SortKey = "recency") {
  const field =
    sort === "relevance"
      ? "RELEVANCE"
      : sort === "clientSpend"
      ? "CLIENT_TOTAL_CHARGE"
      : "RECENCY";
  return [{ field }];
}

function mapExperienceToEnum(level?: ExperienceLevel | "all"): string | undefined {
  switch (level) {
    case "entry":
      return "ENTRY_LEVEL";
    case "intermediate":
      return "INTERMEDIATE";
    case "expert":
      return "EXPERT";
    default:
      return undefined;
  }
}

/** Build the server-side filter using only high-confidence fields. */
function buildFilter(params: JobSearchParams) {
  const limit = params.limit ?? 20;
  const after = params.cursor ?? "0";

  const filter: Record<string, unknown> = {
    pagination_eq: { after, first: limit },
  };

  if (params.query) filter.searchExpression_eq = params.query;
  if (params.skills && params.skills.length > 0) {
    filter.skillExpression_eq = params.skills.join(" ");
  }
  if (params.jobType && params.jobType !== "all" && params.jobType !== "unknown") {
    filter.jobType_eq = params.jobType.toUpperCase(); // HOURLY | FIXED
  }
  const exp = mapExperienceToEnum(params.experienceLevel);
  if (exp) filter.experienceLevel_eq = exp;
  if (params.paymentVerifiedOnly) filter.verifiedPaymentOnly_eq = true;
  if (params.clientCountries && params.clientCountries.length > 0) {
    filter.locations_any = params.clientCountries;
  }
  if (params.postedWithinHours != null) {
    // API granularity is whole days; round up so we never exclude valid jobs.
    filter.daysPosted_eq = Math.max(1, Math.ceil(params.postedWithinHours / 24));
  }

  return filter;
}

/* ─────────────────────────── Public API ─────────────────────────── */

export async function searchJobsLive(
  params: JobSearchParams
): Promise<JobSearchResult> {
  const data = await upworkGraphql<RawSearchResponse>(JOB_SEARCH_QUERY, {
    filter: buildFilter(params),
    sort: mapSort(params.sort),
  });

  const conn = data.marketplaceJobPostingsSearch;
  const edges = conn?.edges ?? [];
  let jobs = edges
    .filter((e): e is { node: RawNode } => !!e && !!e.node)
    .map((e) => mapNode(e.node));

  // Client-side refinement for filters we don't push to the API
  // (budget range, exact client rating, payment when combined, skill AND match).
  jobs = sortJobs(
    applyFilters(jobs, {
      budgetMin: params.budgetMin,
      budgetMax: params.budgetMax,
      paymentVerifiedOnly: params.paymentVerifiedOnly,
      skills: params.skills,
    }),
    params.sort ?? "recency"
  );

  const page = conn?.pageInfo;
  return {
    jobs,
    nextCursor: page?.hasNextPage ? page.endCursor ?? null : null,
    total: conn?.totalCount ?? null,
    source: "upwork",
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch a single job. The search node already carries everything we render, so
 * we resolve detail by locating the job within a fresh search by its id.
 * (A dedicated single-posting query can be added once that part of the schema
 * is verified.)
 */
export async function getJobLive(id: string): Promise<Job | null> {
  const result = await searchJobsLive({ limit: 50 });
  return result.jobs.find((j) => j.id === id) ?? null;
}

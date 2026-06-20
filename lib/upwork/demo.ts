/**
 * Demo data provider.
 *
 * Active when there are no Upwork credentials (or UPWORK_DEMO_MODE=true). It
 * emulates the real provider's search contract — same filtering, sorting,
 * pagination, and even simulated "fresh" postings so the auto-refresh/polling
 * feature can be demonstrated end-to-end without any API access.
 */

import type { Job, JobSearchParams, JobSearchResult } from "../types";
import { applyFilters, sortJobs } from "../filter";

/** Minutes-ago each seed job was "posted", so the list always looks live. */
interface Seed {
  ageMinutes: number;
  job: Omit<Job, "postedAt">;
}

const SKILLS = {
  fe: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Redux"],
  be: ["Node.js", "PostgreSQL", "GraphQL", "Express", "Prisma"],
  data: ["Python", "Pandas", "Web Scraping", "Selenium", "BeautifulSoup"],
  ai: ["OpenAI API", "LangChain", "RAG", "Prompt Engineering", "Vector DB"],
  design: ["Figma", "UI/UX", "Wireframing", "Design Systems"],
  mobile: ["React Native", "Flutter", "iOS", "Android"],
};

function client(p: Partial<Job["client"]>): Job["client"] {
  return {
    country: "United States",
    city: null,
    totalSpent: 12_500,
    totalHires: 18,
    rating: 4.9,
    reviewsCount: 22,
    paymentVerified: true,
    totalJobsPosted: 31,
    hireRate: 78,
    ...p,
  };
}

/** Curated, realistic-looking jobs. postedAt is computed at query time. */
const SEEDS: Seed[] = [
  {
    ageMinutes: 7,
    job: {
      id: "demo-fe-001",
      title: "Senior React/Next.js Developer for SaaS Dashboard",
      description:
        "We're building an analytics dashboard and need an experienced React + Next.js engineer to own the frontend. You'll work with TypeScript, Tailwind, and a GraphQL backend. Strong eye for performance and accessibility required.",
      url: "https://www.upwork.com/jobs/~demo-fe-001",
      type: "hourly",
      fixedBudget: null,
      hourlyBudget: { min: 45, max: 70, currency: "USD" },
      category: "Web Development",
      subcategory: "Front-End Development",
      skills: SKILLS.fe,
      experienceLevel: "expert",
      duration: "More than 6 months",
      workload: "30+ hrs/week",
      proposals: "5 to 10",
      client: client({ totalSpent: 86_000, rating: 5.0, country: "United States" }),
    },
  },
  {
    ageMinutes: 19,
    job: {
      id: "demo-data-002",
      title: "Python Web Scraping Expert — E-commerce Price Monitoring",
      description:
        "Build a resilient scraper that monitors prices across 15 retail sites. Must handle anti-bot measures gracefully and respect robots.txt and each site's ToS. Deliver clean CSV/JSON output with a scheduled run.",
      url: "https://www.upwork.com/jobs/~demo-data-002",
      type: "fixed",
      fixedBudget: { min: 800, max: 1500, currency: "USD" },
      hourlyBudget: null,
      category: "Data Science & Analytics",
      subcategory: "Data Extraction / ETL",
      skills: SKILLS.data,
      experienceLevel: "intermediate",
      duration: "1 to 3 months",
      workload: "Less than 30 hrs/week",
      proposals: "10 to 15",
      client: client({ totalSpent: 4_200, rating: 4.7, country: "Germany", totalHires: 7 }),
    },
  },
  {
    ageMinutes: 34,
    job: {
      id: "demo-ai-003",
      title: "Build a RAG Chatbot over Company Knowledge Base (LangChain)",
      description:
        "Looking for an AI engineer to build a retrieval-augmented chatbot over ~2,000 internal documents. Stack is open but we prefer LangChain + a managed vector DB. Must include evals and citation of sources.",
      url: "https://www.upwork.com/jobs/~demo-ai-003",
      type: "fixed",
      fixedBudget: { min: 2500, max: 5000, currency: "USD" },
      hourlyBudget: null,
      category: "AI & Machine Learning",
      subcategory: "AI App Development",
      skills: SKILLS.ai,
      experienceLevel: "expert",
      duration: "1 to 3 months",
      workload: "Less than 30 hrs/week",
      proposals: "Less than 5",
      client: client({ totalSpent: 31_000, rating: 4.95, country: "United Kingdom" }),
    },
  },
  {
    ageMinutes: 52,
    job: {
      id: "demo-be-004",
      title: "Node.js + PostgreSQL Backend for Booking Platform",
      description:
        "Design and implement the REST/GraphQL API for a multi-tenant booking platform. Experience with Prisma, row-level security, and Stripe billing is a big plus.",
      url: "https://www.upwork.com/jobs/~demo-be-004",
      type: "hourly",
      fixedBudget: null,
      hourlyBudget: { min: 35, max: 55, currency: "USD" },
      category: "Web Development",
      subcategory: "Back-End Development",
      skills: SKILLS.be,
      experienceLevel: "intermediate",
      duration: "3 to 6 months",
      workload: "30+ hrs/week",
      proposals: "15 to 20",
      client: client({ totalSpent: 9_800, rating: 4.6, country: "Canada", paymentVerified: true }),
    },
  },
  {
    ageMinutes: 88,
    job: {
      id: "demo-design-005",
      title: "UI/UX Designer for Mobile Fintech App (Figma)",
      description:
        "Redesign our mobile banking app's onboarding and dashboard. Deliver a Figma design system, prototypes, and developer handoff specs. Portfolio with fintech work strongly preferred.",
      url: "https://www.upwork.com/jobs/~demo-design-005",
      type: "fixed",
      fixedBudget: { min: 1200, max: 3000, currency: "USD" },
      hourlyBudget: null,
      category: "Design & Creative",
      subcategory: "UI/UX Design",
      skills: SKILLS.design,
      experienceLevel: "expert",
      duration: "1 to 3 months",
      workload: "Less than 30 hrs/week",
      proposals: "20 to 50",
      client: client({ totalSpent: 18_500, rating: 4.8, country: "Australia" }),
    },
  },
  {
    ageMinutes: 140,
    job: {
      id: "demo-mobile-006",
      title: "React Native Developer — Cross-platform Delivery App",
      description:
        "Add real-time order tracking and push notifications to our existing React Native app. Must coordinate with our backend team and ship to both App Store and Play Store.",
      url: "https://www.upwork.com/jobs/~demo-mobile-006",
      type: "hourly",
      fixedBudget: null,
      hourlyBudget: { min: 30, max: 50, currency: "USD" },
      category: "Mobile Development",
      subcategory: "Cross-Platform Mobile",
      skills: SKILLS.mobile,
      experienceLevel: "intermediate",
      duration: "More than 6 months",
      workload: "30+ hrs/week",
      proposals: "5 to 10",
      client: client({ totalSpent: 52_000, rating: 4.9, country: "United States" }),
    },
  },
  {
    ageMinutes: 220,
    job: {
      id: "demo-data-007",
      title: "Automate LinkedIn Lead Data Collection (Compliant)",
      description:
        "We need a maintainable automation to collect publicly available company data for our CRM, fully compliant with platform terms and data-protection law. Output to Google Sheets with dedup.",
      url: "https://www.upwork.com/jobs/~demo-data-007",
      type: "fixed",
      fixedBudget: { min: 500, max: 900, currency: "USD" },
      hourlyBudget: null,
      category: "Data Science & Analytics",
      subcategory: "Data Extraction / ETL",
      skills: ["Python", "Automation", "Google Sheets API", "Web Scraping"],
      experienceLevel: "intermediate",
      duration: "Less than 1 month",
      workload: "Less than 30 hrs/week",
      proposals: "10 to 15",
      client: client({ totalSpent: 2_100, rating: 4.4, country: "India", paymentVerified: false, totalHires: 3 }),
    },
  },
  {
    ageMinutes: 300,
    job: {
      id: "demo-fe-008",
      title: "Tailwind + shadcn/ui Landing Page from Figma",
      description:
        "Convert a polished Figma design into a pixel-perfect, responsive Next.js landing page using Tailwind and shadcn/ui. Animations with Framer Motion. One-week turnaround.",
      url: "https://www.upwork.com/jobs/~demo-fe-008",
      type: "fixed",
      fixedBudget: { min: 600, max: 1200, currency: "USD" },
      hourlyBudget: null,
      category: "Web Development",
      subcategory: "Front-End Development",
      skills: ["Next.js", "Tailwind CSS", "shadcn/ui", "Framer Motion"],
      experienceLevel: "intermediate",
      duration: "Less than 1 month",
      workload: "Less than 30 hrs/week",
      proposals: "20 to 50",
      client: client({ totalSpent: 6_700, rating: 4.85, country: "Netherlands" }),
    },
  },
  {
    ageMinutes: 480,
    job: {
      id: "demo-ai-009",
      title: "Fine-tune & Deploy LLM for Customer Support Triage",
      description:
        "Looking for an ML engineer to build a support-ticket triage system. Compare prompt-engineering vs fine-tuning approaches, set up evals, and deploy behind an API with monitoring.",
      url: "https://www.upwork.com/jobs/~demo-ai-009",
      type: "hourly",
      fixedBudget: null,
      hourlyBudget: { min: 60, max: 95, currency: "USD" },
      category: "AI & Machine Learning",
      subcategory: "Machine Learning",
      skills: ["Python", "LLM", "MLOps", "OpenAI API", "Evaluation"],
      experienceLevel: "expert",
      duration: "3 to 6 months",
      workload: "Less than 30 hrs/week",
      proposals: "Less than 5",
      client: client({ totalSpent: 124_000, rating: 5.0, country: "United States" }),
    },
  },
  {
    ageMinutes: 720,
    job: {
      id: "demo-be-010",
      title: "GraphQL API Integration Specialist (Third-party APIs)",
      description:
        "Integrate several third-party GraphQL and REST APIs into our Node.js backend, including OAuth2 flows, rate-limit handling, retries, and caching. Clean error handling is essential.",
      url: "https://www.upwork.com/jobs/~demo-be-010",
      type: "hourly",
      fixedBudget: null,
      hourlyBudget: { min: 40, max: 65, currency: "USD" },
      category: "Web Development",
      subcategory: "Back-End Development",
      skills: ["Node.js", "GraphQL", "OAuth2", "API Integration", "Caching"],
      experienceLevel: "expert",
      duration: "1 to 3 months",
      workload: "30+ hrs/week",
      proposals: "5 to 10",
      client: client({ totalSpent: 41_000, rating: 4.9, country: "Singapore" }),
    },
  },
];

/** Titles used to synthesize a brand-new posting for the polling demo. */
const FRESH_TEMPLATES = [
  "Urgent: Next.js Bug Fix on Production Checkout",
  "Quick Python Script to Clean a 50k-row CSV",
  "Build a Webhook Receiver with Node.js",
  "Figma to React Component (single page)",
  "Add Stripe Subscriptions to Existing App",
];

/**
 * Synthesize a "just posted" job. `seed` makes it deterministic within a poll
 * window (we derive it from the current minute) so repeated calls in the same
 * minute don't spam duplicates.
 */
function freshJob(seed: number): Job {
  const i = seed % FRESH_TEMPLATES.length;
  return {
    id: `demo-fresh-${seed}`,
    title: FRESH_TEMPLATES[i],
    description:
      "Freshly posted job (demo). This entry is synthesized by demo mode to showcase the auto-refresh / new-job notification feature.",
    url: `https://www.upwork.com/jobs/~demo-fresh-${seed}`,
    type: i % 2 === 0 ? "fixed" : "hourly",
    fixedBudget: i % 2 === 0 ? { min: 150, max: 400, currency: "USD" } : null,
    hourlyBudget: i % 2 === 0 ? null : { min: 25, max: 45, currency: "USD" },
    postedAt: new Date().toISOString(),
    category: "Web Development",
    subcategory: "Front-End Development",
    skills: ["JavaScript", "Node.js"],
    experienceLevel: "intermediate",
    duration: "Less than 1 month",
    workload: "Less than 30 hrs/week",
    proposals: "Less than 5",
    client: client({ totalSpent: 1_500, rating: 4.5, country: "United States" }),
  };
}

function materialize(now: number): Job[] {
  return SEEDS.map((s) => ({
    ...s.job,
    postedAt: new Date(now - s.ageMinutes * 60_000).toISOString(),
  }));
}

const DEFAULT_LIMIT = 20;

/**
 * Demo search. Mirrors the real provider's JobSearchResult contract.
 * `includeFresh` injects a synthesized brand-new job (used by polling).
 */
export function demoSearch(
  params: JobSearchParams,
  opts: { includeFresh?: boolean } = {}
): JobSearchResult {
  const now = Date.now();
  let jobs = materialize(now);

  if (opts.includeFresh) {
    const minuteSeed = Math.floor(now / 60_000);
    jobs = [freshJob(minuteSeed), ...jobs];
  }

  const filtered = sortJobs(applyFilters(jobs, params), params.sort ?? "recency");

  const limit = params.limit ?? DEFAULT_LIMIT;
  const offset = params.cursor ? Number.parseInt(params.cursor, 10) || 0 : 0;
  const page = filtered.slice(offset, offset + limit);
  const nextOffset = offset + limit;

  return {
    jobs: page,
    nextCursor: nextOffset < filtered.length ? String(nextOffset) : null,
    total: filtered.length,
    source: "demo",
    fetchedAt: new Date(now).toISOString(),
  };
}

export function demoJobById(id: string): Job | null {
  const jobs = materialize(Date.now());
  return jobs.find((j) => j.id === id) ?? null;
}

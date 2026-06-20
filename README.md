# Jobseeker — Upwork Job Scraper (official API)

A Next.js + TypeScript app that searches the Upwork marketplace through the
**official Upwork GraphQL API** (OAuth2) — not HTML scraping. Filter jobs,
auto-refresh for new posts, bookmark and track applications, and export to
CSV/JSON.

> **Runs out of the box in DEMO mode** with realistic sample jobs, so you can try
> everything before you have API credentials. Add credentials later to switch to
> live data — no code changes needed.

![status](https://img.shields.io/badge/build-passing-brightgreen) ![api](https://img.shields.io/badge/Upwork-GraphQL%20API-555)

---

## Features

- 🔎 **Search + filters** — keyword, job type (hourly/fixed), experience level,
  budget range, client payment-verified, posted-within, skills, sort.
- 🔔 **Auto-refresh / polling** — watches for new postings on an interval and
  toasts "N new jobs", highlighting fresh cards.
- 🔖 **Bookmarks** — save jobs, set an application status
  (saved → applied → interviewing → hired/rejected), add private notes.
- 📤 **Export** — download current results or saved jobs as CSV (Excel-ready) or JSON.
- 🌗 Light/dark, responsive, accessible, with an original editorial design
  (deliberately **not** Upwork-branded — see [ToS notes](#-terms-of-service-compliance)).

---

## Quick start

```bash
npm install
cp .env.example .env      # optional — demo mode works without it
npm run dev               # http://localhost:3000
```

That's it. With no credentials, the app serves demo data (you'll see a **"Demo
data"** badge in the header). To use real Upwork data, follow the guide below.

---

## 🔑 Getting Upwork API credentials (step by step)

The Upwork API is gated — every key is reviewed. Plan for a short approval wait.

1. **Prepare your Upwork profile.** Approval requires a profile with a valid full
   name, a full valid address, and a profile photo. Add an ID if prompted.
2. Go to the **Upwork Developer Center**: <https://www.upwork.com/developer> and
   sign in (apply page: <https://www.upwork.com/developer/keys/apply>).
3. **Create / request a new API key (app).** You'll be asked to:
   - describe what your app does (e.g. "personal job-search dashboard"),
   - select whether it's personal or third-party,
   - pick the **scopes** — you must include **"Common Entities – Read-Only
     Access"**, plus marketplace job-posting read access for job search.
4. **Set the OAuth2 Redirect URI** to exactly:
   ```
   http://localhost:3000/api/auth/callback
   ```
   (It must match `UPWORK_REDIRECT_URI` in your `.env` character-for-character,
   or you'll get a `redirect_uri mismatch`.)
5. After approval you receive a **Client ID** and **Client Secret**. Put them in
   `.env`:
   ```env
   UPWORK_CLIENT_ID=your_client_id
   UPWORK_CLIENT_SECRET=your_client_secret
   UPWORK_REDIRECT_URI=http://localhost:3000/api/auth/callback
   UPWORK_DEMO_MODE=false
   AUTH_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   ```
6. Restart `npm run dev`, click **Connect Upwork** in the header, and authorize.
   You'll be redirected back and the badge flips to **"Connected"**.

> Some queries need an **organization id** (`X-Upwork-API-TenantId`). If your
> account has multiple organizations, set `UPWORK_TENANT_ID`. You can discover it
> with the GraphQL `companySelector` query (see `lib/upwork/constants.ts`).

Full, verified API reference (endpoints, query shape, rate limits, error model)
lives in [`docs/UPWORK_API.md`](docs/UPWORK_API.md).

---

## How it works (the logic, first)

The backend was built **API-first and decoupled**, so the UI and features never
depend on Upwork's raw wire format.

```
            ┌──────────────── UI (app/, components/) ────────────────┐
            │  React client → /api routes → provider facade           │
            └─────────────────────────────────────────────────────────┘
                                   │
              lib/upwork/index.ts  │  facade: demo vs live + graceful fallback
              ┌────────────────────┴────────────────────┐
              ▼                                          ▼
   lib/upwork/demo.ts                         lib/upwork/client.ts
   (realistic sample data,                    (official GraphQL
    same search contract)                      marketplaceJobPostingsSearch)
                                                        │
                                       lib/upwork/graphql.ts  (auth + refresh +
                                                        │       429 / error model)
                                       lib/upwork/oauth.ts    (OAuth2 code flow)
```

- **`lib/types.ts`** — our normalized `Job` type. The live client maps Upwork's
  raw GraphQL node → this shape, so a schema change touches only the mapper.
- **`lib/filter.ts`** — pure filter/sort, reused by demo mode and to refine live
  results for filters not pushed to the API.
- **`lib/upwork/oauth.ts` / `graphql.ts`** — verified OAuth2 endpoints, bearer +
  tenant headers, transparent token refresh, typed errors (rate-limit,
  permission-scope, API).
- **`lib/store/bookmarks.ts`** — file-backed local store (`.data/bookmarks.json`),
  atomic writes, swappable for a real DB.
- **`lib/polling.ts`** — pure new-job diffing for the auto-refresh feature.

### API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/auth/status` | demo/connected state for the UI |
| GET | `/api/auth/login` → `/api/auth/callback` | OAuth2 authorize + token exchange |
| POST | `/api/auth/logout` | clear stored tokens |
| GET/POST | `/api/jobs/search` | search jobs (query params or JSON body) |
| GET | `/api/jobs/[id]` | single job |
| GET/POST/PATCH/DELETE | `/api/bookmarks[/id]` | manage saved jobs |
| POST | `/api/export` | download CSV/JSON |

---

## ⚖️ Terms of Service compliance

This app is built to respect Upwork's API ToS. Please keep these in mind:

- **No brand imitation.** The UI uses an original name ("Jobseeker") and palette —
  Upwork's ToS forbids using its logo, brand name styling, or brand colors in your
  app. Don't re-skin this to look like Upwork.
- **24-hour caching limit.** Upwork does not allow storing API data for more than
  24 hours. The bookmark store persists job snapshots for your convenience — for
  strict compliance, treat saved jobs as references and re-fetch, or purge data
  older than 24h. (This is a personal-use tool; you are responsible for ToS
  adherence.)
- **Rate limits.** 300 requests/minute per IP and ~40K/day. The auto-refresh
  feature defaults to a 60s interval; the client surfaces HTTP 429 gracefully.

---

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
```

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui ·
motion · Zod. No Upwork SDK dependency — a small, native `fetch`-based GraphQL
client (cleaner for the Next.js server runtime). Official SDKs also exist if you
prefer them: `@upwork/node-upwork-oauth2`, `python-upwork-oauth2`.

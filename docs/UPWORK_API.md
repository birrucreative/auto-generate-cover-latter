# Upwork Official API — verified integration reference

Everything below was verified against **primary sources**: Upwork's official
GraphQL docs (`https://www.upwork.com/developer/documentation/graphql/api/docs/index.html`)
and Upwork's official OAuth2 SDK source (`github.com/upwork/python-upwork-oauth2`,
`php-upwork-oauth2`). Confidence is noted per section. Always re-check against the
live developer portal before relying on anything marked _medium_.

## 1. OAuth2 (Authorization Code grant) — _high_

| What | Value |
|---|---|
| Authorize URL | `https://www.upwork.com/ab/account-security/oauth2/authorize` |
| Token URL | `https://www.upwork.com/api/v3/oauth2/token` (host is `www.upwork.com`, **not** `api.`) |
| GraphQL endpoint | `https://api.upwork.com/graphql` |
| Grants | `authorization_code`, `refresh_token`, `client_credentials` |
| Access token prefix | `oauth2v2_…` |
| Access token TTL | ~24h (`expires_in: 86400`); refresh token ~2 weeks since last use _(verify in portal)_ |
| Key application page | `https://www.upwork.com/developer/keys/apply` |
| Key rotation | default 12 months; rotatable anytime. Changing scopes invalidates existing tokens. |
| Search scope needed | "Read marketplace Job Postings" (+ "Common Entities – Read-Only Access") |

**Authorize** (GET, user consent):
```
https://www.upwork.com/ab/account-security/oauth2/authorize
  ?response_type=code&client_id=...&redirect_uri=...&state=...
```

**Token exchange** (POST `application/x-www-form-urlencoded`):
```
grant_type=authorization_code&code=...&client_id=...&client_secret=...&redirect_uri=...
```
Response: `{ access_token, refresh_token, token_type, expires_in }`.
Refresh with `grant_type=refresh_token&refresh_token=...&client_id=...&client_secret=...`.

**GraphQL request headers:**
```
Authorization: bearer oauth2v2_...
Content-Type: application/json
X-Upwork-API-TenantId: <organizationId>     # optional, org scoping
```
The tenant/organization id comes from the `companySelector` query.

> Implemented in `lib/upwork/oauth.ts`, `lib/upwork/graphql.ts`, `lib/upwork/constants.ts`.

## 2. Job search query — _high_

Query: **`marketplaceJobPostingsSearch`** → `MarketplaceJobPostingSearchConnection`.

Arguments (note the camelCase argument name `marketPlaceJobFilter`):
- `marketPlaceJobFilter: MarketplaceJobPostingsSearchFilter`
- `searchType: MarketplaceJobPostingSearchType` (use `USER_JOBS_SEARCH`; others ignored)
- `sortAttributes: [MarketplaceJobPostingSearchSortAttribute]`

Example (verbatim shape from official docs):
```graphql
query SearchJobs($filter: MarketplaceJobPostingsSearchFilter) {
  marketplaceJobPostingsSearch(
    marketPlaceJobFilter: $filter
    searchType: USER_JOBS_SEARCH
    sortAttributes: [{ field: RECENCY }]
  ) {
    totalCount
    edges { node {
      id ciphertext title description
      amount { rawValue currency }
      hourlyBudgetType hourlyBudgetMin { rawValue currency } hourlyBudgetMax { rawValue currency }
      createdDateTime publishedDateTime
      category subcategory durationLabel engagement experienceLevel totalApplicants
      skills { name prettyName }
      client {
        totalHires totalPostedJobs totalReviews totalFeedback
        totalSpent { rawValue currency } verificationStatus
        location { country city }
      }
    } }
    pageInfo { endCursor hasNextPage }
  }
}
```
Variables: `{ "filter": { "searchExpression_eq": "react", "pagination_eq": { "after": "0", "first": 24 } } }`

### Filter fields (`MarketplaceJobPostingsSearchFilter`)
- Text: `searchExpression_eq`, `skillExpression_eq`, `titleExpression_eq`
- Taxonomy (Ontology IDs): `categoryIds_any`, `subcategoryIds_any`, `occupationIds_any`, `ontologySkillIds_all`
- Job: `jobType_eq` (`HOURLY`|`FIXED`), `experienceLevel_eq` (`ENTRY_LEVEL`|`INTERMEDIATE`|`EXPERT`), `budgetRange_eq: IntRange`, `proposalRange_eq: IntRange`, `duration_any`, `workload_eq`
- Client: `verifiedPaymentOnly_eq: Boolean`, `clientHiresRange_eq: IntRange`, `clientFeedBackRange_eq: FloatRange`, `previousClients_eq`
- Location: `locations_any: [String!]`, `cityId_any`, `radius_eq`, `timezone_eq`, …
- Recency / paging: `daysPosted_eq: Int`, `sinceId_eq`, `maxId_eq`, `pagination_eq: Pagination { after: String, first: Int! }`

> This app sends only high-confidence filters (`searchExpression`, `jobType`,
> `experienceLevel`, `daysPosted`, `verifiedPaymentOnly`, `locations`,
> `pagination`) and refines budget/rating/skills client-side, because the
> `IntRange`/`FloatRange` input shapes were not verifiable against primary docs.
> See the note in `lib/upwork/client.ts`.

### Sort — `MarketplaceJobPostingSearchSortField`
`RECENCY` · `RELEVANCE` · `CLIENT_TOTAL_CHARGE` · `CLIENT_RATING`.
Passed as `sortAttributes: [{ field: RECENCY }]`.

### Result node — `MarketplaceJobPostingSearchResult`
`id, ciphertext, title, description, amount: Money!, hourlyBudgetType,
hourlyBudgetMin/Max: Money, createdDateTime, publishedDateTime, category,
subcategory, durationLabel, engagement, experienceLevel, totalApplicants,
skills: [{name, prettyName, highlighted}], client {…}`.
`Money { rawValue, currency, displayValue }`. The public job URL is
`https://www.upwork.com/jobs/~<ciphertext>`.

## 3. Other useful queries — _high_
- `marketplaceJobPosting(id: ID!)` — full single-posting details.
- `marketplaceJobPostingsContents(ids: [ID!]!)` — bulk content fetch.
- `ontologyCategories` — 3-level category/subcategory/service hierarchy (for
  resolving `categoryIds_any`).
- `companySelector` — list organizations → `organizationId` for the tenant header.

## 4. Rate limits, errors, access — _high_
- **Rate limit:** 300 requests/minute per IP; daily limit ~40,000 requests.
  Exceeding returns **HTTP 429 "Too Many Requests"** (no documented `Retry-After`).
- **Error model:** GraphQL returns **HTTP 200 even on failure** — errors are in the
  `errors[]` array (`message`, `locations`, `extensions.classification`). A missing
  scope returns 200 with: _"The client or authentication token doesn't have enough
  oauth2 permissions/scopes…"_. **5XX** = GraphQL-layer/server failure.
  (`lib/upwork/graphql.ts` maps these to `RateLimitError`, `PermissionScopeError`,
  `UpworkApiError`.)
- **Access:** every API key request is **reviewed**. Required scope for all use:
  **"Common Entities – Read-Only Access"**. Profile must have valid name, address,
  and photo.

## 5. Official SDKs (alternatives to this app's native client)
- Node: `@upwork/node-upwork-oauth2` — <https://github.com/upwork/node-upwork-oauth2>
- Python: `python-upwork-oauth2` — <https://github.com/upwork/python-upwork-oauth2>
- PHP: `upwork/php-upwork-oauth2` · Ruby: `ruby-upwork-oauth2`

## Confidence & unknowns
- **HIGH** (verified vs primary docs/SDK): all OAuth2 endpoints, GraphQL endpoint,
  headers, the search query name/arguments/result fields, sort enum, rate limits,
  error model, access scopes.
- **MEDIUM / verify live:** exact `IntRange`/`FloatRange` input field names (hence
  client-side budget filtering), exact `expires_in` token lifetime, and the precise
  current wording of the key-registration form.

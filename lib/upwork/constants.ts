/**
 * Upwork official API constants.
 *
 * All values verified against Upwork's official OAuth2 SDKs
 * (github.com/upwork/python-upwork-oauth2 — upwork/client.py & upwork/upwork.py,
 * and the PHP SDK AbstractOAuth.php) and the official GraphQL docs curl example.
 *
 * If Upwork changes these, this is the ONE file to update.
 */

export const UPWORK = {
  /** OAuth2 authorize endpoint (HTTP GET, user-facing consent screen). */
  AUTHORIZE_URL: "https://www.upwork.com/ab/account-security/oauth2/authorize",
  /**
   * OAuth2 token endpoint (HTTP POST). Serves authorization_code,
   * refresh_token, and client_credentials grants. NOTE the host is
   * www.upwork.com — NOT api.upwork.com.
   */
  TOKEN_URL: "https://www.upwork.com/api/v3/oauth2/token",
  /** GraphQL data endpoint (HTTP POST { query, variables }). */
  GRAPHQL_URL: "https://api.upwork.com/graphql",

  /** Header that scopes a request to a specific organization/company. */
  TENANT_HEADER: "X-Upwork-API-TenantId",

  /** Developer portal where you register an app to get client_id/secret. */
  DEVELOPER_PORTAL: "https://www.upwork.com/developer",
} as const;

/** GraphQL query to discover the organizationId for X-Upwork-API-TenantId. */
export const COMPANY_SELECTOR_QUERY = /* GraphQL */ `
  query CompanySelector {
    companySelector {
      items {
        title
        organizationId
      }
    }
  }
`;

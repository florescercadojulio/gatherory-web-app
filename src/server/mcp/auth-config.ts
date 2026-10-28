import { cimd } from '@better-auth/cimd'
import { fetchClientMetadataResource } from '@better-auth/cimd/node'
import { mcp } from '@better-auth/mcp'
import { jwt } from 'better-auth/plugins'
import { hashMcpOAuthToken, mcpRefreshGrantGuard } from '@/server/mcp/refresh-grant-guard'

/** MCP capability scopes are coarse grants; event authorization remains authoritative. */
export const MCP_SCOPES = ['gatherory:read', 'gatherory:write', 'offline_access'] as const
export const MCP_DEFAULT_SCOPES = ['gatherory:read'] as const
export const MCP_EXTRA_REGISTRATION_SCOPES = ['gatherory:write', 'offline_access'] as const

export const MCP_ACCESS_TOKEN_TTL_SECONDS = 5 * 60
export const MCP_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60

/** Keep the MCP protected-resource identifier on the app's canonical origin. */
export function mcpResourceURL(baseURL: string) {
  const base = new URL(baseURL)
  return new URL('/mcp', base.origin).toString()
}

/**
 * Better Auth's MCP OAuth provider is opt-in so deployments can apply the
 * additive OAuth schema before enabling discovery or issuing tokens.
 */
export function createMcpAuthPlugins(baseURL: string) {
  const resource = mcpResourceURL(baseURL)

  return [
    jwt({ jwt: { expirationTime: '5m' } }),
    mcp({
      resource,
      loginPage: '/mcp/connect',
      consentPage: '/mcp/consent',
      scopes: [...MCP_SCOPES],
      clientRegistrationDefaultScopes: [...MCP_DEFAULT_SCOPES],
      clientRegistrationAllowedScopes: [...MCP_EXTRA_REGISTRATION_SCOPES],
      clientRegistrationRequirePKCE: true,
      grantTypes: ['authorization_code', 'refresh_token'],
      accessTokenExpiresIn: MCP_ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenExpiresIn: MCP_REFRESH_TOKEN_TTL_SECONDS,
      storeTokens: { hash: hashMcpOAuthToken },
      resources: [
        {
          identifier: resource,
          name: 'Gatherory MCP',
          accessTokenTtl: MCP_ACCESS_TOKEN_TTL_SECONDS,
          refreshTokenTtl: MCP_REFRESH_TOKEN_TTL_SECONDS,
          // offline_access is a real OAuth scope in this provider's resource
          // policy: excluding it strips it from the grant and makes a client
          // that requests it on refresh receive invalid_scope.
          allowedScopes: ['gatherory:read', 'gatherory:write', 'offline_access'],
        },
      ],
    }),
    mcpRefreshGrantGuard(resource),
    cimd({
      fetchClientMetadataResource,
      metadataProfile: 'mcp-2026-07-28',
    }),
  ] as const
}

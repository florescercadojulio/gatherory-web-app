import { expect, test } from 'vitest'

import {
  MCP_ACCESS_TOKEN_TTL_SECONDS,
  MCP_DEFAULT_SCOPES,
  MCP_SCOPES,
  createMcpAuthPlugins,
  mcpResourceURL,
} from '@/server/mcp/auth-config'

test('MCP resource identity uses only the canonical origin', () => {
  expect(mcpResourceURL('https://app.gatherory.com/api/auth')).toBe('https://app.gatherory.com/mcp')
  expect(mcpResourceURL('http://localhost:3003/nested/path')).toBe('http://localhost:3003/mcp')
})

test('MCP auth requires consent, PKCE authorization-code grants, and short resource tokens', () => {
  const plugins = createMcpAuthPlugins('https://app.gatherory.com') as readonly {
    id: string
    options?: Record<string, unknown>
  }[]
  const [jwtPlugin, oauthPlugin, refreshGuardPlugin, cimdPlugin] = plugins
  const oauthOptions = oauthPlugin.options!

  expect(plugins.map(({ id }) => id)).toEqual([
    'jwt',
    'oauth-provider',
    'gatherory-mcp-refresh-grant-guard',
    'cimd',
  ])
  expect(refreshGuardPlugin).toHaveProperty('hooks.before')
  expect(refreshGuardPlugin).toHaveProperty('hooks.after')
  expect(jwtPlugin.options).toMatchObject({ jwt: { expirationTime: '5m' } })
  expect(oauthOptions).toMatchObject({
    loginPage: '/mcp/connect',
    consentPage: '/mcp/consent',
    scopes: [...MCP_SCOPES],
    clientRegistrationDefaultScopes: [...MCP_DEFAULT_SCOPES],
    clientRegistrationRequirePKCE: true,
    grantTypes: ['authorization_code', 'refresh_token'],
    accessTokenExpiresIn: MCP_ACCESS_TOKEN_TTL_SECONDS,
    resources: [
      {
        identifier: 'https://app.gatherory.com/mcp',
        name: 'Gatherory MCP',
        accessTokenTtl: 300,
        refreshTokenTtl: 30 * 24 * 60 * 60,
        allowedScopes: ['gatherory:read', 'gatherory:write', 'offline_access'],
      },
    ],
    allowDynamicClientRegistration: false,
    allowUnauthenticatedClientRegistration: false,
  })
  expect(cimdPlugin.options).toBeUndefined()
  expect(oauthOptions).not.toHaveProperty('cachedTrustedClients')
  expect(oauthOptions).not.toHaveProperty('skipConsent')
})

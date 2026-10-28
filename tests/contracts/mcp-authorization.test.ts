import { expect, test } from 'vitest'
import {
  createMcpClaimsAuthorizer,
  type McpAccessTokenClaims,
  type McpGrantLookup,
} from '@/server/mcp/authorization'

const resource = 'https://app.example.test/mcp'
const userId = 'account-1'
const sessionId = 'session-1'
const clientId = 'client-1'
const now = new Date('2026-10-25T12:00:00.000Z')
const consentUpdatedAt = new Date('2026-10-25T11:00:00.000Z')

function createLookup(overrides: Partial<McpGrantLookup> = {}) {
  const lookup: McpGrantLookup = {
    findActiveSession: async (id) =>
      id === sessionId
        ? { userId, emailVerified: true, expiresAt: new Date('2026-10-26T12:00:00.000Z') }
        : null,
    findClient: async (id) => (id === clientId ? { disabled: false } : null),
    findConsent: async (id, client) =>
      id === userId && client === clientId
        ? {
            scopes: ['gatherory:read', 'gatherory:write'],
            resources: [resource],
            updatedAt: consentUpdatedAt,
          }
        : null,
    ...overrides,
  }
  return lookup
}

function validClaims(overrides: Partial<McpAccessTokenClaims> = {}): McpAccessTokenClaims {
  return {
    sub: userId,
    sid: sessionId,
    azp: clientId,
    client_id: clientId,
    aud: resource,
    scope: 'gatherory:read',
    iat: Math.floor(now.getTime() / 1000),
    ...overrides,
  }
}

test('MCP authorization requires the exact active account session, client, and current resource consent', async () => {
  const authorize = createMcpClaimsAuthorizer(createLookup(), resource)
  expect(await authorize(validClaims(), now)).toEqual({ userId })

  const invalidClaims = [
    validClaims({ sid: undefined }),
    validClaims({ azp: 'another-client' }),
    validClaims({ client_id: undefined }),
    validClaims({ sub: 'another-account' }),
    validClaims({ aud: 'https://other.example.test/mcp' }),
    validClaims({ iat: undefined }),
  ]
  for (const claims of invalidClaims) expect(await authorize(claims, now)).toBeNull()

  const missingSession = createMcpClaimsAuthorizer(
    createLookup({ findActiveSession: async () => null }),
    resource
  )
  const expiredSession = createMcpClaimsAuthorizer(
    createLookup({
      findActiveSession: async () => ({
        userId,
        emailVerified: true,
        expiresAt: new Date(now.getTime()),
      }),
    }),
    resource
  )
  const wrongAccountSession = createMcpClaimsAuthorizer(
    createLookup({
      findActiveSession: async () => ({
        userId: 'another-account',
        emailVerified: true,
        expiresAt: new Date('2026-10-26T12:00:00.000Z'),
      }),
    }),
    resource
  )
  const unverifiedAccountSession = createMcpClaimsAuthorizer(
    createLookup({
      findActiveSession: async () => ({
        userId,
        emailVerified: false,
        expiresAt: new Date('2026-10-26T12:00:00.000Z'),
      }),
    }),
    resource
  )
  expect(await missingSession(validClaims(), now)).toBeNull()
  expect(await expiredSession(validClaims(), now)).toBeNull()
  expect(await wrongAccountSession(validClaims(), now)).toBeNull()
  expect(await unverifiedAccountSession(validClaims(), now)).toBeNull()
})

test('MCP authorization observes disabled clients, consent revocation, resource removal, and scope reduction', async () => {
  const disabledClient = createMcpClaimsAuthorizer(
    createLookup({ findClient: async () => ({ disabled: true }) }),
    resource
  )
  const revokedConsent = createMcpClaimsAuthorizer(
    createLookup({ findConsent: async () => null }),
    resource
  )
  const removedResource = createMcpClaimsAuthorizer(
    createLookup({
      findConsent: async () => ({
        scopes: ['gatherory:read', 'gatherory:write'],
        resources: [],
        updatedAt: consentUpdatedAt,
      }),
    }),
    resource
  )
  const reducedScopes = createMcpClaimsAuthorizer(
    createLookup({
      findConsent: async () => ({
        scopes: ['gatherory:read'],
        resources: [resource],
        updatedAt: consentUpdatedAt,
      }),
    }),
    resource
  )
  const reconsented = createMcpClaimsAuthorizer(
    createLookup({
      findConsent: async () => ({
        scopes: ['gatherory:read', 'gatherory:write'],
        resources: [resource],
        updatedAt: new Date(now.getTime() + 1_000),
      }),
    }),
    resource
  )

  expect(await disabledClient(validClaims(), now)).toBeNull()
  expect(await revokedConsent(validClaims(), now)).toBeNull()
  expect(await removedResource(validClaims(), now)).toBeNull()
  expect(await reducedScopes(validClaims({ scope: 'gatherory:write' }), now)).toBeNull()
  expect(await reconsented(validClaims(), now)).toBeNull()
  // JWT iat has whole-second precision, so a token minted in the same second
  // as consent remains accepted while the exact replacement timestamp does not.
  expect(
    await reconsented(validClaims({ iat: Math.floor(now.getTime() / 1_000) + 1 }), now)
  ).toEqual({ userId })
})

test('a current read/write JWT stops authorizing as soon as its consent is revoked', async () => {
  const authorize = createMcpClaimsAuthorizer(
    createLookup({ findConsent: async () => null }),
    resource
  )
  const stillUnexpiredClaims = validClaims({
    scope: 'gatherory:read gatherory:write',
    exp: Math.floor(now.getTime() / 1_000) + 300,
  })

  // The request-time grant lookup rejects both operations despite an otherwise
  // current token, active session, and enabled client.
  expect(await authorize(stillUnexpiredClaims, now)).toBeNull()
})

test('MCP authorization rejects empty or duplicate token scopes', async () => {
  const authorize = createMcpClaimsAuthorizer(createLookup(), resource)
  expect(await authorize(validClaims({ scope: '' }), now)).toBeNull()
  expect(await authorize(validClaims({ scope: 'gatherory:read gatherory:read' }), now)).toBeNull()
})

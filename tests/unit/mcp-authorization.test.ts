import { beforeEach, expect, test, vi } from 'vitest'

import { createMcpClaimsAuthorizer, type McpGrantLookup } from '@/server/mcp/authorization'

const lookup = {
  findActiveSession: vi.fn(),
  findClient: vi.fn(),
  findConsent: vi.fn(),
} satisfies McpGrantLookup

const resource = 'https://app.gatherory.com/mcp'
const authorize = createMcpClaimsAuthorizer(lookup, resource)
const validClaims = {
  sub: 'user-1',
  sid: 'session-1',
  azp: 'https://agent.example/client.json',
  client_id: 'https://agent.example/client.json',
  scope: 'gatherory:read gatherory:write',
  aud: resource,
  iat: Math.floor(Date.parse('2026-10-25T12:00:00.000Z') / 1000),
}
const now = new Date('2026-10-25T12:00:00.000Z')

beforeEach(() => {
  vi.resetAllMocks()
  lookup.findActiveSession.mockResolvedValue({
    userId: 'user-1',
    emailVerified: true,
    expiresAt: new Date(now.getTime() + 60_000),
  })
  lookup.findClient.mockResolvedValue({ disabled: false })
  lookup.findConsent.mockResolvedValue({
    scopes: ['gatherory:read', 'gatherory:write'],
    resources: [resource],
    updatedAt: new Date(now.getTime() - 60_000),
  })
})

test('allows a verified user token while its exact session, client, and consent remain active', async () => {
  await expect(authorize(validClaims, now)).resolves.toEqual({ userId: 'user-1' })
})

test.each([
  ['missing user subject', { ...validClaims, sub: undefined }],
  ['missing session binding', { ...validClaims, sid: undefined }],
  ['missing authorized client', { ...validClaims, azp: undefined }],
  ['client claim mismatch', { ...validClaims, client_id: 'different-client' }],
  ['missing scopes', { ...validClaims, scope: undefined }],
])('rejects %s', async (_label, claims) => {
  await expect(authorize(claims, now)).resolves.toBeNull()
  expect(lookup.findActiveSession).not.toHaveBeenCalled()
})

test.each([
  ['the session was revoked', { session: null }],
  [
    'the session belongs to another user',
    {
      session: {
        userId: 'user-2',
        emailVerified: true,
        expiresAt: new Date(now.getTime() + 60_000),
      },
    },
  ],
  ['the session expired', { session: { userId: 'user-1', emailVerified: true, expiresAt: now } }],
  [
    'the user is unverified',
    {
      session: {
        userId: 'user-1',
        emailVerified: false,
        expiresAt: new Date(now.getTime() + 60_000),
      },
    },
  ],
  ['the client is missing', { client: null }],
  ['the client is disabled', { client: { disabled: true } }],
  ['consent was revoked', { consent: null }],
  [
    'the consent no longer covers the MCP resource',
    {
      consent: {
        scopes: ['gatherory:read', 'gatherory:write'],
        resources: [],
        updatedAt: new Date(now.getTime() - 60_000),
      },
    },
  ],
  [
    'the requested write scope was removed from consent',
    {
      consent: {
        scopes: ['gatherory:read'],
        resources: [resource],
        updatedAt: new Date(now.getTime() - 60_000),
      },
    },
  ],
  [
    'the grant was replaced after token issuance',
    {
      consent: {
        scopes: ['gatherory:read', 'gatherory:write'],
        resources: [resource],
        updatedAt: new Date(now.getTime() + 1000),
      },
    },
  ],
])('rejects when %s', async (_label, override) => {
  if ('session' in override) lookup.findActiveSession.mockResolvedValue(override.session)
  if ('client' in override) lookup.findClient.mockResolvedValue(override.client)
  if ('consent' in override) lookup.findConsent.mockResolvedValue(override.consent)

  await expect(authorize(validClaims, now)).resolves.toBeNull()
})

test('rejects duplicate scope values instead of treating an ambiguous token as valid', async () => {
  await expect(
    authorize({ ...validClaims, scope: 'gatherory:read gatherory:read' }, now)
  ).resolves.toBeNull()
})

test('a prior write token stops working after settings narrows consent, while a read token remains usable', async () => {
  lookup.findConsent.mockResolvedValue({
    scopes: ['gatherory:read'],
    resources: [resource],
    updatedAt: new Date(now.getTime() - 60_000),
  })

  await expect(authorize(validClaims, now)).resolves.toBeNull()
  await expect(authorize({ ...validClaims, scope: 'gatherory:read' }, now)).resolves.toEqual({
    userId: 'user-1',
  })
})

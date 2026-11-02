import { expect, test, vi } from 'vitest'
import { Effect } from 'effect'
import {
  createMcpAuthorizationPromiseAdapter,
  type McpAuthorizationEffectRunner,
  type McpAuthorizationWorkflows,
} from '@/server/mcp/authorization.promise.adapter'
import type { McpAccessTokenClaims, McpGrantLookup } from '@/server/mcp/authorization'

const resource = 'https://app.example.test/mcp'
const run: McpAuthorizationEffectRunner = (program) => Effect.runPromise(program)

const createAuthorize = (lookup: McpAuthorizationWorkflows) =>
  createMcpAuthorizationPromiseAdapter(lookup, resource, run)

function validClaims(overrides: Partial<McpAccessTokenClaims> = {}): McpAccessTokenClaims {
  return {
    sub: 'account-1',
    sid: 'session-1',
    azp: 'client-1',
    client_id: 'client-1',
    aud: resource,
    scope: 'gatherory:read',
    iat: Math.floor(Date.now() / 1_000),
    ...overrides,
  }
}

function workflows(
  consent: Awaited<ReturnType<McpGrantLookup['findConsent']>>
): McpAuthorizationWorkflows {
  return {
    findActiveSession: vi.fn(() =>
      Effect.succeed({
        userId: 'account-1',
        emailVerified: true,
        expiresAt: new Date(Date.now() + 60_000),
      })
    ),
    findClient: vi.fn(() => Effect.succeed({ disabled: false })),
    findConsent: vi.fn(() => Effect.succeed(consent)),
  }
}

test('Promise authorization adapter composes Effect lookups with the injectable claims policy', async () => {
  const lookup = workflows({
    scopes: ['gatherory:read'],
    resources: [resource],
    updatedAt: new Date(Date.now() - 1_000),
  })
  const authorize = createAuthorize(lookup)

  await expect(authorize(validClaims())).resolves.toEqual({ userId: 'account-1' })
  expect(lookup.findActiveSession).toHaveBeenCalledWith('session-1')
  expect(lookup.findClient).toHaveBeenCalledWith('client-1')
  expect(lookup.findConsent).toHaveBeenCalledWith('account-1', 'client-1')
})

test('Promise authorization adapter denies revoked or scope-reduced grants', async () => {
  const revoked = createAuthorize(workflows(null))
  const reduced = createAuthorize(
    workflows({
      scopes: ['gatherory:read'],
      resources: [resource],
      updatedAt: new Date(Date.now() - 1_000),
    })
  )

  await expect(revoked(validClaims())).resolves.toBeNull()
  await expect(reduced(validClaims({ scope: 'gatherory:write' }))).resolves.toBeNull()
})

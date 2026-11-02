import { beforeEach, expect, test, vi } from 'vitest'
import { Effect } from 'effect'
import { ConflictError, EntityNotFoundError } from '@/lib/domain-errors'
import { createMcpConnectionHandlers } from '@/server/mcp/connection.handler'
import {
  safeReducedMcpScopes,
  shouldRetainMcpRefreshTokens,
} from '@/server/mcp/connection-settings'

const state = vi.hoisted(() => ({
  session: null as null | {
    id: string
    email: string
    name: string
    image: string | null
  },
  grant: null as null | Record<string, any>,
  listRows: [] as Array<Record<string, unknown>>,
  writes: [] as Array<{ kind: string; values: unknown }>,
  sessionHeaders: [] as Headers[],
}))

const user = { id: 'user-1', email: 'user@example.test', name: 'Test User', image: null }
const validGrant = {
  id: 'consent-1',
  userId: 'user-1',
  clientId: 'client-1',
  referenceId: null,
  scopes: ['gatherory:read', 'gatherory:write', 'offline_access'],
  resources: ['https://app.example.test/mcp'],
}

const mcpConnectionHandlers = createMcpConnectionHandlers({
  enabled: true,
  origin: 'https://app.example.test',
  resourceURL: 'https://app.example.test/mcp',
  session: (headers) => {
    state.sessionHeaders.push(headers)
    return Effect.succeed(state.session)
  },
  list: ({ userId, resourceURL }) =>
    Effect.succeed(
      state.listRows
        .filter(
          (row) =>
            row.userId === userId &&
            row.disabled !== true &&
            Array.isArray(row.resources) &&
            row.resources.includes(resourceURL)
        )
        .map(({ userId: _userId, resources: _resources, disabled: _disabled, ...row }) => row)
    ),
  reduce: ({ userId, clientId, resourceURL, requestedScopes }) => {
    const grant = state.grant
    if (
      !grant ||
      grant.userId !== userId ||
      grant.clientId !== clientId ||
      grant.referenceId !== null ||
      !grant.resources.includes(resourceURL)
    ) {
      return Effect.fail(
        new EntityNotFoundError({
          category: 'not_found',
          code: 'connection_not_found',
          userMessageKey: 'serverErrors.NOT_FOUND',
        })
      )
    }
    const reducedScopes = safeReducedMcpScopes(grant.scopes, requestedScopes)
    if (!reducedScopes)
      return Effect.fail(
        new ConflictError({
          category: 'conflict',
          code: 'fresh_consent_required',
          userMessageKey: 'serverErrors.CONFLICT',
        })
      )
    if (
      reducedScopes.length === grant.scopes.length &&
      reducedScopes.every((scope: string) => grant.scopes.includes(scope))
    ) {
      return Effect.succeed({ kind: 'unchanged' as const, id: grant.id, scopes: grant.scopes })
    }

    const updatedAt = new Date('2026-10-30T12:00:00.000Z')
    state.writes.push({ kind: 'consent', values: { scopes: reducedScopes, updatedAt } })
    if (shouldRetainMcpRefreshTokens(reducedScopes)) {
      state.writes.push({ kind: 'refresh', values: { scopes: reducedScopes } })
    } else {
      state.writes.push({ kind: 'delete_refresh', values: null })
    }
    return Effect.succeed({
      kind: 'updated' as const,
      id: grant.id,
      scopes: reducedScopes,
      updatedAt,
    })
  },
})

function request(body?: unknown, options: { origin?: string; url?: string; cookie?: string } = {}) {
  return new Request(options.url ?? 'http://127.0.0.1/api/mcp/connection', {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(options.origin === undefined ? {} : { origin: options.origin }),
      ...(options.cookie === undefined ? {} : { cookie: options.cookie }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

beforeEach(() => {
  state.session = { ...user }
  state.grant = { ...validGrant }
  state.listRows = []
  state.writes = []
  state.sessionHeaders = []
})

test('GET returns the existing user/connection shape and lists only enabled MCP resource grants', async () => {
  state.listRows = [
    {
      id: 'mcp',
      userId: user.id,
      clientId: 'client-1',
      scopes: ['gatherory:read'],
      updatedAt: new Date(0).toISOString(),
      resources: ['https://app.example.test/mcp'],
      name: 'MCP Client',
      icon: null,
      disabled: false,
    },
    {
      id: 'other',
      userId: user.id,
      clientId: 'client-2',
      scopes: ['gatherory:read'],
      updatedAt: new Date(0).toISOString(),
      resources: ['https://other.example/mcp'],
      name: 'Other',
      icon: null,
      disabled: false,
    },
    {
      id: 'disabled',
      userId: user.id,
      clientId: 'client-3',
      scopes: ['gatherory:read'],
      updatedAt: new Date(0).toISOString(),
      resources: ['https://app.example.test/mcp'],
      name: 'Disabled',
      icon: null,
      disabled: true,
    },
  ]
  const response = await mcpConnectionHandlers.GET({
    request: request(undefined, { cookie: 'session=ok' }),
  })
  expect(await response.json()).toMatchObject({
    enabled: true,
    user: { email: user.email, name: user.name },
    connections: [{ id: 'mcp', clientId: 'client-1' }],
  })
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
  expect(state.sessionHeaders[0]?.get('cookie')).toBe('session=ok')

  state.session = null
  expect(await (await mcpConnectionHandlers.GET({ request: request() })).json()).toMatchObject({
    user: null,
    connections: [],
  })
})

test('POST reduces consent and refresh token scopes atomically and accepts configured Origin behind proxy', async () => {
  const response = await mcpConnectionHandlers.POST({
    request: request(
      { clientId: 'client-1', scopes: ['gatherory:read', 'offline_access'] },
      { origin: 'https://app.example.test', cookie: 'session=ok' }
    ),
  })
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({
    ok: true,
    connection: { id: 'consent-1', scopes: ['gatherory:read', 'offline_access'] },
  })
  expect(state.writes).toHaveLength(2)
  expect(state.writes.map((write) => write.kind)).toEqual(['consent', 'refresh'])
  expect(state.writes[0]?.values).toMatchObject({ scopes: ['gatherory:read', 'offline_access'] })
})

test.each([undefined, 'https://attacker.example'])(
  'POST rejects missing or untrusted Origin (%s)',
  async (origin) => {
    const response = await mcpConnectionHandlers.POST({
      request: request({ clientId: 'client-1', scopes: ['gatherory:read'] }, { origin }),
    })
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ error: 'invalid_origin' })
    expect(state.writes).toHaveLength(0)
  }
)

test('POST rejects unauthenticated, cross-user, unrelated, and malformed requests', async () => {
  state.session = null
  expect(
    (
      await mcpConnectionHandlers.POST({
        request: request(
          { clientId: 'client-1', scopes: ['gatherory:read'] },
          { origin: 'https://app.example.test' }
        ),
      })
    ).status
  ).toBe(401)

  state.session = { ...user }
  state.grant = { ...validGrant, userId: 'other-user' }
  const foreign = await mcpConnectionHandlers.POST({
    request: request(
      { clientId: 'client-2', scopes: ['gatherory:read'] },
      { origin: 'https://app.example.test' }
    ),
  })
  expect(foreign.status).toBe(404)
  expect(await foreign.json()).toMatchObject({ error: 'connection_not_found' })

  state.grant = { ...validGrant, resources: ['https://other.example/mcp'] }
  expect(
    (
      await mcpConnectionHandlers.POST({
        request: request(
          { clientId: 'client-1', scopes: ['gatherory:read'] },
          { origin: 'https://app.example.test' }
        ),
      })
    ).status
  ).toBe(404)

  state.grant = { ...validGrant }
  const malformed = await mcpConnectionHandlers.POST({
    request: request(
      { clientId: '', scopes: ['gatherory:read', 5] },
      { origin: 'https://app.example.test' }
    ),
  })
  expect(malformed.status).toBe(400)
  expect(await malformed.json()).toMatchObject({ error: 'invalid_request' })

  const malformedJsonRequest = new Request('http://127.0.0.1/api/mcp/connection', {
    method: 'POST',
    headers: { origin: 'https://app.example.test', 'content-type': 'application/json' },
    body: '{',
  })
  const malformedJson = await mcpConnectionHandlers.POST({ request: malformedJsonRequest })
  expect(malformedJson.status).toBe(400)
  expect(await malformedJson.json()).toMatchObject({ error: 'invalid_request' })
})

test('POST makes exact repeats no-ops and refuses expansion or removal of required read scope', async () => {
  const noop = await mcpConnectionHandlers.POST({
    request: request(
      { clientId: 'client-1', scopes: validGrant.scopes },
      { origin: 'https://app.example.test' }
    ),
  })
  expect(noop.status).toBe(200)
  expect(state.writes).toHaveLength(0)

  for (const scopes of [['gatherory:read', 'gatherory:write'], ['gatherory:write']]) {
    const response = await mcpConnectionHandlers.POST({
      request: request({ clientId: 'client-1', scopes }, { origin: 'https://app.example.test' }),
    })
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ error: 'fresh_consent_required' })
  }
  expect(state.writes).toHaveLength(0)
})

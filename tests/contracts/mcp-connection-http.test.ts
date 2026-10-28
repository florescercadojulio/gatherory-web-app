import { beforeEach, expect, test, vi } from 'vitest'

const state = vi.hoisted(() => ({
  session: null as null | {
    user: { id: string; email: string; name: string; image: string | null }
  },
  grant: null as null | Record<string, unknown>,
  listRows: [] as Array<Record<string, unknown>>,
  writes: [] as Array<{ kind: string; values: unknown }>,
}))

vi.mock('@/db', () => ({
  db: {
    select: () => ({ from: () => ({ innerJoin: () => ({ where: async () => state.listRows }) }) }),
    transaction: async (work: (tx: unknown) => unknown) =>
      work({
        select: () => ({
          from: () => ({ where: () => ({ for: async () => (state.grant ? [state.grant] : []) }) }),
        }),
        update: () => ({
          set: (values: unknown) => ({
            where: async () => state.writes.push({ kind: 'update', values }),
          }),
        }),
        delete: () => ({ where: async () => state.writes.push({ kind: 'delete', values: null }) }),
      }),
  },
}))
vi.mock('@/db/schema/mcp-oauth.schema', () => ({
  oauthClient: { clientId: 'clientId', name: 'name', icon: 'icon', disabled: 'disabled' },
  oauthConsent: {
    id: 'id',
    userId: 'userId',
    clientId: 'clientId',
    scopes: 'scopes',
    updatedAt: 'updatedAt',
    referenceId: 'referenceId',
    resources: 'resources',
  },
  oauthRefreshToken: { userId: 'userId', clientId: 'clientId', referenceId: 'referenceId' },
}))
vi.mock('drizzle-orm', () => ({
  and: (...values: unknown[]) => values,
  eq: (...values: unknown[]) => values,
  isNull: (...values: unknown[]) => values,
}))
vi.mock('@/env', () => ({
  env: { MCP_ENABLED: true, BETTER_AUTH_URL: 'https://app.example.test' },
}))
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: async () => state.session } } }))
vi.mock('@/server/mcp/auth-config', () => ({
  mcpResourceURL: () => 'https://app.example.test/mcp',
}))

const { mcpConnectionHandlers } = await import('@/routes/api/mcp/connection')
const user = { id: 'user-1', email: 'user@example.test', name: 'Test User', image: null }
const validGrant = {
  id: 'consent-1',
  userId: 'user-1',
  clientId: 'client-1',
  referenceId: null,
  scopes: ['gatherory:read', 'gatherory:write', 'offline_access'],
  resources: ['https://app.example.test/mcp'],
}

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
  state.session = { user }
  state.grant = { ...validGrant }
  state.listRows = []
  state.writes = []
})

test('GET requires the cookie session for grant details and lists only enabled MCP resource grants', async () => {
  state.listRows = [
    {
      id: 'mcp',
      clientId: 'client-1',
      scopes: ['gatherory:read'],
      updatedAt: new Date(0),
      resources: ['https://app.example.test/mcp'],
      name: 'MCP Client',
      icon: null,
      disabled: false,
    },
    {
      id: 'other',
      clientId: 'client-2',
      scopes: ['gatherory:read'],
      updatedAt: new Date(0),
      resources: ['https://other.example/mcp'],
      name: 'Other',
      icon: null,
      disabled: false,
    },
    {
      id: 'disabled',
      clientId: 'client-3',
      scopes: ['gatherory:read'],
      updatedAt: new Date(0),
      resources: ['https://app.example.test/mcp'],
      name: 'Disabled',
      icon: null,
      disabled: true,
    },
  ]
  const response = await mcpConnectionHandlers.GET({ request: request() })
  expect(await response.json()).toMatchObject({
    user: { email: user.email, name: user.name },
    connections: [{ id: 'mcp', clientId: 'client-1' }],
  })
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')

  state.session = null
  expect(await (await mcpConnectionHandlers.GET({ request: request() })).json()).toMatchObject({
    user: null,
    connections: [],
  })
})

test('POST accepts the configured browser Origin through an internal HTTP proxy URL', async () => {
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
})

test.each([undefined, 'https://attacker.example'])(
  'POST rejects missing or untrusted Origin (%s)',
  async (origin) => {
    const response = await mcpConnectionHandlers.POST({
      request: request({ clientId: 'client-1', scopes: ['gatherory:read'] }, { origin }),
    })
    expect(response.status).toBe(403)
    expect(state.writes).toHaveLength(0)
  }
)

test('POST requires an authenticated user and rejects missing, foreign, or unrelated grants', async () => {
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

  state.session = { user }
  state.grant = null // Covers a different owner/client/reference grant, which must not be discoverable.
  expect(
    (
      await mcpConnectionHandlers.POST({
        request: request(
          { clientId: 'client-2', scopes: ['gatherory:read'] },
          { origin: 'https://app.example.test' }
        ),
      })
    ).status
  ).toBe(404)
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

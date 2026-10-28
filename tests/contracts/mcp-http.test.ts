import { expect, test } from 'vitest'
import { z } from 'zod'

import { createMcpHttpHandler, MCP_MAX_BODY_BYTES } from '@/server/mcp/http'

const endpoint = 'https://app.example.com/api/mcp'
const resource = 'https://app.example.com/api/mcp'

const definition = {
  name: 'list_ideas',
  description: 'List the current event ideas.',
  inputSchema: z.object({ eventId: z.string() }),
  readOnly: true,
} as const

function makeHandler() {
  const calls: Array<{ name: string; input: unknown; userId: string }> = []
  const handler = createMcpHttpHandler({
    resource,
    authenticate: async (request, next) => {
      const authorization = request.headers.get('authorization')
      const token = authorization?.match(/^Bearer (.+)$/i)?.[1]
      if (!token) {
        return Response.json(
          { error: 'unauthorized' },
          {
            status: 401,
            headers: { 'WWW-Authenticate': `Bearer resource_metadata="${resource}"` },
          }
        )
      }
      if (token === 'revoked') {
        return next(request, { sub: 'revoked', scope: 'gatherory:read' })
      }
      if (token === 'alice-read') {
        return next(request, { sub: 'alice', client_id: 'client-a', scope: 'gatherory:read' })
      }
      if (token === 'alice-write') {
        return next(request, {
          sub: 'alice',
          client_id: 'client-a',
          scope: 'gatherory:read gatherory:write',
        })
      }
      if (token === 'bob-read') {
        return next(request, { sub: 'bob', client_id: 'client-b', scope: 'gatherory:read' })
      }
      return Response.json({ error: 'invalid token' }, { status: 401 })
    },
    authorizeClaims: async (claims) =>
      claims.sub === 'revoked'
        ? null
        : typeof claims.sub === 'string'
          ? { userId: claims.sub }
          : null,
    tools: [definition],
    callTool: async (name, input, actor) => {
      calls.push({ name, input, userId: actor.userId })
      return { userId: actor.userId, eventId: (input as { eventId: string }).eventId, ideas: [] }
    },
  })
  return { handler, calls }
}

function rpcRequest(
  method: string,
  params: Record<string, unknown> = {},
  options: {
    token?: string
    origin?: string
    host?: string
    protocolVersion?: string
    contentType?: string
  } = {}
) {
  const headers = new Headers({
    'content-type': options.contentType ?? 'application/json',
    'MCP-Protocol-Version': options.protocolVersion ?? '2026-07-28',
    'Mcp-Method': method,
  })
  if (typeof params.name === 'string') headers.set('Mcp-Name', params.name)
  if (options.token) headers.set('authorization', `Bearer ${options.token}`)
  if (options.origin !== undefined) headers.set('origin', options.origin)
  if (options.host !== undefined) headers.set('host', options.host)
  return new Request(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params: {
        ...params,
        _meta: {
          'io.modelcontextprotocol/protocolVersion': options.protocolVersion ?? '2026-07-28',
          'io.modelcontextprotocol/clientInfo': { name: 'contract-test', version: '1.0.0' },
          'io.modelcontextprotocol/clientCapabilities': {},
        },
      },
    }),
  })
}

async function call(
  handler: (request: Request) => Promise<Response>,
  token: string,
  eventId = 'event-1',
  toolName: string = definition.name
) {
  return handler(
    rpcRequest(
      'tools/call',
      {
        name: toolName,
        arguments: { eventId },
      },
      { token, origin: 'https://app.example.com' }
    )
  )
}

test('serves modern MCP tools over the real SDK and binds the call to verified claims', async () => {
  const { handler, calls } = makeHandler()
  const response = await call(handler, 'alice-read')

  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  expect(response.headers.get('referrer-policy')).toBe('no-referrer')
  expect(calls).toEqual([{ name: 'list_ideas', input: { eventId: 'event-1' }, userId: 'alice' }])
  const rpc = await response.json()
  expect(rpc.result.content).toEqual([
    { type: 'text', text: JSON.stringify({ userId: 'alice', eventId: 'event-1', ideas: [] }) },
  ])
})

test('rejects missing bearer credentials, cookie-only requests, and revoked actors before tool access', async () => {
  const { handler, calls } = makeHandler()
  const missing = await handler(rpcRequest('tools/list'))
  const cookieOnly = rpcRequest('tools/call', {
    name: definition.name,
    arguments: { eventId: 'event-1' },
  })
  cookieOnly.headers.set('cookie', 'better-auth.session_token=browser-session')
  const cookie = await handler(cookieOnly)
  const revoked = await call(handler, 'revoked')

  expect(missing.status).toBe(401)
  expect(missing.headers.get('www-authenticate')).toContain('resource_metadata=')
  expect(cookie.status).toBe(401)
  expect(revoked.status).toBe(401)
  expect(calls).toEqual([])
})

test('uses SDK scope challenges and requires both read and write scopes for write tools', async () => {
  const calls: Array<{ name: string; input: unknown; userId: string }> = []
  const writeHandler = createMcpHttpHandler({
    resource,
    authenticate: async (request, next) => {
      const token = request.headers.get('authorization')?.replace(/^Bearer /i, '')
      if (token !== 'alice-read' && token !== 'alice-write')
        return Response.json({}, { status: 401 })
      return next(request, {
        sub: 'alice',
        client_id: 'client-a',
        scope: token === 'alice-write' ? 'gatherory:read gatherory:write' : 'gatherory:read',
      })
    },
    authorizeClaims: async (claims) =>
      typeof claims.sub === 'string' ? { userId: claims.sub } : null,
    tools: [{ ...definition, name: 'create_idea', readOnly: false }],
    callTool: async (name, input, actor) => {
      calls.push({ name, input, userId: actor.userId })
      return { created: true }
    },
  })

  const underScoped = await call(writeHandler, 'alice-read', 'event-1', 'create_idea')
  const authorized = await call(writeHandler, 'alice-write', 'event-1', 'create_idea')
  expect(underScoped.status).toBe(403)
  expect(underScoped.headers.get('www-authenticate')).toContain(
    'scope="gatherory:read gatherory:write"'
  )
  expect(authorized.status).toBe(200)
  expect(calls).toEqual([{ name: 'create_idea', input: { eventId: 'event-1' }, userId: 'alice' }])
})

test('does not leak identity or scopes between concurrent requests on the same handler', async () => {
  const calls: Array<{ userId: string; eventId: string }> = []
  let finishFirst: (() => void) | undefined
  const firstStarted = new Promise<void>((resolve) => {
    finishFirst = resolve
  })
  let releaseFirst: (() => void) | undefined
  const blockedFirst = new Promise<void>((resolve) => {
    releaseFirst = resolve
  })
  const handler = createMcpHttpHandler({
    resource,
    authenticate: async (request, next) => {
      const token = request.headers.get('authorization')?.replace(/^Bearer /i, '')
      if (token === 'alice-read') return next(request, { sub: 'alice', scope: 'gatherory:read' })
      if (token === 'bob-read') return next(request, { sub: 'bob', scope: 'gatherory:read' })
      return Response.json({}, { status: 401 })
    },
    authorizeClaims: async (claims) =>
      typeof claims.sub === 'string' ? { userId: claims.sub } : null,
    tools: [definition],
    callTool: async (_name, input, actor) => {
      const eventId = (input as { eventId: string }).eventId
      calls.push({ userId: actor.userId, eventId })
      if (eventId === 'alice-event') {
        finishFirst?.()
        await blockedFirst
      }
      return { userId: actor.userId, eventId }
    },
  })

  const alice = call(handler, 'alice-read', 'alice-event')
  await firstStarted
  const bob = call(handler, 'bob-read', 'bob-event')
  const bobResponse = await bob
  releaseFirst?.()
  const aliceResponse = await alice

  expect(bobResponse.status).toBe(200)
  expect(aliceResponse.status).toBe(200)
  expect(calls).toEqual([
    { userId: 'alice', eventId: 'alice-event' },
    { userId: 'bob', eventId: 'bob-event' },
  ])
  expect((await bobResponse.json()).result.content[0].text).toContain('"userId":"bob"')
  expect((await aliceResponse.json()).result.content[0].text).toContain('"userId":"alice"')
})

test('rejects invalid host, origin, method, content type, and protocol version before tool access', async () => {
  const { handler, calls } = makeHandler()
  const wrongHost = await handler(
    rpcRequest(
      'tools/call',
      { name: definition.name, arguments: { eventId: 'must-not-run' } },
      { token: 'alice-read', host: 'attacker.example' }
    )
  )
  const wrongOrigin = await handler(
    rpcRequest(
      'tools/call',
      { name: definition.name, arguments: { eventId: 'must-not-run' } },
      { token: 'alice-read', origin: 'https://attacker.example' }
    )
  )
  const wrongMethod = await handler(new Request(endpoint, { method: 'GET' }))
  const wrongContentType = await handler(
    rpcRequest(
      'tools/call',
      { name: definition.name, arguments: { eventId: 'must-not-run' } },
      { token: 'alice-read', contentType: 'text/plain' }
    )
  )
  const wrongVersion = await handler(
    rpcRequest(
      'tools/call',
      { name: definition.name, arguments: { eventId: 'must-not-run' } },
      { token: 'alice-read', protocolVersion: '1900-01-01' }
    )
  )

  expect(wrongHost.status).toBe(403)
  expect(wrongOrigin.status).toBe(403)
  expect(wrongMethod.status).toBe(405)
  expect(wrongMethod.headers.get('allow')).toBe('POST')
  expect(wrongContentType.status).toBe(415)
  expect(wrongVersion.status).toBe(400)
  expect(calls).toEqual([])
})

test('allows requests without Origin and rejects oversized and malformed bodies without invoking tools', async () => {
  const { handler, calls } = makeHandler()
  const noOrigin = await handler(rpcRequest('tools/list', {}, { token: 'alice-read' }))
  const oversized = await handler(
    new Request(endpoint, {
      method: 'POST',
      headers: {
        authorization: 'Bearer alice-read',
        'content-type': 'application/json',
        'MCP-Protocol-Version': '2026-07-28',
        'Mcp-Method': 'tools/list',
      },
      body: ' '.repeat(MCP_MAX_BODY_BYTES + 1),
    })
  )
  const malformed = await handler(
    new Request(endpoint, {
      method: 'POST',
      headers: {
        authorization: 'Bearer alice-read',
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
        'MCP-Protocol-Version': '2026-07-28',
        'Mcp-Method': 'tools/list',
      },
      body: '{',
    })
  )

  expect(noOrigin.status).toBe(200)
  expect(oversized.status).toBe(413)
  expect(malformed.status).toBe(400)
  expect(calls).toEqual([])
})

test('accepts canonical HTTPS behind TLS termination without trusting forwarded host', async () => {
  const { handler } = makeHandler()
  function proxiedRequest(url: string, host: string, protocol?: string) {
    const original = rpcRequest('tools/list', {}, { token: 'alice-read', host })
    if (protocol) original.headers.set('x-forwarded-proto', protocol)
    return new Request(url, original)
  }
  const accepted = await handler(
    proxiedRequest('http://app.example.com/api/mcp', 'app.example.com', 'https')
  )
  expect(accepted.status).toBe(200)
  const noForwardedTLS = await handler(
    proxiedRequest('http://app.example.com/api/mcp', 'app.example.com')
  )
  expect(noForwardedTLS.status).toBe(403)
  const wrongHost = await handler(
    proxiedRequest('http://attacker.example/api/mcp', 'attacker.example', 'https')
  )
  expect(wrongHost.status).toBe(403)
  const conflictingHost = await handler(
    proxiedRequest('http://app.example.com/api/mcp', 'attacker.example', 'https')
  )
  expect(conflictingHost.status).toBe(403)
  const forwardedHostOnly = proxiedRequest(
    'http://localhost:3003/api/mcp',
    'localhost:3003',
    'https'
  )
  forwardedHostOnly.headers.set('x-forwarded-host', 'app.example.com')
  expect((await handler(forwardedHostOnly)).status).toBe(403)
})

test('serves legacy initialization and calls with the same bearer identity and scopes', async () => {
  const calls: string[] = []
  const handler = createMcpHttpHandler({
    resource,
    authenticate: async (request, next) => {
      const token = request.headers.get('authorization')?.replace('Bearer ', '')
      if (token !== 'alice-read' && token !== 'alice-write')
        return Response.json({}, { status: 401 })
      return next(request, {
        sub: 'alice',
        client_id: 'client-a',
        scope: token === 'alice-write' ? 'gatherory:read gatherory:write' : 'gatherory:read',
      })
    },
    authorizeClaims: async (claims) => ({ userId: String(claims.sub) }),
    tools: [definition, { ...definition, name: 'create_idea', readOnly: false }],
    callTool: async (name, _input, actor) => {
      calls.push(`${actor.userId}:${name}`)
      return { ok: true }
    },
  })
  const legacy = (method: string, params: Record<string, unknown> = {}, token = 'alice-read') =>
    new Request(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': '2025-06-18',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        ...(method.startsWith('notifications/') ? {} : { id: 1 }),
        method,
        params,
      }),
    })
  const initialized = await handler(
    legacy('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'real-client-regression', version: '1' },
    })
  )
  expect(initialized.status).toBe(200)
  expect(await initialized.text()).toContain('2025-06-18')
  expect((await handler(legacy('notifications/initialized'))).status).toBe(202)
  expect((await handler(legacy('tools/list'))).status).toBe(200)
  const missing = legacy('tools/list')
  missing.headers.delete('authorization')
  expect((await handler(missing)).status).toBe(401)
  const denied = await handler(
    legacy('tools/call', { name: 'create_idea', arguments: { eventId: 'event-1' } })
  )
  expect(denied.status).toBe(403)
  expect(calls).toEqual([])
  const accepted = await handler(
    legacy('tools/call', { name: 'create_idea', arguments: { eventId: 'event-1' } }, 'alice-write')
  )
  expect(accepted.status).toBe(200)
  expect(calls).toEqual(['alice:create_idea'])
})

test('advertises append-only creation separately from edits while preserving write scopes', async () => {
  const handler = createMcpHttpHandler({
    resource,
    authenticate: async (request, next) =>
      next(request, { sub: 'alice', scope: 'gatherory:read gatherory:write' }),
    authorizeClaims: async () => ({ userId: 'alice' }),
    tools: [
      definition,
      { ...definition, name: 'create_event', readOnly: false },
      { ...definition, name: 'update_event', readOnly: false },
    ],
    callTool: async () => ({ ok: true }),
  })
  const result = await (
    await handler(rpcRequest('tools/list', {}, { token: 'alice-write' }))
  ).json()
  const tools = result.result.tools as Array<{
    name: string
    annotations: { readOnlyHint: boolean; destructiveHint: boolean }
  }>
  expect(tools.find((t) => t.name === 'create_event')?.annotations).toMatchObject({
    readOnlyHint: false,
    destructiveHint: false,
  })
  expect(tools.find((t) => t.name === 'update_event')?.annotations).toMatchObject({
    readOnlyHint: false,
    destructiveHint: true,
  })
  expect(tools.find((t) => t.name === 'list_ideas')?.annotations).toMatchObject({
    readOnlyHint: true,
    destructiveHint: false,
  })
})

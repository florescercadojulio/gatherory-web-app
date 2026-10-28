import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createMcpProtectedRequestHandler } from '@better-auth/mcp'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { expect, test } from 'vitest'
import { z } from 'zod'

import { createMcpHttpHandler } from '@/server/mcp/http'

const issuer = 'https://auth.example.test'
const resource = 'https://app.example.test/mcp'
const endpoint = 'https://app.example.test/mcp'
const signingKeyId = 'ephemeral-test-key'

function unsignedToken() {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      iss: issuer,
      aud: resource,
      sub: 'unsigned-account',
      scope: 'gatherory:read',
      exp: Math.floor(Date.now() / 1_000) + 300,
    })
  ).toString('base64url')
  return `${header}.${payload}.`
}

async function signedToken(
  privateKey: CryptoKey,
  claims: {
    issuer?: string
    audience?: string
    scope?: string
    subject?: string
    expired?: boolean
  } = {}
) {
  const token = new SignJWT({ scope: claims.scope ?? 'gatherory:read', client_id: 'test-client' })
    .setProtectedHeader({ alg: 'RS256', kid: signingKeyId })
    .setIssuer(claims.issuer ?? issuer)
    .setAudience(claims.audience ?? resource)
    .setSubject(claims.subject ?? 'account-1')
    .setIssuedAt()
    .setExpirationTime(claims.expired ? Math.floor(Date.now() / 1_000) - 60 : '5 minutes')
  return token.sign(privateKey)
}

function mcpCall(token: string | null, cookie?: string, toolName = 'list_ideas') {
  const headers = new Headers({
    'content-type': 'application/json',
    'MCP-Protocol-Version': '2026-07-28',
    'Mcp-Method': 'tools/call',
    'Mcp-Name': toolName,
    origin: 'https://app.example.test',
  })
  if (token !== null) headers.set('authorization', `Bearer ${token}`)
  if (cookie) headers.set('cookie', cookie)
  return new Request(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: { eventId: 'event-1' },
        _meta: {
          'io.modelcontextprotocol/protocolVersion': '2026-07-28',
          'io.modelcontextprotocol/clientInfo': { name: 'token-contract-test', version: '1.0.0' },
          'io.modelcontextprotocol/clientCapabilities': {},
        },
      },
    }),
  })
}

test('Better Auth MCP verifier enforces JWT issuer, audience, expiry, signature, bearer, and scopes', async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256')
  const wrongPair = await generateKeyPair('RS256')
  const jwk = await exportJWK(publicKey)
  const jwks = JSON.stringify({ keys: [{ ...jwk, kid: signingKeyId, alg: 'RS256', use: 'sig' }] })
  const jwksRequests: string[] = []
  const jwksServer = createServer((request, response) => {
    jwksRequests.push(request.url ?? '')
    response.writeHead(200, {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=60',
    })
    response.end(jwks)
  })
  await new Promise<void>((resolve, reject) => {
    jwksServer.once('error', reject)
    jwksServer.listen(0, '127.0.0.1', resolve)
  })

  try {
    const address = jwksServer.address() as AddressInfo
    const verifierOptions = {
      issuer,
      audience: resource,
      jwksUrl: `http://127.0.0.1:${address.port}/jwks`,
      requiredScopes: ['gatherory:read'],
    } as const
    const calls: Array<{ name: string; userId: string }> = []
    const handler = createMcpHttpHandler({
      resource,
      authenticate: (request, next) =>
        createMcpProtectedRequestHandler(verifierOptions, (verifiedRequest, claims) =>
          next(verifiedRequest, claims)
        )(request),
      authorizeClaims: async (claims) =>
        typeof claims.sub === 'string' ? { userId: claims.sub } : null,
      tools: [
        {
          name: 'list_ideas',
          description: 'List event ideas.',
          inputSchema: z.object({ eventId: z.string() }),
          readOnly: true,
        },
        {
          name: 'create_idea',
          description: 'Create an event idea.',
          inputSchema: z.object({ eventId: z.string() }),
          readOnly: false,
        },
      ],
      callTool: async (name, _input, actor) => {
        calls.push({ name, userId: actor.userId })
        return { owner: actor.userId, ideas: [] }
      },
    })

    const valid = await signedToken(privateKey)
    const validResponse = await handler(mcpCall(valid))
    expect(validResponse.status).toBe(200)
    expect(calls).toEqual([{ name: 'list_ideas', userId: 'account-1' }])

    const invalidTokens = [
      await signedToken(privateKey, { issuer: 'https://wrong-issuer.example.test' }),
      await signedToken(privateKey, { audience: 'https://other-resource.example.test' }),
      await signedToken(privateKey, { expired: true }),
      await signedToken(wrongPair.privateKey),
      unsignedToken(),
      'opaque-access-token',
    ]
    for (const token of invalidTokens) {
      const response = await handler(mcpCall(token))
      expect(response.status, `token ${token.slice(0, 12)}… must not authenticate`).toBe(401)
      expect(response.headers.get('www-authenticate')).toContain('Bearer')
    }

    const cookieOnly = await handler(mcpCall(null, 'better-auth.session_token=browser-session'))
    expect(cookieOnly.status).toBe(401)
    const writeWithReadToken = await handler(mcpCall(valid, undefined, 'create_idea'))
    expect(writeWithReadToken.status).toBe(403)
    expect(writeWithReadToken.headers.get('www-authenticate')).toContain('gatherory:write')
    const missingReadScopeToken = await signedToken(privateKey, { scope: 'gatherory:write' })
    const missingReadScope = await handler(mcpCall(missingReadScopeToken))
    expect(missingReadScope.status).toBe(403)
    expect(missingReadScope.headers.get('www-authenticate')).toContain('insufficient_scope')
    expect(calls).toEqual([{ name: 'list_ideas', userId: 'account-1' }])
    expect(jwksRequests).toEqual(['/jwks'])
  } finally {
    await new Promise<void>((resolve, reject) => {
      jwksServer.close((error) => (error ? reject(error) : resolve()))
    })
  }
})

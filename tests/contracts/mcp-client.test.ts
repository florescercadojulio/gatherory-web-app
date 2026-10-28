import { expect, test, vi } from 'vitest'
import { createAuthClient } from 'better-auth/react'
import { oauthProviderClient } from '@better-auth/oauth-provider/client'

const signedParams = new URLSearchParams({
  response_type: 'code',
  client_id: 'mcp-client-1',
  scope: 'gatherory:read gatherory:write',
  state: 'signed-state',
  redirect_uri: 'https://assistant.example.test/callback',
  sig: 'signed-integrity-tag',
  ba_iat: '1792939200',
})
for (const name of [
  'ba_param',
  'client_id',
  'redirect_uri',
  'response_type',
  'scope',
  'sig',
  'state',
])
  signedParams.append('ba_param', name)
const signedQuery = signedParams.toString()

function requestClient(search: string) {
  vi.stubGlobal('window', { location: { search } })
  const requests: Array<{ url: string; body: Record<string, unknown> }> = []
  const client = createAuthClient({
    baseURL: 'https://gatherory.example.test/api/auth',
    plugins: [oauthProviderClient()],
    fetchOptions: {
      customFetchImpl: async (input, init) => {
        const request = input instanceof Request ? input : new Request(input, init)
        requests.push({
          url: new URL(request.url).pathname,
          body: await request.json().catch(() => ({})),
        })
        return Response.json({ url: `/mcp/consent?${signedQuery}` })
      },
    },
  })
  return { client, requests }
}

test('Better Auth browser plugin forwards only signed OAuth query fields on email, social, and consent requests', async () => {
  const { client, requests } = requestClient(
    `?${signedQuery}&tracking=must-not-forward&error=access_denied`
  )

  const emailResult = await client.signIn.email({
    email: 'mcp@example.test',
    password: 'synthetic-test-password',
  })
  await client.signIn.social({
    provider: 'google',
    callbackURL: `/mcp/connect?${signedQuery}`,
    errorCallbackURL: `/mcp/connect?${signedQuery}`,
  })
  await client.oauth2.consent({ accept: true, scope: 'gatherory:read gatherory:write' })

  // Better Auth's verified response URL is the continuation source after a
  // password sign-in; the client must preserve it for the MCP consent handoff.
  expect(emailResult.data?.url).toBe(`/mcp/consent?${signedQuery}`)

  expect(requests.map((request) => request.url)).toEqual([
    '/api/auth/sign-in/email',
    '/api/auth/sign-in/social',
    '/api/auth/oauth2/consent',
  ])
  for (const request of requests) {
    expect(request.body.oauth_query).toBeTruthy()
    const forwarded = new URLSearchParams(String(request.body.oauth_query))
    expect(forwarded.get('sig')).toBe('signed-integrity-tag')
    expect(forwarded.get('state')).toBe('signed-state')
    expect(forwarded.has('tracking')).toBe(false)
    expect(forwarded.has('error')).toBe(false)
  }
  expect(requests[1]?.body.callbackURL).toBe(`/mcp/connect?${signedQuery}`)
  expect(requests[1]?.body.errorCallbackURL).toBe(`/mcp/connect?${signedQuery}`)
})

test('Better Auth browser plugin leaves non-OAuth requests unchanged when no signed OAuth query is present', async () => {
  const { client, requests } = requestClient('?redirectTo=%2Fevents')

  await client.signIn.email({ email: 'person@example.test', password: 'synthetic-test-password' })
  await client.signOut()

  expect(requests).toHaveLength(2)
  expect(requests[0]?.body).toEqual({
    email: 'person@example.test',
    password: 'synthetic-test-password',
  })
  expect(requests[1]?.url).toBe('/api/auth/sign-out')
})

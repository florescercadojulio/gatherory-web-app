import { createHash, randomBytes } from 'node:crypto'
import { expect, test, vi } from 'vitest'
import { betterAuth } from 'better-auth'
import { createMcpAuthPlugins, mcpResourceURL } from '@/server/mcp/auth-config'
import { mcpAuthorizationResumeURL, mcpSocialSignInOptions } from '@/lib/mcp-connection'

const origin = 'https://gatherory.test'
const authBaseURL = `${origin}/api/auth`
const clientId = 'synthetic-mcp-client'
const redirectURI = 'https://assistant.example.test/callback'
const resource = mcpResourceURL(authBaseURL)

function authRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('origin', origin)
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json')
  return new Request(new URL(path, origin), { ...init, headers })
}

function cookieHeader(response: Response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';', 1)[0])
    .join('; ')
}

async function postJSON(
  auth: { handler(request: Request): Promise<Response> },
  path: string,
  body: unknown,
  cookie?: string
) {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (cookie) headers.set('cookie', cookie)
  return auth.handler(authRequest(path, { method: 'POST', headers, body: JSON.stringify(body) }))
}

test.each(['google', 'apple'] as const)(
  'Better Auth %s authorization-code success and cancellation preserve MCP recovery context',
  async (provider) => {
    const auth = betterAuth({
      appName: 'Gatherory MCP social fixture',
      baseURL: authBaseURL,
      secret: randomBytes(32).toString('base64url'),
      trustedOrigins: [origin],
      socialProviders:
        provider === 'google'
          ? {
              google: {
                clientId: 'google-fixture',
                clientSecret: 'synthetic-only-secret',
                getUserInfo: async () => ({
                  user: {
                    name: 'Synthetic Google User',
                    email: 'google-social@example.test',
                    emailVerified: true,
                  },
                  data: {
                    sub: 'synthetic-google-subject',
                    name: 'Synthetic Google User',
                    email: 'google-social@example.test',
                    email_verified: true,
                  } as never,
                }),
              },
            }
          : {
              apple: {
                clientId: 'apple-fixture',
                clientSecret: 'synthetic-only-secret',
                getUserInfo: async () => ({
                  user: {
                    name: 'Synthetic Apple User',
                    email: 'apple-social@example.test',
                    emailVerified: true,
                  },
                  data: {
                    sub: 'synthetic-apple-subject',
                    name: 'Synthetic Apple User',
                    email: 'apple-social@example.test',
                    email_verified: true,
                  } as never,
                }),
              },
            },
      plugins: [...createMcpAuthPlugins(authBaseURL)],
    })

    const context = await auth.$context
    const now = new Date()
    const scopes = ['gatherory:read', 'gatherory:write']
    const verifier = randomBytes(32).toString('base64url')
    const challenge = createHash('sha256').update(verifier).digest('base64url')
    await context.adapter.create({
      model: 'oauthClient',
      data: {
        clientId,
        clientSecret: null,
        clientDiscoveryId: null,
        disabled: false,
        skipConsent: false,
        scopes,
        redirectUris: [redirectURI],
        tokenEndpointAuthMethod: 'none',
        grantTypes: ['authorization_code'],
        responseTypes: ['code'],
        applicationType: 'native',
        requirePKCE: true,
        createdAt: now,
        updatedAt: now,
      },
    })
    await context.adapter.create({
      model: 'oauthClientResource',
      data: { clientId, resourceId: resource, createdAt: now },
    })
    const start = await auth.handler(
      authRequest(
        `/api/auth/oauth2/authorize?${new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          scope: scopes.join(' '),
          state: 'synthetic-mcp-state',
          redirect_uri: redirectURI,
          code_challenge: challenge,
          code_challenge_method: 'S256',
          resource,
        })}`
      )
    )
    expect(start.status).toBe(302)
    const connectURL = new URL(start.headers.get('location')!, origin)
    expect(connectURL.pathname).toBe('/mcp/connect')
    const signedQuery = connectURL.searchParams.toString()
    const callback = mcpSocialSignInOptions(provider, `?${signedQuery}&tracking=discarded`)

    const tamperedQuery = new URLSearchParams(signedQuery)
    tamperedQuery.set('code_challenge', 'tampered-challenge')
    const tamperedSignIn = await postJSON(auth, '/api/auth/sign-in/social', {
      ...callback,
      oauth_query: tamperedQuery.toString(),
    })
    expect(tamperedSignIn.status).toBe(400)
    expect((await tamperedSignIn.json()).url).toBeUndefined()

    const response = await auth.handler(
      authRequest('/api/auth/sign-in/social', {
        method: 'POST',
        body: JSON.stringify({ ...callback, oauth_query: signedQuery }),
      })
    )
    expect(response.status).toBe(200)
    const { url } = (await response.json()) as { url: string }
    const authCookies = cookieHeader(response)
    const providerURL = new URL(url)
    expect(providerURL.searchParams.get('state')).toBeTruthy()
    expect(providerURL.searchParams.get('redirect_uri')).toBe(`${authBaseURL}/callback/${provider}`)

    const missingStateCallback = await auth.handler(
      authRequest(`/api/auth/callback/${provider}?code=synthetic-code`, {
        headers: { cookie: authCookies },
      })
    )
    expect(missingStateCallback.status).toBe(302)
    const missingStateURL = new URL(missingStateCallback.headers.get('location')!, origin)
    expect(missingStateURL.searchParams.get('error')).toBe('state_not_found')
    expect(missingStateURL.searchParams.has('code')).toBe(false)

    const wrongStateCallback = await auth.handler(
      authRequest(
        `/api/auth/callback/${provider}?${new URLSearchParams({
          code: 'synthetic-code',
          state: 'wrong-provider-state',
        })}`,
        { headers: { cookie: authCookies } }
      )
    )
    expect(wrongStateCallback.status).toBe(302)
    const wrongStateURL = new URL(wrongStateCallback.headers.get('location')!, origin)
    expect(wrongStateURL.searchParams.get('error')).toBe('state_mismatch')
    expect(wrongStateURL.searchParams.has('code')).toBe(false)

    const returned = await auth.handler(
      authRequest(
        `/api/auth/callback/${provider}?${new URLSearchParams({
          error: 'access_denied',
          state: providerURL.searchParams.get('state')!,
        })}`,
        { headers: { cookie: authCookies } }
      )
    )
    expect(returned.status).toBe(302)
    const errorURL = new URL(returned.headers.get('location')!, origin)
    expect(errorURL.pathname).toBe('/mcp/connect')
    expect(errorURL.searchParams.get('error')).toBe('access_denied')
    expect(errorURL.searchParams.get('state')).toBe('synthetic-mcp-state')
    expect(errorURL.searchParams.get('code_challenge')).toBe(challenge)
    expect(errorURL.searchParams.has('tracking')).toBe(false)
    expect(errorURL.searchParams.get('sig')).toBe(connectURL.searchParams.get('sig'))
    expect(errorURL.searchParams.has('code')).toBe(false)

    const retry = await auth.handler(
      authRequest('/api/auth/sign-in/social', {
        method: 'POST',
        body: JSON.stringify({ ...callback, oauth_query: signedQuery }),
      })
    )
    const retryCookies = cookieHeader(retry)
    const { url: retryURL } = (await retry.json()) as { url: string }
    const retryState = new URL(retryURL).searchParams.get('state')!
    const originalFetch = globalThis.fetch
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const tokenEndpoint =
        provider === 'google' ? 'oauth2.googleapis.com/token' : 'appleid.apple.com/auth/token'
      if (String(input).includes(tokenEndpoint))
        return Response.json({ access_token: 'synthetic-access-token', token_type: 'Bearer' })
      throw new Error(`Unexpected synthetic provider request: ${String(input)}`)
    })
    try {
      let completed: Response
      if (provider === 'apple') {
        const formResponse = await auth.handler(
          authRequest('/api/auth/callback/apple', {
            method: 'POST',
            headers: {
              cookie: retryCookies,
              'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ code: 'synthetic-authorization-code', state: retryState }),
          })
        )
        const callbackLocation = new URL(formResponse.headers.get('location')!, origin)
        completed = await auth.handler(
          authRequest(`${callbackLocation.pathname}${callbackLocation.search}`, {
            headers: { cookie: retryCookies },
          })
        )
      } else {
        completed = await auth.handler(
          authRequest(
            `/api/auth/callback/google?${new URLSearchParams({
              code: 'synthetic-authorization-code',
              state: retryState,
            })}`,
            { headers: { cookie: retryCookies } }
          )
        )
      }
      expect(completed.status).toBe(302)
      const completedURL = new URL(completed.headers.get('location')!, origin)
      expect(completedURL.pathname).toBe('/mcp/connect')
      const replayedProviderCallback = await auth.handler(
        authRequest(
          `/api/auth/callback/${provider}?${new URLSearchParams({
            code: 'synthetic-authorization-code',
            state: retryState,
          })}`,
          { headers: { cookie: cookieHeader(completed) } }
        )
      )
      expect(replayedProviderCallback.status).toBe(302)
      const providerReplayURL = new URL(replayedProviderCallback.headers.get('location')!, origin)
      expect(providerReplayURL.searchParams.has('code')).toBe(false)
      const resumeURL = mcpAuthorizationResumeURL(completedURL.search)
      expect(resumeURL).toBeTruthy()
      const consentURL = new URL(resumeURL!, origin)
      expect(consentURL.pathname).toBe('/mcp/consent')
      expect(consentURL.searchParams.get('state')).toBe('synthetic-mcp-state')
      expect(consentURL.searchParams.get('code_challenge')).toBe(challenge)
      expect(consentURL.searchParams.get('client_id')).toBe(clientId)

      const sessionCookie = cookieHeader(completed)
      const promptLogin = await auth.handler(
        authRequest(
          `/api/auth/oauth2/authorize?${new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            scope: scopes.join(' '),
            state: 'synthetic-prompt-login-state',
            redirect_uri: redirectURI,
            code_challenge: challenge,
            code_challenge_method: 'S256',
            resource,
            prompt: 'login',
          })}`,
          { headers: { cookie: sessionCookie } }
        )
      )
      expect(promptLogin.status).toBe(302)
      const promptLoginURL = new URL(promptLogin.headers.get('location')!, origin)
      expect(promptLoginURL.pathname).toBe('/mcp/connect')
      expect(promptLoginURL.searchParams.get('prompt')).toBe('login')
      const staleSessionConsentURL = new URL(
        mcpAuthorizationResumeURL(promptLoginURL.search)!,
        origin
      )
      expect(staleSessionConsentURL.pathname).toBe('/mcp/consent')
      const staleSessionConsent = await postJSON(
        auth,
        '/api/auth/oauth2/consent',
        {
          accept: true,
          scope: scopes.join(' '),
          oauth_query: staleSessionConsentURL.searchParams.toString(),
        },
        sessionCookie
      )
      expect(staleSessionConsent.status).toBe(200)
      const staleSessionRedirect = new URL(
        ((await staleSessionConsent.json()) as { url: string }).url,
        origin
      )
      expect(staleSessionRedirect.pathname).toBe('/mcp/connect')
      expect(staleSessionRedirect.searchParams.get('prompt')).toBe('login')
      expect(staleSessionRedirect.searchParams.has('code')).toBe(false)

      const promptSignInOptions = mcpSocialSignInOptions(provider, promptLoginURL.search)
      const promptProviderStart = await postJSON(auth, '/api/auth/sign-in/social', {
        ...promptSignInOptions,
        oauth_query: promptLoginURL.searchParams.toString(),
      })
      expect(promptProviderStart.status).toBe(200)
      const promptProviderCookies = cookieHeader(promptProviderStart)
      const { url: promptProviderAuthorizeURL } = (await promptProviderStart.json()) as {
        url: string
      }
      const promptProviderState = new URL(promptProviderAuthorizeURL).searchParams.get('state')!
      let freshPromptLoginCallback: Response
      if (provider === 'apple') {
        const formResponse = await auth.handler(
          authRequest('/api/auth/callback/apple', {
            method: 'POST',
            headers: {
              cookie: promptProviderCookies,
              'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              code: 'synthetic-prompt-login-authorization-code',
              state: promptProviderState,
            }),
          })
        )
        const callbackLocation = new URL(formResponse.headers.get('location')!, origin)
        freshPromptLoginCallback = await auth.handler(
          authRequest(`${callbackLocation.pathname}${callbackLocation.search}`, {
            headers: { cookie: promptProviderCookies },
          })
        )
      } else {
        freshPromptLoginCallback = await auth.handler(
          authRequest(
            `/api/auth/callback/google?${new URLSearchParams({
              code: 'synthetic-prompt-login-authorization-code',
              state: promptProviderState,
            })}`,
            { headers: { cookie: promptProviderCookies } }
          )
        )
      }
      expect(freshPromptLoginCallback.status).toBe(302)
      const freshPromptLoginReturn = new URL(
        freshPromptLoginCallback.headers.get('location')!,
        origin
      )
      expect(freshPromptLoginReturn.pathname).toBe('/mcp/connect')
      expect(freshPromptLoginReturn.searchParams.get('prompt')).toBe('login')
      const freshPromptConsentURL = new URL(
        mcpAuthorizationResumeURL(freshPromptLoginReturn.search)!,
        origin
      )
      expect(freshPromptConsentURL.pathname).toBe('/mcp/consent')
      const freshPromptConsent = await postJSON(
        auth,
        '/api/auth/oauth2/consent',
        {
          accept: true,
          scope: scopes.join(' '),
          oauth_query: freshPromptConsentURL.searchParams.toString(),
        },
        cookieHeader(freshPromptLoginCallback)
      )
      expect(freshPromptConsent.status).toBe(200)
      const freshPromptCallbackURL = new URL(
        ((await freshPromptConsent.json()) as { url: string }).url,
        origin
      )
      expect(freshPromptCallbackURL.origin + freshPromptCallbackURL.pathname).toBe(redirectURI)
      expect(freshPromptCallbackURL.searchParams.get('state')).toBe('synthetic-prompt-login-state')
      const freshPromptCode = freshPromptCallbackURL.searchParams.get('code')
      expect(freshPromptCode).toBeTruthy()
      const promptTokenResponse = await auth.handler(
        authRequest('/api/auth/oauth2/token', {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            code: freshPromptCode!,
            redirect_uri: redirectURI,
            code_verifier: verifier,
            resource,
          }),
        })
      )
      expect(promptTokenResponse.status).toBe(200)

      const denied = await postJSON(
        auth,
        '/api/auth/oauth2/consent',
        {
          accept: false,
          oauth_query: consentURL.searchParams.toString(),
        },
        sessionCookie
      )
      expect(denied.status).toBe(200)
      const deniedURL = new URL(((await denied.json()) as { url: string }).url, origin)
      expect(deniedURL.origin + deniedURL.pathname).toBe(redirectURI)
      expect(deniedURL.searchParams.get('error')).toBe('access_denied')
      expect(deniedURL.searchParams.get('state')).toBe('synthetic-mcp-state')
      expect(deniedURL.searchParams.has('code')).toBe(false)

      const freshState = 'synthetic-mcp-state-after-denial'
      const freshAuthorize = await auth.handler(
        authRequest(
          `/api/auth/oauth2/authorize?${new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            scope: scopes.join(' '),
            state: freshState,
            redirect_uri: redirectURI,
            code_challenge: challenge,
            code_challenge_method: 'S256',
            resource,
            prompt: 'consent',
          })}`,
          { headers: { cookie: sessionCookie } }
        )
      )
      expect(freshAuthorize.status).toBe(302)
      const freshConsentURL = new URL(freshAuthorize.headers.get('location')!, origin)
      expect(freshConsentURL.pathname).toBe('/mcp/consent')
      expect(freshConsentURL.searchParams.get('state')).toBe(freshState)
      const accepted = await postJSON(
        auth,
        '/api/auth/oauth2/consent',
        {
          accept: true,
          scope: scopes.join(' '),
          oauth_query: freshConsentURL.searchParams.toString(),
        },
        sessionCookie
      )
      expect(accepted.status).toBe(200)
      const acceptedURL = new URL(((await accepted.json()) as { url: string }).url, origin)
      expect(acceptedURL.origin + acceptedURL.pathname).toBe(redirectURI)
      expect(acceptedURL.searchParams.get('state')).toBe(freshState)
      const authorizationCode = acceptedURL.searchParams.get('code')
      expect(authorizationCode).toBeTruthy()

      const tokenEndpoint = '/api/auth/oauth2/token'
      const tokenRequest = (code: string, codeVerifier: string) =>
        auth.handler(
          authRequest(tokenEndpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: clientId,
              code,
              redirect_uri: redirectURI,
              code_verifier: codeVerifier,
              resource,
            }),
          })
        )
      const wrongVerifier = await tokenRequest(authorizationCode!, 'incorrect-verifier-for-pkce')
      expect(wrongVerifier.status).toBe(400)

      const validState = 'synthetic-mcp-state-valid-pkce'
      const validAuthorize = await auth.handler(
        authRequest(
          `/api/auth/oauth2/authorize?${new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            scope: scopes.join(' '),
            state: validState,
            redirect_uri: redirectURI,
            code_challenge: challenge,
            code_challenge_method: 'S256',
            resource,
            prompt: 'consent',
          })}`,
          { headers: { cookie: sessionCookie } }
        )
      )
      expect(validAuthorize.status).toBe(302)
      const validConsentURL = new URL(validAuthorize.headers.get('location')!, origin)
      const validConsent = await postJSON(
        auth,
        '/api/auth/oauth2/consent',
        {
          accept: true,
          scope: scopes.join(' '),
          oauth_query: validConsentURL.searchParams.toString(),
        },
        sessionCookie
      )
      expect(validConsent.status).toBe(200)
      const validCallbackURL = new URL(((await validConsent.json()) as { url: string }).url, origin)
      expect(validCallbackURL.searchParams.get('state')).toBe(validState)
      const validCode = validCallbackURL.searchParams.get('code')!

      const tokenResponse = await tokenRequest(validCode, verifier)
      expect(tokenResponse.status).toBe(200)
      const tokenSet = (await tokenResponse.json()) as { access_token?: string; scope?: string }
      expect(tokenSet.access_token).toBeTruthy()
      expect(tokenSet.scope?.split(' ')).toEqual(expect.arrayContaining(scopes))
      const replayedCode = await tokenRequest(validCode, verifier)
      expect(replayedCode.status).toBe(400)
    } finally {
      vi.stubGlobal('fetch', originalFetch)
    }
  }
)

test('MCP social callback construction excludes unsigned and malformed request values', () => {
  const callback = mcpSocialSignInOptions(
    'google',
    '?client_id=client&sig=signature&ba_param=client_id&ba_param=state&state=state&redirectTo=https%3A%2F%2Fevil.test'
  )
  expect(callback.callbackURL).toBe(
    '/mcp/connect?client_id=client&sig=signature&ba_param=client_id&ba_param=state&state=state'
  )
  expect(callback.errorCallbackURL).toBe(callback.callbackURL)
})

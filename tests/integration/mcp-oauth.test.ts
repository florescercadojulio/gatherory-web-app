import { randomBytes, createHash } from 'node:crypto'
import { expect, test } from 'vitest'
import { createLocalJWKSet, jwtVerify } from 'jose'
import { betterAuth } from 'better-auth'
import type { HookEndpointContext } from '@better-auth/core'
import { createAuthMiddleware } from 'better-auth/api'
import { createMcpAuthPlugins, mcpResourceURL } from '@/server/mcp/auth-config'
import { createMcpClaimsAuthorizer } from '@/server/mcp/authorization'
import { hashMcpOAuthToken } from '@/server/mcp/refresh-grant-guard'

const origin = 'https://gatherory.test'
const basePath = '/api/auth'
const authBaseURL = `${origin}${basePath}`
const resource = mcpResourceURL(authBaseURL)
const clientId = 'fixture-mcp-client'
const redirectURI = 'https://assistant.example.test/oauth/callback'
const scopes = ['gatherory:read', 'gatherory:write', 'offline_access']

function authRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('origin', origin)
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json')
  return new Request(new URL(path, origin), { ...init, headers })
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

function refreshRequest(token: string, options: { clientId?: string; scope?: string } = {}) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: options.clientId ?? clientId,
    refresh_token: token,
    resource,
  })
  if (options.scope) body.set('scope', options.scope)
  return authRequest(`${basePath}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
}

async function expectOAuthError(response: Response, error: string) {
  expect(response.status).toBe(400)
  expect(await response.json()).toMatchObject({ error })
}

let revokeConsentDuringRefresh: { token: string; consentId: string } | null = null
let revokeRaceHookRan = false
const revokeDuringRefreshFixture = {
  id: 'mcp-refresh-revoke-race-fixture',
  hooks: {
    before: [
      {
        matcher: (ctx: { path?: string }) => ctx.path === '/oauth2/token',
        handler: createAuthMiddleware({}, async (input) => {
          const ctx = input as unknown as HookEndpointContext
          const body = ctx.body as { grant_type?: unknown; refresh_token?: unknown } | undefined
          const revokeTarget = revokeConsentDuringRefresh
          if (
            revokeTarget &&
            body?.grant_type === 'refresh_token' &&
            body.refresh_token === revokeTarget.token
          ) {
            revokeRaceHookRan = true
            await ctx.context.adapter.delete({
              model: 'oauthConsent',
              where: [{ field: 'id', value: revokeTarget.consentId }],
            })
            revokeConsentDuringRefresh = null
          }
        }),
      },
    ],
  },
}

function cookieHeader(response: Response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';', 1)[0])
    .join('; ')
}

function pkceChallenge(verifier: string) {
  return createHash('sha256').update(verifier).digest('base64url')
}

function authorizeURL(input: {
  clientId: string
  state: string
  challenge: string
  prompt?: string
}) {
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: input.clientId,
    redirect_uri: redirectURI,
    scope: scopes.join(' '),
    state: input.state,
    code_challenge: input.challenge,
    code_challenge_method: 'S256',
    resource,
  })
  if (input.prompt) query.set('prompt', input.prompt)
  return `${basePath}/oauth2/authorize?${query}`
}

test('Better Auth MCP OAuth discovery, signed login context, consent, PKCE, audience, refresh and revocation', async () => {
  const auth = betterAuth({
    appName: 'Gatherory MCP contract fixture',
    baseURL: origin,
    secret: randomBytes(32).toString('base64url'),
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    trustedOrigins: [origin],
    // Better Auth selects its installed memory adapter when `database` is omitted.
    plugins: [...createMcpAuthPlugins(authBaseURL), revokeDuringRefreshFixture],
  })

  const metadata = await auth.handler(
    authRequest('/.well-known/oauth-authorization-server/api/auth')
  )
  if (metadata.status !== 200)
    throw new Error(`metadata ${metadata.status}: ${await metadata.text()}`)
  const metadataBody = await metadata.json()
  expect(metadataBody.authorization_endpoint).toBe(`${authBaseURL}/oauth2/authorize`)
  expect(metadataBody.token_endpoint).toBe(`${authBaseURL}/oauth2/token`)
  expect(metadataBody.scopes_supported).toEqual(expect.arrayContaining(scopes))

  const resourceMetadata = await auth.handler(
    authRequest('/.well-known/oauth-protected-resource/mcp')
  )
  expect(resourceMetadata.status).toBe(200)
  const resourceMetadataBody = await resourceMetadata.json()
  expect(resourceMetadataBody).toEqual(
    expect.objectContaining({
      resource,
      authorization_servers: [authBaseURL],
      bearer_methods_supported: ['header'],
      scopes_supported: expect.arrayContaining(['gatherory:read', 'gatherory:write']),
    })
  )
  // offline_access controls refresh-token issuance and is intentionally omitted
  // from protected-resource capability metadata.
  expect(resourceMetadataBody.scopes_supported).not.toContain('offline_access')

  const context = await auth.$context
  const now = new Date()
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
      grantTypes: ['authorization_code', 'refresh_token'],
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

  const signup = await postJSON(auth, `${basePath}/sign-up/email`, {
    name: 'MCP Test User',
    email: 'mcp-oauth@example.test',
    password: 'synthetic-password-for-test-only',
  })
  expect(signup.status).toBe(200)
  expect(cookieHeader(signup)).not.toBe('')
  const fixtureUser = await context.adapter.findOne<{ id: string }>({
    model: 'user',
    where: [{ field: 'email', value: 'mcp-oauth@example.test' }],
  })
  expect(fixtureUser).toBeTruthy()
  await context.adapter.update({
    model: 'user',
    where: [{ field: 'id', value: fixtureUser!.id }],
    update: { emailVerified: true },
  })

  const verifier = randomBytes(32).toString('base64url')
  const state = 'mcp-oauth-state-fixture'
  const initialAuthorize = await auth.handler(
    authRequest(
      authorizeURL({
        clientId,
        state,
        challenge: pkceChallenge(verifier),
      })
    )
  )
  expect(initialAuthorize.status).toBe(302)
  const connectURL = new URL(initialAuthorize.headers.get('location')!, origin)
  expect(connectURL.pathname).toBe('/mcp/connect')
  const signedLoginQuery = connectURL.searchParams.toString()
  expect(connectURL.searchParams.get('sig')).toBeTruthy()
  expect(connectURL.searchParams.get('client_id')).toBe(clientId)
  expect(connectURL.searchParams.get('state')).toBe(state)

  const tampered = new URLSearchParams(signedLoginQuery)
  tampered.set('state', 'attacker-state')
  const tamperedLogin = await postJSON(auth, `${basePath}/sign-in/email`, {
    email: 'mcp-oauth@example.test',
    password: 'synthetic-password-for-test-only',
    oauth_query: tampered.toString(),
  })
  expect(tamperedLogin.status).toBe(400)

  const signin = await postJSON(auth, `${basePath}/sign-in/email`, {
    email: 'mcp-oauth@example.test',
    password: 'synthetic-password-for-test-only',
    oauth_query: signedLoginQuery,
  })
  expect(signin.status).toBe(200)
  const sessionCookie = cookieHeader(signin)
  expect(sessionCookie).not.toBe('')
  const signinResult = await signin.json()
  expect(signinResult.url).toBeTruthy()

  const consentURL = new URL(signinResult.url, origin)
  expect(consentURL.pathname).toBe('/mcp/consent')
  const signedConsentQuery = consentURL.searchParams.toString()
  expect(consentURL.searchParams.get('state')).toBe(state)
  expect(consentURL.searchParams.get('code_challenge')).toBe(pkceChallenge(verifier))
  const tamperedConsentQuery = new URLSearchParams(signedConsentQuery)
  tamperedConsentQuery.set('code_challenge', pkceChallenge('different-verifier'))
  const tamperedConsent = await postJSON(
    auth,
    `${basePath}/oauth2/consent`,
    { accept: true, scope: scopes.join(' '), oauth_query: tamperedConsentQuery.toString() },
    sessionCookie
  )
  expect(tamperedConsent.status).toBe(400)
  const consent = await postJSON(
    auth,
    `${basePath}/oauth2/consent`,
    {
      accept: true,
      scope: scopes.join(' '),
      oauth_query: signedConsentQuery,
    },
    sessionCookie
  )
  expect(consent.status).toBe(200)
  const accepted = await consent.json()
  expect(accepted.url).toBeTruthy()

  const callback = new URL(accepted.url, origin)
  expect(callback.origin + callback.pathname).toBe(redirectURI)
  expect(callback.searchParams.get('state')).toBe(state)
  const code = callback.searchParams.get('code')
  expect(code).toBeTruthy()

  const tokenResponse = await auth.handler(
    authRequest(`${basePath}/oauth2/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code: code!,
        redirect_uri: redirectURI,
        code_verifier: verifier,
        resource,
      }),
    })
  )
  if (tokenResponse.status !== 200)
    throw new Error(`token response ${tokenResponse.status}: ${await tokenResponse.text()}`)
  const tokenSet = await tokenResponse.json()
  expect(tokenSet.access_token).toBeTruthy()
  expect(tokenSet.refresh_token).toBeTruthy()
  expect(String(tokenSet.scope).split(' ')).toEqual(expect.arrayContaining(scopes))
  const jwksResponse = await auth.handler(authRequest(`${basePath}/jwks`))
  expect(jwksResponse.status).toBe(200)
  const localJwks = createLocalJWKSet(await jwksResponse.json())
  const verifiedToken = await jwtVerify(tokenSet.access_token, localJwks, {
    issuer: authBaseURL,
    audience: resource,
  })
  expect(verifiedToken.payload.sub).toBeTruthy()
  expect(verifiedToken.payload.scope).toEqual(expect.stringContaining('gatherory:read'))
  expect(verifiedToken.payload.aud).toBe(resource)

  const pkceState = 'mcp-oauth-pkce-state-fixture'
  const pkceStart = await auth.handler(
    authRequest(
      authorizeURL({
        clientId,
        state: pkceState,
        challenge: pkceChallenge(verifier),
        prompt: 'consent',
      }),
      { headers: { cookie: sessionCookie } }
    )
  )
  expect(pkceStart.status).toBe(302)
  const pkceConsentURL = new URL(pkceStart.headers.get('location')!, origin)
  const pkceConsent = await postJSON(
    auth,
    `${basePath}/oauth2/consent`,
    { accept: true, scope: scopes.join(' '), oauth_query: pkceConsentURL.searchParams.toString() },
    sessionCookie
  )
  expect(pkceConsent.status).toBe(200)
  const pkceCallback = new URL((await pkceConsent.json()).url, origin)
  expect(pkceCallback.searchParams.get('state')).toBe(pkceState)
  const wrongVerifier = await auth.handler(
    authRequest(`${basePath}/oauth2/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code: pkceCallback.searchParams.get('code')!,
        redirect_uri: redirectURI,
        code_verifier: 'wrong-verifier-that-is-long-enough-for-pkce-checks',
        resource,
      }),
    })
  )
  expect(wrongVerifier.status).toBe(400)

  const refresh = await auth.handler(
    authRequest(`${basePath}/oauth2/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: tokenSet.refresh_token,
        scope: scopes.join(' '),
        resource,
      }),
    })
  )
  if (refresh.status !== 200)
    throw new Error(`refresh response ${refresh.status}: ${await refresh.text()}`)
  const refreshed = await refresh.json()
  expect(refreshed.access_token).toBeTruthy()
  expect(String(refreshed.scope).split(' ')).toEqual(expect.arrayContaining(scopes))
  expect(refreshed.refresh_token).toBeTruthy()
  expect(refreshed.refresh_token).not.toBe(tokenSet.refresh_token)
  const refreshedJWT = await jwtVerify(refreshed.access_token, localJwks, {
    issuer: authBaseURL,
    audience: resource,
  })
  expect(refreshedJWT.payload.aud).toBe(resource)
  expect(String(refreshedJWT.payload.scope).split(' ')).toEqual(expect.arrayContaining(scopes))
  // JWT exp has second precision, so a same-second refresh may keep the same
  // exp even though Better Auth issued a new access token.
  expect(refreshedJWT.payload.exp).toBeGreaterThanOrEqual(verifiedToken.payload.exp!)
  expect(refreshed.expires_in).toBeGreaterThan(0)
  const activeRefreshToken = refreshed.refresh_token

  // Force only the in-memory fixture's refresh record past expiry. Restore it
  // immediately so later cases exercise independent client/consent boundaries.
  const refreshRecords = await context.adapter.findMany<{
    id: string
    expiresAt: Date
    scopes: string[]
    sessionId: string
    revoked?: Date | null
    rotatedAt?: Date | null
  }>({
    model: 'oauthRefreshToken',
    where: [{ field: 'clientId', value: clientId }],
  })
  const activeRefreshRecord = refreshRecords.find((record) => !record.revoked && !record.rotatedAt)
  expect(activeRefreshRecord).toBeTruthy()
  const activeRefreshExpiry = activeRefreshRecord!.expiresAt
  await context.adapter.update({
    model: 'oauthRefreshToken',
    where: [{ field: 'id', value: activeRefreshRecord!.id }],
    update: { expiresAt: new Date(Date.now() - 1_000) },
  })
  await expectOAuthError(await auth.handler(refreshRequest(activeRefreshToken)), 'invalid_grant')
  await context.adapter.update({
    model: 'oauthRefreshToken',
    where: [{ field: 'id', value: activeRefreshRecord!.id }],
    update: { expiresAt: activeRefreshExpiry },
  })

  const activeSessionRecord = await context.adapter.findOne<{ expiresAt: Date }>({
    model: 'session',
    where: [{ field: 'id', value: activeRefreshRecord!.sessionId }],
  })
  expect(activeSessionRecord).toBeTruthy()
  await context.adapter.update({
    model: 'session',
    where: [{ field: 'id', value: activeRefreshRecord!.sessionId }],
    update: { expiresAt: new Date(Date.now() - 1_000) },
  })
  await expectOAuthError(await auth.handler(refreshRequest(activeRefreshToken)), 'invalid_grant')
  await context.adapter.update({
    model: 'session',
    where: [{ field: 'id', value: activeRefreshRecord!.sessionId }],
    update: { expiresAt: activeSessionRecord!.expiresAt },
  })

  await context.adapter.update({
    model: 'oauthClient',
    where: [{ field: 'clientId', value: clientId }],
    update: { disabled: true },
  })
  await expectOAuthError(await auth.handler(refreshRequest(activeRefreshToken)), 'invalid_grant')
  await context.adapter.update({
    model: 'oauthClient',
    where: [{ field: 'clientId', value: clientId }],
    update: { disabled: false },
  })
  const fullRefreshScopes = activeRefreshRecord!.scopes
  await context.adapter.update({
    model: 'oauthRefreshToken',
    where: [{ field: 'id', value: activeRefreshRecord!.id }],
    update: { scopes: ['gatherory:read', 'offline_access'] },
  })
  await expectOAuthError(
    await auth.handler(
      refreshRequest(activeRefreshToken, { scope: 'gatherory:read gatherory:write offline_access' })
    ),
    'invalid_scope'
  )
  await context.adapter.update({
    model: 'oauthRefreshToken',
    where: [{ field: 'id', value: activeRefreshRecord!.id }],
    update: { scopes: fullRefreshScopes },
  })

  const otherClientId = 'other-fixture-mcp-client'
  await context.adapter.create({
    model: 'oauthClient',
    data: {
      clientId: otherClientId,
      clientSecret: null,
      clientDiscoveryId: null,
      disabled: false,
      skipConsent: false,
      scopes,
      redirectUris: [redirectURI],
      tokenEndpointAuthMethod: 'none',
      grantTypes: ['authorization_code', 'refresh_token'],
      responseTypes: ['code'],
      applicationType: 'native',
      requirePKCE: true,
      createdAt: now,
      updatedAt: now,
    },
  })
  await context.adapter.create({
    model: 'oauthClientResource',
    data: { clientId: otherClientId, resourceId: resource, createdAt: now },
  })
  await expectOAuthError(
    await auth.handler(refreshRequest(activeRefreshToken, { clientId: otherClientId })),
    'invalid_grant'
  )

  const raceReferenceId = 'synthetic-revoked-during-refresh'
  const raceConsent = await context.adapter.create<{ id: string }>({
    model: 'oauthConsent',
    data: {
      userId: fixtureUser!.id,
      clientId,
      referenceId: raceReferenceId,
      resources: [resource],
      scopes,
      requestedUserInfoClaims: [],
      createdAt: now,
      updatedAt: now,
    },
  })
  const raceRefreshToken = 'synthetic-refresh-raced-with-revocation'
  await context.adapter.create({
    model: 'oauthRefreshToken',
    data: {
      token: hashMcpOAuthToken(raceRefreshToken),
      clientId,
      sessionId: activeRefreshRecord!.sessionId,
      userId: fixtureUser!.id,
      referenceId: raceReferenceId,
      resources: [resource],
      scopes,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: now,
    },
  })
  revokeConsentDuringRefresh = { token: raceRefreshToken, consentId: raceConsent.id }
  revokeRaceHookRan = false
  const racedRefresh = await auth.handler(refreshRequest(raceRefreshToken))
  expect(revokeRaceHookRan).toBe(true)
  await expectOAuthError(racedRefresh, 'invalid_grant')
  const tokensAfterRace = await context.adapter.findMany<{
    id: string
    referenceId?: string | null
  }>({
    model: 'oauthRefreshToken',
    where: [
      { field: 'userId', value: fixtureUser!.id },
      { field: 'clientId', value: clientId },
    ],
  })
  expect(tokensAfterRace.map((record) => record.referenceId ?? null)).not.toContain(raceReferenceId)

  const consentsResponse = await auth.handler(
    authRequest(`${basePath}/oauth2/get-consents`, {
      headers: { cookie: sessionCookie },
    })
  )
  expect(consentsResponse.status).toBe(200)
  const consents = await consentsResponse.json()
  const ownConsent = consents.find(
    (consent: { clientId: string; referenceId?: string | null }) =>
      consent.clientId === clientId && (consent.referenceId ?? null) === null
  )
  expect(ownConsent).toBeTruthy()
  const siblingReferenceId = 'synthetic-sibling-reference'
  const siblingConsent = await context.adapter.create<{ id: string }>({
    model: 'oauthConsent',
    data: {
      userId: fixtureUser!.id,
      clientId,
      referenceId: siblingReferenceId,
      resources: [resource],
      scopes,
      requestedUserInfoClaims: [],
      createdAt: now,
      updatedAt: now,
    },
  })
  const siblingRefreshToken = 'synthetic-sibling-refresh-token'
  const siblingRefresh = await context.adapter.create<{ id: string }>({
    model: 'oauthRefreshToken',
    data: {
      token: hashMcpOAuthToken(siblingRefreshToken),
      clientId,
      sessionId: activeRefreshRecord!.sessionId,
      userId: fixtureUser!.id,
      referenceId: siblingReferenceId,
      resources: [resource],
      scopes,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: now,
    },
  })
  for (let index = 0; index < 105; index++) {
    await context.adapter.create({
      model: 'oauthRefreshToken',
      data: {
        token: hashMcpOAuthToken(`synthetic-large-family-${index}`),
        clientId,
        sessionId: activeRefreshRecord!.sessionId,
        userId: fixtureUser!.id,
        referenceId: null,
        resources: [resource],
        scopes,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: now,
      },
    })
  }

  const unauthenticatedDelete = await postJSON(auth, `${basePath}/oauth2/delete-consent`, {
    id: ownConsent.id,
  })
  expect(unauthenticatedDelete.status).toBe(401)
  const failedDelete = await postJSON(
    auth,
    `${basePath}/oauth2/delete-consent`,
    { id: 'missing-consent' },
    sessionCookie
  )
  expect(failedDelete.status).toBe(404)

  const otherSignup = await postJSON(auth, `${basePath}/sign-up/email`, {
    name: 'Other MCP Test User',
    email: 'mcp-oauth-other@example.test',
    password: 'synthetic-password-for-test-only',
  })
  expect(otherSignup.status).toBe(200)
  const otherCookie = cookieHeader(otherSignup)
  const crossAccountDelete = await postJSON(
    auth,
    `${basePath}/oauth2/delete-consent`,
    { id: ownConsent.id },
    otherCookie
  )
  expect(crossAccountDelete.status).toBe(401)
  expect(
    await context.adapter.findOne<{ id: string }>({
      model: 'oauthRefreshToken',
      where: [{ field: 'id', value: activeRefreshRecord!.id }],
    })
  ).toBeTruthy()

  const unauthenticatedUpdate = await postJSON(auth, `${basePath}/oauth2/update-consent`, {
    id: ownConsent.id,
    update: { scopes: ['gatherory:read'] },
  })
  expect(unauthenticatedUpdate.status).toBe(401)
  const crossAccountUpdate = await postJSON(
    auth,
    `${basePath}/oauth2/update-consent`,
    { id: ownConsent.id, update: { scopes: ['gatherory:read'] } },
    otherCookie
  )
  expect(crossAccountUpdate.status).toBe(401)
  const reducedConsent = await postJSON(
    auth,
    `${basePath}/oauth2/update-consent`,
    { id: ownConsent.id, update: { scopes: ['gatherory:read', 'offline_access'] } },
    sessionCookie
  )
  expect(reducedConsent.status).toBe(200)
  const attemptedExpansion = await postJSON(
    auth,
    `${basePath}/oauth2/update-consent`,
    { id: ownConsent.id, update: { scopes } },
    sessionCookie
  )
  expect(attemptedExpansion.status).toBe(400)
  expect(await attemptedExpansion.json()).toMatchObject({ error: 'invalid_request' })
  const narrowedRefresh = await context.adapter.findOne<{ scopes: string[] }>({
    model: 'oauthRefreshToken',
    where: [{ field: 'id', value: activeRefreshRecord!.id }],
  })
  expect(narrowedRefresh?.scopes).toEqual(['gatherory:read', 'offline_access'])
  await expectOAuthError(
    await auth.handler(
      refreshRequest(activeRefreshToken, { scope: 'gatherory:read gatherory:write' })
    ),
    'invalid_grant'
  )
  const readOnlyRefresh = await auth.handler(refreshRequest(activeRefreshToken))
  expect(readOnlyRefresh.status).toBe(200)
  const readOnlyTokenSet = await readOnlyRefresh.json()
  expect(String(readOnlyTokenSet.scope).split(' ')).not.toContain('gatherory:write')

  const removedOfflineAccess = await postJSON(
    auth,
    `${basePath}/oauth2/update-consent`,
    { id: ownConsent.id, update: { scopes: ['gatherory:read'] } },
    sessionCookie
  )
  expect(removedOfflineAccess.status).toBe(200)
  const remainingUserRefreshTokens = await context.adapter.findMany<{
    id: string
    referenceId?: string | null
  }>({
    model: 'oauthRefreshToken',
    where: [
      { field: 'userId', value: fixtureUser!.id },
      { field: 'clientId', value: clientId },
      { field: 'referenceId', value: null },
    ],
  })
  expect(remainingUserRefreshTokens).toHaveLength(0)
  await expectOAuthError(
    await auth.handler(refreshRequest(readOnlyTokenSet.refresh_token)),
    'invalid_grant'
  )

  // Restoring write access must come through the OAuth consent screen, not update-consent.
  const reconsentStart = await auth.handler(
    authRequest(
      authorizeURL({
        clientId,
        state: 'mcp-fresh-reconsent',
        challenge: pkceChallenge(verifier),
        prompt: 'consent',
      }),
      { headers: { cookie: sessionCookie } }
    )
  )
  expect(reconsentStart.status).toBe(302)
  const reconsentURL = new URL(reconsentStart.headers.get('location')!, origin)
  expect(reconsentURL.pathname).toBe('/mcp/consent')
  const reconsent = await postJSON(
    auth,
    `${basePath}/oauth2/consent`,
    { accept: true, scope: scopes.join(' '), oauth_query: reconsentURL.searchParams.toString() },
    sessionCookie
  )
  expect(reconsent.status).toBe(200)
  const restoredGrant = await context.adapter.findOne<{ scopes: string[] }>({
    model: 'oauthConsent',
    where: [{ field: 'id', value: ownConsent.id }],
  })
  expect(restoredGrant?.scopes).toEqual(
    expect.arrayContaining(['gatherory:read', 'gatherory:write'])
  )

  const deleteConsent = await postJSON(
    auth,
    `${basePath}/oauth2/delete-consent`,
    { id: ownConsent.id },
    sessionCookie
  )
  expect(deleteConsent.status).toBe(200)
  const survivingRefreshRows = await context.adapter.findMany<{
    id: string
    referenceId?: string | null
  }>({
    model: 'oauthRefreshToken',
    where: [
      { field: 'userId', value: fixtureUser!.id },
      { field: 'clientId', value: clientId },
    ],
    limit: 1_000,
  })
  expect(survivingRefreshRows.map((row) => [row.id, row.referenceId])).toEqual([
    [siblingRefresh.id, siblingReferenceId],
  ])
  await context.adapter.delete({
    model: 'oauthRefreshToken',
    where: [{ field: 'id', value: siblingRefresh.id }],
  })
  await context.adapter.delete({
    model: 'oauthConsent',
    where: [{ field: 'id', value: siblingConsent.id }],
  })
  const authorizeCurrentClaims = createMcpClaimsAuthorizer(
    {
      findActiveSession: async () => ({
        userId: verifiedToken.payload.sub!,
        emailVerified: true,
        expiresAt: new Date(Date.now() + 60_000),
      }),
      findClient: async (id) => (id === clientId ? { disabled: false } : null),
      findConsent: async (userId, id) => {
        const consent = await context.adapter.findOne<{
          scopes: readonly string[]
          resources: readonly string[] | null
          updatedAt: Date
        }>({
          model: 'oauthConsent',
          where: [
            { field: 'userId', value: userId },
            { field: 'clientId', value: id },
          ],
        })
        return consent ?? null
      },
    },
    resource
  )
  expect(await authorizeCurrentClaims(refreshedJWT.payload)).toBeNull()
  await expectOAuthError(await auth.handler(refreshRequest(activeRefreshToken)), 'invalid_grant')
  await expectOAuthError(
    await auth.handler(refreshRequest(tokenSet.refresh_token)),
    'invalid_grant'
  )

  const denialState = 'mcp-oauth-denial-state-fixture'
  const deniedStart = await auth.handler(
    authRequest(
      authorizeURL({
        clientId,
        state: denialState,
        challenge: pkceChallenge(verifier),
        prompt: 'consent',
      }),
      { headers: { cookie: sessionCookie } }
    )
  )
  expect(deniedStart.status).toBe(302)
  const deniedURL = new URL(deniedStart.headers.get('location')!, origin)
  expect(deniedURL.pathname).toBe('/mcp/consent')
  const deny = await postJSON(
    auth,
    `${basePath}/oauth2/consent`,
    {
      accept: false,
      oauth_query: deniedURL.searchParams.toString(),
    },
    sessionCookie
  )
  expect(deny.status).toBe(200)
  const deniedRedirect = new URL((await deny.json()).url, origin)
  expect(deniedRedirect.origin + deniedRedirect.pathname).toBe(redirectURI)
  expect(deniedRedirect.searchParams.get('error')).toBe('access_denied')
  expect(deniedRedirect.searchParams.get('state')).toBe(denialState)
})

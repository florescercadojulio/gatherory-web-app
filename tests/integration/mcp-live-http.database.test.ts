import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_MCP_HTTP_TESTS === '1'
const protocolVersion = '2026-07-28'

function assertLoopback(name: string, value: string | undefined) {
  if (!value) throw new Error(`${name} must be set for the MCP live HTTP integration test`)
  const parsed = new URL(value)
  if (
    parsed.protocol !== 'http:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
  ) {
    throw new Error(`${name} must use an explicit HTTP loopback URL`)
  }
  return parsed
}

test(
  'MCP live HTTP flow authorizes OAuth, serves current SDK tools, writes native content, and rejects a revoked grant',
  { skip: !enabled, timeout: 90_000 },
  async () => {
    const base = assertLoopback('MCP_HTTP_BASE_URL', process.env.MCP_HTTP_BASE_URL)
    const databaseURL = process.env.DATABASE_URL
    if (!databaseURL)
      throw new Error('DATABASE_URL must be set for the MCP live HTTP integration test')
    const databaseHost = new URL(databaseURL).hostname
    if (!['localhost', '127.0.0.1', '[::1]'].includes(databaseHost)) {
      throw new Error(
        'DATABASE_URL must target a loopback database for the MCP live HTTP integration test'
      )
    }
    const { db } = await import('@/db')
    const { account, user } = await import('@/db/schema/auth.schema')
    const { oauthClient, oauthClientResource, oauthConsent, oauthResource } =
      await import('@/db/schema/mcp-oauth.schema')

    const suffix = randomUUID().replaceAll('-', '')
    const clientId = `mcp-live-http-${suffix}`
    const resource = new URL('/mcp', base.origin).toString()
    const redirectURI = new URL('/mcp/connections', base.origin).toString()
    const resourceEndpoint = new URL('/mcp', base.origin)
    const accountUserId = `mcp-live-http-user-${suffix}`
    const accountEmail = `${accountUserId}@example.test`
    const accountPassword = `mcp-live-http-${randomUUID()}-password`
    const hashedPassword = await hashPassword(accountPassword)
    const verifier = randomBytes(32).toString('base64url')
    const challenge = createHash('sha256').update(verifier).digest('base64url')
    const state = `mcp-live-state-${suffix}`
    let sessionCookie = ''
    let createdEventId: string | null = null

    async function authRequest(path: string, init: RequestInit = {}) {
      const headers = new Headers(init.headers)
      headers.set('origin', base.origin)
      return fetch(new URL(path, base.origin), { ...init, headers, redirect: 'manual' })
    }

    async function authPostJSON(path: string, body: unknown, cookie?: string) {
      const headers = new Headers({ 'content-type': 'application/json' })
      if (cookie) headers.set('cookie', cookie)
      return authRequest(path, { method: 'POST', headers, body: JSON.stringify(body) })
    }

    async function rpc(method: string, params: Record<string, unknown> = {}) {
      const id = randomUUID()
      const headers = new Headers({
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
        'MCP-Protocol-Version': protocolVersion,
        'Mcp-Method': method,
        origin: base.origin,
      })
      if (typeof params.name === 'string') headers.set('Mcp-Name', params.name)
      return fetch(resourceEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id,
          method,
          params: {
            ...params,
            _meta: {
              'io.modelcontextprotocol/protocolVersion': protocolVersion,
              'io.modelcontextprotocol/clientInfo': {
                name: 'mcp-live-http-integration',
                version: '1.0.0',
              },
              'io.modelcontextprotocol/clientCapabilities': {},
            },
          },
        }),
      })
    }

    async function callTool(name: string, args: Record<string, unknown>) {
      const response = await rpc('tools/call', { name, arguments: args })
      expect(
        response.status,
        `${name} returned ${response.status}: ${await response.clone().text()}`
      ).toBe(200)
      const rpcResponse = await response.json()
      expect(rpcResponse.error).toBeUndefined()
      expect(rpcResponse.result?.isError).not.toBe(true)
      const text = rpcResponse.result?.content?.find(
        (item: { type: string }) => item.type === 'text'
      )?.text
      expect(typeof text).toBe('string')
      return JSON.parse(text as string) as Record<string, unknown>
    }

    let accessToken = ''
    try {
      await db.insert(user).values({
        id: accountUserId,
        name: 'Disposable MCP live HTTP user',
        email: accountEmail,
        emailVerified: true,
        hasCompletedOnboarding: true,
      })
      await db.insert(account).values({
        id: randomUUID(),
        userId: accountUserId,
        accountId: accountUserId,
        providerId: 'credential',
        password: hashedPassword,
        updatedAt: new Date(),
      })

      const now = new Date()
      await db
        .insert(oauthResource)
        .values({
          id: randomUUID(),
          identifier: resource,
          name: 'Gatherory MCP live HTTP test resource',
          accessTokenTtl: 300,
          refreshTokenTtl: 2_592_000,
          allowedScopes: ['gatherory:read', 'gatherory:write', 'offline_access'],
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing({ target: oauthResource.identifier })
      await db.insert(oauthClient).values({
        id: randomUUID(),
        clientId,
        clientSecret: null,
        clientDiscoveryId: null,
        disabled: false,
        skipConsent: false,
        scopes: ['gatherory:read', 'gatherory:write', 'offline_access'],
        userId: accountUserId,
        redirectUris: [redirectURI],
        tokenEndpointAuthMethod: 'none',
        grantTypes: ['authorization_code', 'refresh_token'],
        responseTypes: ['code'],
        applicationType: 'native',
        requirePKCE: true,
        createdAt: now,
        updatedAt: now,
      })
      await db.insert(oauthClientResource).values({
        id: randomUUID(),
        clientId,
        resourceId: resource,
        createdAt: now,
      })

      const authorizeQuery = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectURI,
        scope: 'gatherory:read gatherory:write offline_access',
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        resource,
      })
      const start = await authRequest(`/api/auth/oauth2/authorize?${authorizeQuery}`)
      expect([200, 302, 303]).toContain(start.status)
      const startURL = start.headers.get('location') ?? (await start.json()).url
      expect(typeof startURL).toBe('string')
      const connectURL = new URL(startURL, base.origin)
      expect(connectURL.pathname).toBe('/mcp/connect')
      const signedLoginQuery = connectURL.searchParams.toString()

      const signIn = await authPostJSON('/api/auth/sign-in/email', {
        email: accountEmail,
        password: accountPassword,
        oauth_query: signedLoginQuery,
      })
      expect(signIn.status).toBe(200)
      sessionCookie = signIn.headers
        .getSetCookie()
        .map((value) => value.split(';', 1)[0])
        .join('; ')
      expect(sessionCookie).not.toBe('')
      const signInBody = await signIn.json()
      const consentURL = new URL(signInBody.url, base.origin)
      expect(consentURL.pathname).toBe('/mcp/consent')
      expect(consentURL.searchParams.get('state')).toBe(state)
      expect(consentURL.searchParams.get('code_challenge')).toBe(challenge)

      const consent = await authPostJSON(
        '/api/auth/oauth2/consent',
        {
          accept: true,
          scope: 'gatherory:read gatherory:write offline_access',
          oauth_query: consentURL.searchParams.toString(),
        },
        sessionCookie
      )
      expect(consent.status).toBe(200)
      const callback = new URL((await consent.json()).url, base.origin)
      expect(callback.origin + callback.pathname).toBe(redirectURI)
      expect(callback.searchParams.get('state')).toBe(state)
      const code = callback.searchParams.get('code')
      expect(code).toBeTruthy()

      const tokenResponse = await authRequest('/api/auth/oauth2/token', {
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
      expect(tokenResponse.status, await tokenResponse.clone().text()).toBe(200)
      const tokenSet = await tokenResponse.json()
      accessToken = tokenSet.access_token
      expect(accessToken).toBeTruthy()
      expect(String(tokenSet.scope).split(' ')).toEqual(
        expect.arrayContaining(['gatherory:read', 'gatherory:write', 'offline_access'])
      )
      expect(tokenSet.refresh_token).toBeTruthy()

      const refreshResponse = await authRequest('/api/auth/oauth2/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          refresh_token: tokenSet.refresh_token,
          scope: 'gatherory:read gatherory:write offline_access',
          resource,
        }),
      })
      expect(refreshResponse.status, await refreshResponse.clone().text()).toBe(200)
      const refreshed = await refreshResponse.json()
      expect(String(refreshed.scope).split(' ')).toEqual(
        expect.arrayContaining(['gatherory:read', 'gatherory:write', 'offline_access'])
      )
      accessToken = refreshed.access_token

      // Reference-scoped grants are not part of Gatherory's MCP JWT contract.
      // A newer sibling consent must not replace this user's ordinary grant.
      const siblingConsentId = randomUUID()
      await db.insert(oauthConsent).values({
        id: siblingConsentId,
        userId: accountUserId,
        clientId,
        referenceId: `unrelated-reference-${suffix}`,
        scopes: ['gatherory:read'],
        resources: ['https://unrelated.example.test/mcp'],
        createdAt: new Date(),
        updatedAt: new Date(Date.now() + 1_000),
      })

      const discovered = await rpc('server/discover')
      expect(discovered.status, await discovered.clone().text()).toBe(200)
      const discoveryResult = (await discovered.json()).result
      expect(discoveryResult?.supportedVersions).toContain(protocolVersion)
      expect(discoveryResult?.capabilities?.tools).toBeDefined()
      expect(discoveryResult?.instructions).toContain('untrusted source data')

      const listed = await rpc('tools/list')
      expect(listed.status).toBe(200)
      const tools = (await listed.json()).result?.tools as Array<{ name: string }>
      expect(tools.map((tool) => tool.name)).toEqual(
        expect.arrayContaining([
          'list_events',
          'get_event',
          'create_event',
          'update_event',
          'list_ideas',
          'create_idea',
          'update_idea',
          'list_child_events',
          'create_child_event',
          'update_child_event',
          'list_notes',
          'create_note',
          'update_note',
          'list_tasks',
          'create_task',
          'update_task',
          'search_blueprints',
        ])
      )
      expect(tools).toHaveLength(17)

      const blueprintResults = await callTool('search_blueprints', { query: 'wedding' })
      expect(blueprintResults.items).toBeInstanceOf(Array)

      const listedEvents = await callTool('list_events', {})
      expect(listedEvents.items).toBeInstanceOf(Array)
      const createdEvent = await callTool('create_event', {
        idempotencyKey: `mcp-live-event-${suffix}`,
        title: 'MCP live HTTP integration event',
        startsAt: '2032-07-02T16:00:00.000Z',
        timeZone: 'America/Detroit',
      })
      createdEventId = String(createdEvent.id)
      expect(createdEvent.version).toBe(1)
      const fetchedEvent = await callTool('get_event', { eventId: createdEventId })
      expect(fetchedEvent.title).toBe('MCP live HTTP integration event')
      const updatedEvent = await callTool('update_event', {
        idempotencyKey: `mcp-live-event-update-${suffix}`,
        eventId: createdEventId,
        expectedVersion: 1,
        changes: { description: 'Updated through the live MCP HTTP endpoint' },
      })
      expect(updatedEvent.version).toBe(2)
      const createdIdea = await callTool('create_idea', {
        idempotencyKey: `mcp-live-idea-${suffix}`,
        eventId: createdEventId,
        title: 'Book a photographer',
        category: 'photography',
        note: 'Compare local options',
      })
      expect(createdIdea.version).toBe(1)
      const updatedIdea = await callTool('update_idea', {
        idempotencyKey: `mcp-live-idea-update-${suffix}`,
        eventId: createdEventId,
        ideaId: createdIdea.id,
        expectedVersion: 1,
        changes: { note: 'Shortlist two options' },
      })
      expect(updatedIdea).toMatchObject({ note: 'Shortlist two options', version: 2 })

      const listedIdeas = await callTool('list_ideas', { eventId: createdEventId })
      expect(listedIdeas.items).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: createdIdea.id })])
      )

      const createdNote = await callTool('create_note', {
        idempotencyKey: `mcp-live-note-${suffix}`,
        eventId: createdEventId,
        body: 'Planning note through the live MCP HTTP endpoint',
      })
      expect(createdNote).toMatchObject({
        eventId: createdEventId,
        body: 'Planning note through the live MCP HTTP endpoint',
        version: 1,
      })
      const updatedNote = await callTool('update_note', {
        idempotencyKey: `mcp-live-note-update-${suffix}`,
        eventId: createdEventId,
        noteId: String(createdNote.id),
        expectedVersion: 1,
        body: 'Edited through the live MCP HTTP endpoint',
      })
      expect(updatedNote).toMatchObject({
        body: 'Edited through the live MCP HTTP endpoint',
        version: 2,
      })
      const listedNotes = await callTool('list_notes', { eventId: createdEventId })
      expect(listedNotes.items).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: createdNote.id })])
      )

      const createdTask = await callTool('create_task', {
        idempotencyKey: `mcp-live-task-${suffix}`,
        eventId: createdEventId,
        title: 'Finish the event agenda',
        dueDate: '2032-06-20',
        websiteURL: 'https://example.test/agenda',
      })
      expect(createdTask).toMatchObject({
        eventId: createdEventId,
        dueDate: '2032-06-20',
        websiteURL: 'https://example.test/agenda',
        assigneePersonId: null,
        isCompleted: false,
        version: 1,
      })
      const updatedTask = await callTool('update_task', {
        idempotencyKey: `mcp-live-task-update-${suffix}`,
        eventId: createdEventId,
        taskId: String(createdTask.id),
        expectedVersion: 1,
        changes: { dueDate: null, websiteURL: null, isCompleted: true },
      })
      expect(updatedTask).toMatchObject({
        dueDate: null,
        websiteURL: null,
        isCompleted: true,
        version: 2,
      })
      const listedTasks = await callTool('list_tasks', { eventId: createdEventId })
      expect(listedTasks.items).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: createdTask.id, isCompleted: true })])
      )

      const createdChild = await callTool('create_child_event', {
        parentEventId: createdEventId,
        idempotencyKey: `mcp-live-child-${suffix}`,
        title: 'MCP live HTTP child session',
        startsAt: '2032-07-02T14:30:00-04:00',
        endsAt: '2032-07-02T16:00:00-04:00',
        timeZone: 'America/Detroit',
        category: 'reception',
        purpose: 'eventExperience',
        isAllDay: true,
      })
      expect(createdChild).toMatchObject({
        parentEventId: createdEventId,
        title: 'MCP live HTTP child session',
        startsAt: '2032-07-02T14:30:00-04:00',
        endsAt: '2032-07-02T16:00:00-04:00',
        version: 1,
      })
      const updatedChild = await callTool('update_child_event', {
        idempotencyKey: `mcp-live-child-update-${suffix}`,
        parentEventId: createdEventId,
        childEventId: String(createdChild.id),
        expectedVersion: 1,
        changes: { description: 'Updated through the live MCP HTTP endpoint' },
      })
      expect(updatedChild).toMatchObject({
        id: createdChild.id,
        parentEventId: createdEventId,
        description: 'Updated through the live MCP HTTP endpoint',
        purpose: 'eventExperience',
        category: 'reception',
        isAllDay: true,
        version: 2,
      })
      const listedChildren = await callTool('list_child_events', { parentEventId: createdEventId })
      expect(listedChildren.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: createdChild.id, title: 'MCP live HTTP child session' }),
        ])
      )

      // Exercise the same authenticated revocation endpoint as Manage AI connections.
      const grantsResponse = await authRequest('/api/auth/oauth2/get-consents', {
        headers: { cookie: sessionCookie },
      })
      expect(grantsResponse.status).toBe(200)
      const grants = (await grantsResponse.json()) as Array<{
        id: string
        clientId: string
        referenceId: string | null
      }>
      const grant = grants.find((item) => item.clientId === clientId && !item.referenceId)
      expect(grant).toBeDefined()
      const revokeResponse = await authPostJSON(
        '/api/auth/oauth2/delete-consent',
        { id: grant!.id },
        sessionCookie
      )
      expect(revokeResponse.ok).toBe(true)
      expect(
        await db
          .select({ id: oauthConsent.id })
          .from(oauthConsent)
          .where(eq(oauthConsent.id, siblingConsentId))
      ).toHaveLength(1)

      // Both still-signed JWTs must lose reads and writes immediately, without
      // waiting for their five-minute cryptographic expiry.
      for (const token of [tokenSet.access_token, refreshed.access_token]) {
        accessToken = token
        expect((await rpc('tools/list')).status).toBe(401)
        expect(
          (
            await rpc('tools/call', {
              name: 'create_task',
              arguments: {
                eventId: createdEventId,
                idempotencyKey: `mcp-live-revoked-task-${suffix}`,
                title: 'Must not be created after revocation',
              },
            })
          ).status
        ).toBe(401)
      }

      // Revocation also removes rotated/replayable refresh credentials.
      for (const refreshToken of [tokenSet.refresh_token, refreshed.refresh_token]) {
        const rejectedRefresh = await authRequest('/api/auth/oauth2/token', {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            refresh_token: refreshToken,
            resource,
          }),
        })
        expect(rejectedRefresh.status).toBe(400)
        expect((await rejectedRefresh.json()).error).toBe('invalid_grant')
      }
    } finally {
      if (sessionCookie) {
        try {
          await authRequest('/api/auth/sign-out', {
            method: 'POST',
            headers: { cookie: sessionCookie },
          })
        } catch {
          // Cleanup still removes the fixture client and event if the server stopped.
        }
      }
      if (createdEventId) {
        const { organization } = await import('@/db/schema/auth.schema')
        await db.delete(organization).where(eq(organization.id, createdEventId))
      }
      await db.delete(oauthClient).where(eq(oauthClient.clientId, clientId))
      await db.delete(user).where(eq(user.id, accountUserId))
    }
  }
)

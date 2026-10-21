import { eq, inArray } from 'drizzle-orm'
import { expect, test } from 'vitest'

/** Requires the existing local dev server and a disposable local database. */
test.skipIf(process.env.RUN_DEVICE_GUEST_HTTP_TESTS !== '1')(
  'device guest proof is limited to guest invitation endpoints',
  { timeout: 60_000 },
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(databaseUrl, 'DATABASE_URL is required').toBeTruthy()
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(new URL(databaseUrl!).hostname)
    const base = process.env.DEVICE_GUEST_TEST_BASE_URL ?? 'http://127.0.0.1:3003'
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(new URL(base).hostname)

    const { db } = await import('@/db')
    const {
      user,
      session,
      organization,
      event,
      eventParticipant,
      workspacePerson,
      eventShareLink,
    } = await import('@/db/schema')

    const suffix = crypto.randomUUID().replaceAll('-', '')
    const verifiedUserId = `device-guest-http-verified-${suffix}`
    const unverifiedUserId = `device-guest-http-unverified-${suffix}`
    const verifiedSessionToken = crypto.randomUUID()
    const unverifiedSessionToken = crypto.randomUUID()
    const organizationId = `device-guest-http-org-${suffix}`
    const eventId = crypto.randomUUID()
    const guestId = crypto.randomUUID()
    const guestCredential = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
      'base64url'
    )
    const collaboratorToken = crypto.randomUUID()

    async function request(
      path: string,
      options: {
        method?: string
        body?: unknown
        headers?: Record<string, string>
      } = {}
    ) {
      const response = await fetch(`${base}${path}`, {
        method: options.method ?? 'GET',
        headers: {
          'X-Client-Source': 'integration-test',
          'X-Request-ID': crypto.randomUUID(),
          ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...options.headers,
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      })
      return { status: response.status, json: await response.json() }
    }

    const guestHeaders = {
      'X-Gatherory-Guest-Id': guestId,
      'X-Gatherory-Guest-Token': guestCredential,
    }

    try {
      await db.insert(user).values([
        {
          id: verifiedUserId,
          name: 'Verified test account',
          email: `${verifiedUserId}@example.test`,
          emailVerified: true,
        },
        {
          id: unverifiedUserId,
          name: 'Unverified test account',
          email: `${unverifiedUserId}@example.test`,
          emailVerified: false,
        },
      ])
      await db.insert(session).values([
        {
          id: crypto.randomUUID(),
          token: verifiedSessionToken,
          userId: verifiedUserId,
          expiresAt: new Date(Date.now() + 60 * 60_000),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          token: unverifiedSessionToken,
          userId: unverifiedUserId,
          expiresAt: new Date(Date.now() + 60 * 60_000),
          updatedAt: new Date(),
        },
      ])
      await db.insert(organization).values({
        id: organizationId,
        name: 'Device guest HTTP test',
        slug: organizationId,
        workspaceType: 'event',
        createdAt: new Date(),
      })
      await db.insert(event).values({
        id: eventId,
        organizationId,
        title: 'Private invitation event',
        status: 'draft',
        startsAt: new Date(Date.now() + 86_400_000),
        timeZone: 'America/Detroit',
      })
      const [hostPerson] = await db
        .insert(workspacePerson)
        .values({ organizationId, userId: verifiedUserId, displayName: 'Host' })
        .returning()
      await db.insert(eventParticipant).values({
        eventId,
        personId: hostPerson!.id,
        role: 'host',
        planningPermission: 'manage',
      })
      await db.insert(eventShareLink).values({
        eventId,
        token: collaboratorToken,
        role: 'collaborator',
        createdByUserId: verifiedUserId,
        expiresAt: new Date(Date.now() + 60 * 60_000),
      })

      const registration = await request('/api/guest/session', {
        method: 'POST',
        body: { id: guestId, name: 'Device guest', credential: guestCredential },
      })
      expect(registration.status, JSON.stringify(registration.json)).toBe(200)
      expect(registration.json.data).toEqual({ id: guestId, name: 'Device guest' })

      const badProof = await request('/api/guest/events', {
        headers: { ...guestHeaders, 'X-Gatherory-Guest-Token': 'A'.repeat(43) },
      })
      expect(badProof.status, JSON.stringify(badProof.json)).toBe(403)

      const unavailableShare = await request('/api/guest/events', {
        method: 'POST',
        headers: guestHeaders,
        body: { token: crypto.randomUUID() },
      })
      expect(unavailableShare.status, JSON.stringify(unavailableShare.json)).toBe(404)

      // Guest proof grants only the dedicated invitation API. It must not be
      // interpreted as a Better Auth session or planner authorization.
      const guestBootstrap = await request('/api/sync/bootstrap', { headers: guestHeaders })
      expect(guestBootstrap.status, JSON.stringify(guestBootstrap.json)).toBe(401)
      const guestCookieBootstrap = await request('/api/sync/bootstrap', {
        headers: {
          Cookie: `better-auth.session_token=${guestCredential}`,
        },
      })
      expect(guestCookieBootstrap.status, JSON.stringify(guestCookieBootstrap.json)).toBe(401)
      const guestBearerBootstrap = await request('/api/sync/bootstrap', {
        headers: { Authorization: `Bearer ${guestCredential}` },
      })
      expect(guestBearerBootstrap.status, JSON.stringify(guestBearerBootstrap.json)).toBe(401)
      const guestPush = await request('/api/sync/push', {
        method: 'POST',
        headers: guestHeaders,
        body: { mutations: [] },
      })
      expect(guestPush.status, JSON.stringify(guestPush.json)).toBe(401)
      const guestPrivateInvite = await request('/api/invitations/accept', {
        method: 'POST',
        headers: guestHeaders,
        body: { token: collaboratorToken },
      })
      expect(guestPrivateInvite.status, JSON.stringify(guestPrivateInvite.json)).toBe(401)
      const guestClaimWithoutAccount = await request('/api/guest/claim', {
        method: 'POST',
        headers: guestHeaders,
        body: {},
      })
      expect(guestClaimWithoutAccount.status, JSON.stringify(guestClaimWithoutAccount.json)).toBe(
        401
      )

      const unverifiedClaim = await request('/api/guest/claim', {
        method: 'POST',
        headers: {
          ...guestHeaders,
          Authorization: `Bearer ${unverifiedSessionToken}`,
        },
        body: {},
      })
      expect(unverifiedClaim.status, JSON.stringify(unverifiedClaim.json)).toBe(403)

      // Claiming succeeds only when both independent credentials are present.
      // This is deliberately last because a claim disables the guest proof.
      const verifiedClaim = await request('/api/guest/claim', {
        method: 'POST',
        headers: {
          ...guestHeaders,
          Authorization: `Bearer ${verifiedSessionToken}`,
        },
        body: {},
      })
      expect(verifiedClaim.status, JSON.stringify(verifiedClaim.json)).toBe(200)
      expect(verifiedClaim.json.data.claimedEventIds).toEqual([])
    } finally {
      await db.delete(eventShareLink).where(eq(eventShareLink.eventId, eventId))
      await db.delete(eventParticipant).where(eq(eventParticipant.eventId, eventId))
      await db.delete(workspacePerson).where(eq(workspacePerson.organizationId, organizationId))
      await db.delete(event).where(eq(event.organizationId, organizationId))
      await db.delete(organization).where(eq(organization.id, organizationId))
      // The guest profile is intentionally removed by the DB workflow test;
      // avoid keeping test credentials in the database after this HTTP test.
      const { eventGuestProfile, eventGuestClaim } = await import('@/db/schema')
      await db.delete(eventGuestClaim).where(eq(eventGuestClaim.guestProfileId, guestId))
      await db.delete(eventGuestProfile).where(eq(eventGuestProfile.id, guestId))
      await db.delete(session).where(inArray(session.userId, [verifiedUserId, unverifiedUserId]))
      await db.delete(user).where(inArray(user.id, [verifiedUserId, unverifiedUserId]))
    }
  }
)

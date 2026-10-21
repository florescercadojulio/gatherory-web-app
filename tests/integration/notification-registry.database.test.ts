import { expect, test } from 'vitest'
import { createHash, randomBytes } from 'node:crypto'

const enabled = process.env.RUN_NATIVE_NOTIFICATION_DB_TESTS === '1'

function assertLocalDatabase() {
  const value = process.env.DATABASE_URL
  if (!value || !['localhost', '127.0.0.1', '[::1]'].includes(new URL(value).hostname)) {
    throw new Error(
      'Notification registry integration tests require a disposable localhost DATABASE_URL'
    )
  }
}

test(
  'installation proofs, monotonic revisions, tombstones, and token ownership are enforced in PostgreSQL',
  {
    skip: !enabled,
    timeout: 30_000,
  },
  async () => {
    assertLocalDatabase()
    const { db } = await import('@/db')
    const { notificationInstallation } = await import('@/db/schema/notification.schema')
    const { eq } = await import('drizzle-orm')
    const { Effect, Result } = await import('effect')
    const { PgClientLive } = await import('@/db')
    const { notificationRepo } = await import('@/server/notifications/repos/notification.repo.live')
    const firstId = crypto.randomUUID()
    const secondId = crypto.randomUUID()
    const firstSecret = randomBytes(32).toString('base64url')
    const secondSecret = randomBytes(32).toString('base64url')
    const firstToken = `fcm-test-${crypto.randomUUID()}`
    const secondToken = `fcm-test-${crypto.randomUUID()}`
    const userA = `notification-user-a-${crypto.randomUUID()}`
    const userB = `notification-user-b-${crypto.randomUUID()}`
    const register = (input: Parameters<typeof notificationRepo.register>[0]) =>
      Effect.runPromise(notificationRepo.register(input).pipe(Effect.provide(PgClientLive)))
    const detach = (input: Parameters<typeof notificationRepo.detach>[0]) =>
      Effect.runPromise(notificationRepo.detach(input).pipe(Effect.provide(PgClientLive)))

    try {
      // Detach may win the race against the first register POST. The tombstone
      // binds the proof and preserves the client revision, rejecting late work.
      const detached = await detach({ id: firstId, secret: firstSecret, revision: 2 })
      expect(detached).toMatchObject({ detached: true, revision: 2, accepted: true })
      const latePost = await register({
        id: firstId,
        secret: firstSecret,
        revision: 1,
        recipient: { kind: 'user', id: userA },
        platform: 'ios',
        locale: 'en',
        token: firstToken,
        enabled: true,
      })
      expect(latePost).toMatchObject({ revision: 2, accepted: false })

      const concurrent = await Promise.all(
        [1, 3].map((revision) =>
          register({
            id: firstId,
            secret: firstSecret,
            revision,
            recipient: { kind: 'user', id: userA },
            platform: 'ios',
            locale: 'en',
            token: firstToken,
            enabled: true,
          })
        )
      )
      expect(concurrent.some((result) => result.accepted && result.revision === 3)).toBe(true)
      const [current] = await db
        .select()
        .from(notificationInstallation)
        .where(eq(notificationInstallation.id, firstId))
        .limit(1)
      expect(current).toMatchObject({
        revision: 3,
        recipientKind: 'user',
        recipientId: userA,
        enabled: true,
      })

      const rebind = await register({
        id: firstId,
        secret: firstSecret,
        revision: 4,
        recipient: { kind: 'user', id: userB },
        platform: 'ios',
        locale: 'es',
        token: secondToken,
        enabled: true,
      })
      expect(rebind.bindingGeneration).toBe((current?.bindingGeneration ?? 0) + 1)
      const wrongProof = await Effect.runPromise(
        Effect.result(
          notificationRepo
            .register({
              id: firstId,
              secret: secondSecret,
              revision: 5,
              recipient: { kind: 'user', id: userA },
              platform: 'ios',
              locale: 'en',
              token: `other-${firstToken}`,
              enabled: true,
            })
            .pipe(Effect.provide(PgClientLive))
        )
      )
      expect(Result.isFailure(wrongProof)).toBe(true)
      if (Result.isFailure(wrongProof))
        expect(wrongProof.failure).toMatchObject({ _tag: 'ForbiddenError' })
      await detach({ id: firstId, secret: firstSecret, revision: 5 })
      const reusedToken = await Effect.runPromise(
        Effect.result(
          notificationRepo
            .register({
              id: secondId,
              secret: secondSecret,
              revision: 1,
              recipient: { kind: 'user', id: userA },
              platform: 'ios',
              locale: 'en',
              token: secondToken,
              enabled: true,
            })
            .pipe(Effect.provide(PgClientLive))
        )
      )
      expect(Result.isFailure(reusedToken)).toBe(false)
    } finally {
      await db.delete(notificationInstallation).where(eq(notificationInstallation.id, firstId))
      await db.delete(notificationInstallation).where(eq(notificationInstallation.id, secondId))
    }
  }
)

test(
  'dispatcher rechecks live event eligibility after claiming a durable notification',
  {
    skip: !enabled,
    timeout: 30_000,
  },
  async () => {
    assertLocalDatabase()
    const { db } = await import('@/db')
    const { organization, user } = await import('@/db/schema/auth.schema')
    const { event, eventParticipant, workspacePerson } = await import('@/db/schema/event.schema')
    const { notificationInstallation, nativeNotificationOutbox } =
      await import('@/db/schema/notification.schema')
    const { and, eq } = await import('drizzle-orm')
    const { Effect } = await import('effect')
    const { PgClientLive } = await import('@/db')
    const { notificationRepo } = await import('@/server/notifications/repos/notification.repo.live')
    const id = crypto.randomUUID()
    const eventId = crypto.randomUUID()
    const participantId = crypto.randomUUID()
    const organizationId = `notification-dispatch-${id}`
    const recipientId = `notification-user-${id}`
    const installationId = crypto.randomUUID()
    const secret = randomBytes(32).toString('base64url')
    const token = `fcm-test-${crypto.randomUUID()}`
    const register = (input: Parameters<typeof notificationRepo.register>[0]) =>
      Effect.runPromise(notificationRepo.register(input).pipe(Effect.provide(PgClientLive)))
    const claim = () =>
      Effect.runPromise(notificationRepo.claimPending(10).pipe(Effect.provide(PgClientLive)))
    const isStillBound = (
      item: Parameters<typeof notificationRepo.isStillBound>[0],
      install: Parameters<typeof notificationRepo.isStillBound>[1]
    ) =>
      Effect.runPromise(
        notificationRepo.isStillBound(item, install).pipe(Effect.provide(PgClientLive))
      )

    try {
      await db.insert(user).values({
        id: recipientId,
        name: recipientId,
        email: `${recipientId}@example.test`,
        emailVerified: true,
      })
      await db.insert(organization).values({
        id: organizationId,
        name: 'Notification dispatcher test',
        slug: `notification-dispatch-${id}`,
        createdAt: new Date(),
        workspaceType: 'event',
      })
      await db.insert(event).values({
        id: eventId,
        organizationId,
        title: 'Private event title',
        status: 'draft',
        timeZone: 'UTC',
        startsAt: new Date('2031-01-01T12:00:00Z'),
        createdByUserId: recipientId,
      })
      await db.insert(workspacePerson).values({
        id: participantId,
        organizationId,
        userId: recipientId,
        displayName: recipientId,
      })
      await db
        .insert(eventParticipant)
        .values({ eventId, personId: participantId, role: 'host', planningPermission: 'manage' })
      await register({
        id: installationId,
        secret,
        revision: 1,
        recipient: { kind: 'user', id: recipientId },
        platform: 'ios',
        locale: 'en',
        token,
        enabled: true,
      })
      await db.insert(nativeNotificationOutbox).values(
        ['lease', 'eligibility'].map((suffix) => ({
          dedupeKey: `dispatch-test-${id}-${suffix}`,
          mutationId: `${id}-${suffix}`,
          eventId,
          entityId: eventId,
          recipientKind: 'user' as const,
          recipientId,
          type: 'event_changed' as const,
          state: 'pending' as const,
          nextAttemptAt: new Date(Date.now() - 5_000),
        }))
      )
      expect(await db.select().from(event).where(eq(event.id, eventId))).toHaveLength(1)
      expect(
        await db.select().from(eventParticipant).where(eq(eventParticipant.eventId, eventId))
      ).toHaveLength(1)
      expect(
        await db
          .select()
          .from(notificationInstallation)
          .where(eq(notificationInstallation.id, installationId))
      ).toHaveLength(1)
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.eventId, eventId))
      ).toHaveLength(2)
      const items = await claim()
      expect(
        (
          await db
            .select()
            .from(nativeNotificationOutbox)
            .where(eq(nativeNotificationOutbox.eventId, eventId))
        )[0]?.state
      ).toBe('leased')
      expect(items).toHaveLength(2)
      const [leaseItem, eligibilityItem] = items
      expect(leaseItem?.installations).toHaveLength(1)
      expect(leaseItem && (await isStillBound(leaseItem, leaseItem.installations[0]!))).toBe(true)
      await db
        .update(nativeNotificationOutbox)
        .set({ leaseUntil: new Date(Date.now() - 1) })
        .where(eq(nativeNotificationOutbox.id, leaseItem!.id))
      expect(leaseItem && (await isStillBound(leaseItem, leaseItem.installations[0]!))).toBe(false)

      // Simulate completion/removal after claim but before provider send. The
      // dispatch service must not send a stale queued message.
      await db.update(event).set({ completionStatus: 'complete' }).where(eq(event.id, eventId))
      expect(
        eligibilityItem && (await isStillBound(eligibilityItem, eligibilityItem.installations[0]!))
      ).toBe(false)
    } finally {
      await db
        .delete(nativeNotificationOutbox)
        .where(
          and(
            eq(nativeNotificationOutbox.eventId, eventId),
            eq(nativeNotificationOutbox.recipientId, recipientId)
          )
        )
      await db
        .delete(notificationInstallation)
        .where(eq(notificationInstallation.id, installationId))
      await db.delete(organization).where(eq(organization.id, organizationId))
      await db.delete(user).where(eq(user.id, recipientId))
    }
  }
)

test(
  'HTTP registry derives identity from verified account or guest proof and allows exact proof-only detach',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    assertLocalDatabase()
    const { db } = await import('@/db')
    const { user, session } = await import('@/db/schema/auth.schema')
    const { eventGuestProfile } = await import('@/db/schema/event.schema')
    const { notificationInstallation } = await import('@/db/schema/notification.schema')
    const { eq, inArray } = await import('drizzle-orm')
    const { notificationInstallationResponse } =
      await import('@/server/notifications/handlers/notification-installation.handler')
    const suffix = crypto.randomUUID()
    const accountId = `notification-http-user-${suffix}`
    const spoofedId = `notification-http-spoof-${suffix}`
    const liveSessionToken = crypto.randomUUID()
    const expiredSessionToken = crypto.randomUUID()
    const guestId = crypto.randomUUID()
    const guestCredential = randomBytes(32).toString('base64url')
    const guestCredentialHash = createHash('sha256')
      .update(`${guestId}:${guestCredential}`)
      .digest('hex')
    const accountInstallId = crypto.randomUUID()
    const guestInstallId = crypto.randomUUID()
    const rejectedInstallId = crypto.randomUUID()
    const accountSecret = randomBytes(32).toString('base64url')
    const guestSecret = randomBytes(32).toString('base64url')
    const rejectedSecret = randomBytes(32).toString('base64url')

    async function request(
      method: 'POST' | 'DELETE',
      body: unknown,
      headers: Record<string, string> = {}
    ) {
      const response = await notificationInstallationResponse(
        new Request('http://localhost/api/notifications/installations', {
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(body),
        })
      )
      return {
        status: response.status,
        json: (await response.json()) as {
          data?: Record<string, unknown>
          error?: Record<string, unknown>
        },
      }
    }

    const registrationBody = (installationId: string, installationSecret: string) => ({
      installationId,
      installationSecret,
      revision: 1,
      token: `fcm-http-${crypto.randomUUID()}`,
      platform: 'ios',
      locale: 'en',
      enabled: true,
    })

    try {
      await db.insert(user).values([
        {
          id: accountId,
          name: 'HTTP account',
          email: `${accountId}@example.test`,
          emailVerified: true,
        },
        {
          id: spoofedId,
          name: 'Spoof target',
          email: `${spoofedId}@example.test`,
          emailVerified: true,
        },
      ])
      await db.insert(session).values([
        {
          id: crypto.randomUUID(),
          token: liveSessionToken,
          userId: accountId,
          expiresAt: new Date(Date.now() + 60 * 60_000),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          token: expiredSessionToken,
          userId: accountId,
          expiresAt: new Date(Date.now() - 60_000),
          updatedAt: new Date(),
        },
      ])
      await db.insert(eventGuestProfile).values({
        id: guestId,
        displayName: 'HTTP guest',
        credentialHash: guestCredentialHash,
      })

      const accountRegistration = await request(
        'POST',
        {
          ...registrationBody(accountInstallId, accountSecret),
          recipientKind: 'device_guest',
          recipientId: guestId,
          userId: spoofedId,
        },
        { Authorization: `Bearer ${liveSessionToken}` }
      )
      expect(accountRegistration.status, JSON.stringify(accountRegistration.json)).toBe(200)
      const [accountInstall] = await db
        .select()
        .from(notificationInstallation)
        .where(eq(notificationInstallation.id, accountInstallId))
      expect(accountInstall).toMatchObject({ recipientKind: 'user', recipientId: accountId })

      const guestRegistration = await request(
        'POST',
        registrationBody(guestInstallId, guestSecret),
        {
          'X-Gatherory-Guest-Id': guestId,
          'X-Gatherory-Guest-Token': guestCredential,
        }
      )
      expect(guestRegistration.status, JSON.stringify(guestRegistration.json)).toBe(200)
      const [guestInstall] = await db
        .select()
        .from(notificationInstallation)
        .where(eq(notificationInstallation.id, guestInstallId))
      expect(guestInstall).toMatchObject({ recipientKind: 'device_guest', recipientId: guestId })

      const ambiguousIdentity = await request(
        'POST',
        registrationBody(rejectedInstallId, rejectedSecret),
        {
          'X-Gatherory-Guest-Id': guestId,
          'X-Gatherory-Guest-Token': guestCredential,
          Authorization: 'Bearer invalid-session-token',
        }
      )
      expect(ambiguousIdentity.status).toBe(403)
      const wrongGuestProof = await request(
        'POST',
        registrationBody(rejectedInstallId, rejectedSecret),
        {
          'X-Gatherory-Guest-Id': guestId,
          'X-Gatherory-Guest-Token': randomBytes(32).toString('base64url'),
        }
      )
      expect(wrongGuestProof.status).toBe(403)
      const expiredAccountSession = await request(
        'POST',
        registrationBody(rejectedInstallId, rejectedSecret),
        {
          Authorization: `Bearer ${expiredSessionToken}`,
        }
      )
      expect(expiredAccountSession.status).toBe(401)
      expect(
        await db
          .select()
          .from(notificationInstallation)
          .where(eq(notificationInstallation.id, rejectedInstallId))
      ).toHaveLength(0)

      const wrongDetachProof = await request(
        'DELETE',
        {
          installationId: accountInstallId,
          installationSecret: rejectedSecret,
          revision: 2,
        },
        { Authorization: `Bearer ${expiredSessionToken}` }
      )
      expect(wrongDetachProof.status).toBe(403)
      const proofOnlyDetach = await request(
        'DELETE',
        {
          installationId: accountInstallId,
          installationSecret: accountSecret,
          revision: 2,
        },
        { Authorization: `Bearer ${expiredSessionToken}` }
      )
      expect(proofOnlyDetach.status, JSON.stringify(proofOnlyDetach.json)).toBe(200)
      expect(proofOnlyDetach.json.data).toMatchObject({
        detached: true,
        revision: 2,
        accepted: true,
      })
      const [detached] = await db
        .select()
        .from(notificationInstallation)
        .where(eq(notificationInstallation.id, accountInstallId))
      expect(detached).toMatchObject({ enabled: false, recipientKind: null, tokenHash: null })
      expect(detached?.detachedAt).toBeInstanceOf(Date)
    } finally {
      await db
        .delete(notificationInstallation)
        .where(
          inArray(notificationInstallation.id, [
            accountInstallId,
            guestInstallId,
            rejectedInstallId,
          ])
        )
      await db.delete(eventGuestProfile).where(eq(eventGuestProfile.id, guestId))
      await db.delete(session).where(inArray(session.userId, [accountId, spoofedId]))
      await db.delete(user).where(inArray(user.id, [accountId, spoofedId]))
    }
  }
)

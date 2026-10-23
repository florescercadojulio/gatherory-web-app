import { randomBytes, randomUUID } from 'node:crypto'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_NATIVE_NOTIFICATION_DB_TESTS === '1'

async function fixture() {
  const value = process.env.DATABASE_URL
  if (!value || !['localhost', '127.0.0.1', '[::1]'].includes(new URL(value).hostname)) {
    throw new Error('Notification dispatch tests require a disposable localhost DATABASE_URL')
  }
  const { db, PgClientLive } = await import('@/db')
  const { user, organization } = await import('@/db/schema/auth.schema')
  const { event, eventParticipant, workspacePerson } = await import('@/db/schema/event.schema')
  const { nativeNotificationOutbox, notificationInstallation } =
    await import('@/db/schema/notification.schema')
  const { notificationRepo } = await import('@/server/notifications/repos/notification.repo.live')
  const { Effect } = await import('effect')
  const { eq, sql } = await import('drizzle-orm')
  const id = randomUUID()
  const recipientId = `dispatch-user-${id}`
  const otherRecipientId = `dispatch-other-${id}`
  const organizationId = `dispatch-org-${id}`
  const personId = randomUUID()
  const installationId = randomUUID()
  const registration = {
    id: installationId,
    secret: randomBytes(32).toString('base64url'),
    revision: 1,
    recipient: { kind: 'user' as const, id: recipientId },
    platform: 'ios' as const,
    locale: 'en' as const,
    token: `test-token-${id}`,
    enabled: true,
  }
  const run = <A, E>(
    effect: import('effect').Effect.Effect<A, E, import('@effect/sql-pg').PgClient.PgClient>
  ) => Effect.runPromise(effect.pipe(Effect.provide(PgClientLive)))
  await db.insert(user).values(
    [recipientId, otherRecipientId].map((userId) => ({
      id: userId,
      name: userId,
      email: `${userId}@example.test`,
      emailVerified: true,
    }))
  )
  await db.insert(organization).values({
    id: organizationId,
    name: 'Dispatch test',
    slug: organizationId,
    createdAt: new Date(),
    workspaceType: 'event',
  })
  await db.insert(event).values({
    id,
    organizationId,
    title: 'Dispatch test',
    status: 'ongoing',
    timeZone: 'UTC',
    startsAt: new Date('2031-01-01T00:00:00Z'),
    createdByUserId: recipientId,
  })
  await db
    .insert(workspacePerson)
    .values({ id: personId, organizationId, userId: recipientId, displayName: recipientId })
  await db
    .insert(eventParticipant)
    .values({ eventId: id, personId, role: 'host', planningPermission: 'manage' })
  await run(notificationRepo.register(registration))
  return {
    db,
    eq,
    sql,
    event,
    eventParticipant,
    nativeNotificationOutbox,
    notificationInstallation,
    notificationRepo,
    run,
    id,
    recipientId,
    otherRecipientId,
    personId,
    installationId,
    registration,
    async enqueue(overrides: Partial<typeof nativeNotificationOutbox.$inferInsert> = {}) {
      const key = randomUUID()
      const [row] = await db
        .insert(nativeNotificationOutbox)
        .values({
          dedupeKey: key,
          mutationId: key,
          eventId: id,
          entityId: id,
          recipientKind: 'user',
          recipientId,
          type: 'event_changed',
          nextAttemptAt: sql`clock_timestamp() - interval '5 seconds'`,
          ...overrides,
        })
        .returning()
      return row!
    },
    async row(rowId: string) {
      return (
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.id, rowId))
      )[0]!
    },
    async cleanup() {
      await db.delete(nativeNotificationOutbox).where(eq(nativeNotificationOutbox.eventId, id))
      await db
        .delete(notificationInstallation)
        .where(eq(notificationInstallation.id, installationId))
      await db.delete(organization).where(eq(organization.id, organizationId))
      await db.delete(user).where(eq(user.id, recipientId))
      await db.delete(user).where(eq(user.id, otherRecipientId))
    },
  }
}

test(
  'concurrent claims are disjoint and replacement leases fence old owners',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    const f = await fixture()
    try {
      await Promise.all(Array.from({ length: 8 }, () => f.enqueue()))
      const claims = await Promise.all(
        Array.from({ length: 8 }, () => f.run(f.notificationRepo.claimPending(1)))
      )
      const items = claims.flat()
      expect(items).toHaveLength(8)
      expect(new Set(items.map((item) => item.id)).size).toBe(8)
      expect(await f.run(f.notificationRepo.claimPending(10))).toEqual([])
      const old = items[0]!
      expect(await f.run(f.notificationRepo.isStillBound(old, old.installations[0]!))).toBe(true)
      const locked = Promise.withResolvers<void>()
      const release = Promise.withResolvers<void>()
      const lockHolder = f.db.transaction(async (tx) => {
        await tx
          .select({ id: f.nativeNotificationOutbox.id })
          .from(f.nativeNotificationOutbox)
          .where(f.eq(f.nativeNotificationOutbox.id, old.id))
          .for('update')
        locked.resolve()
        await release.promise
      })
      await locked.promise
      try {
        expect(await f.run(f.notificationRepo.isStillBound(old, old.installations[0]!))).toBe(false)
      } finally {
        release.resolve()
        await lockHolder
      }
      await f.db
        .update(f.nativeNotificationOutbox)
        .set({ leaseUntil: f.sql`clock_timestamp() - interval '1 second'` })
        .where(f.eq(f.nativeNotificationOutbox.id, old.id))
      expect(await f.run(f.notificationRepo.isStillBound(old, old.installations[0]!))).toBe(false)
      // An ack that wins before replacement still prevents a later retry from resending.
      await f.run(f.notificationRepo.markInstallationAccepted(old, f.installationId))
      const [replacement] = await f.run(f.notificationRepo.claimPending(1))
      expect(replacement?.id).toBe(old.id)
      expect(replacement?.leaseKey).not.toBe(old.leaseKey)
      expect(replacement?.acceptedInstallationIds).toEqual([f.installationId])
      await f.run(f.notificationRepo.retry(old, 'old_owner'))
      await f.run(f.notificationRepo.delivered(old))
      await f.run(f.notificationRepo.markInstallationAccepted(old, randomUUID()))
      expect(await f.row(old.id)).toMatchObject({
        state: 'leased',
        leaseKey: replacement!.leaseKey,
        acceptedInstallationIds: [f.installationId],
      })
      await f.run(f.notificationRepo.delivered(replacement!))
      expect(await f.row(old.id)).toMatchObject({ state: 'delivered', leaseKey: null })
    } finally {
      await f.cleanup()
    }
  }
)

test(
  'retries preserve acknowledgments, back off, and terminate exhausted or stale work',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    const f = await fixture()
    try {
      const pending = await f.enqueue()
      const [first] = await f.run(f.notificationRepo.claimPending(1))
      await f.run(f.notificationRepo.markInstallationAccepted(first!, f.installationId))
      const before = (
        await f.db
          .select({
            now: f.sql<number>`(extract(epoch from clock_timestamp()) * 1000)::double precision`,
          })
          .from(f.sql`(select 1) as notification_clock`)
      )[0]!.now
      await f.run(f.notificationRepo.retry(first!, 'provider_failure', false, 180_000))
      expect(await f.row(pending.id)).toMatchObject({
        state: 'pending',
        attempts: 1,
        acceptedInstallationIds: [f.installationId],
      })
      expect((await f.row(pending.id)).nextAttemptAt.getTime()).toBeGreaterThanOrEqual(
        before + 180_000
      )
      expect(await f.run(f.notificationRepo.claimPending(1))).toEqual([])
      await f.db
        .update(f.nativeNotificationOutbox)
        .set({
          nextAttemptAt: f.sql`clock_timestamp() - interval '1 second'`,
          attempts: 7,
        })
        .where(f.eq(f.nativeNotificationOutbox.id, pending.id))
      const [eighth] = await f.run(f.notificationRepo.claimPending(1))
      expect(eighth?.acceptedInstallationIds).toEqual([f.installationId])
      await f.run(f.notificationRepo.retry(eighth!, 'provider_failure'))
      expect(await f.row(pending.id)).toMatchObject({
        state: 'discarded',
        attempts: 8,
        leaseKey: null,
        lastFailure: 'retry_exhausted',
      })
      const stale = await f.enqueue()
      await f.db
        .update(f.nativeNotificationOutbox)
        .set({
          createdAt: f.sql`clock_timestamp() - interval '24 hours 1 second'`,
          nextAttemptAt: f.sql`clock_timestamp() + interval '1 hour'`,
        })
        .where(f.eq(f.nativeNotificationOutbox.id, stale.id))
      const exhausted = await f.enqueue({ state: 'leased', attempts: 8, leaseUntil: null })
      const abandoned = await f.enqueue({
        state: 'leased',
        leaseKey: randomUUID(),
        leaseUntil: null,
      })
      const [recovered] = await f.run(f.notificationRepo.claimPending(1))
      expect(recovered?.id).toBe(abandoned.id)
      expect(await f.row(stale.id)).toMatchObject({ state: 'discarded' })
      expect(await f.row(exhausted.id)).toMatchObject({ state: 'discarded' })
      // A pending retry approaching TTL can never schedule beyond the TTL.
      await f.db
        .update(f.nativeNotificationOutbox)
        .set({
          createdAt: f.sql`clock_timestamp() - interval '23 hours 59 minutes 30 seconds'`,
        })
        .where(f.eq(f.nativeNotificationOutbox.id, abandoned.id))
      await f.run(
        f.notificationRepo.retry(recovered!, 'provider response contains secrets', false, 3_600_000)
      )
      const bounded = await f.row(abandoned.id)
      expect(bounded.nextAttemptAt.getTime()).toBe(bounded.createdAt.getTime() + 24 * 3_600_000)
      expect(bounded.lastFailure).toBe('delivery_failed')
    } finally {
      await f.cleanup()
    }
  }
)

test(
  'live permission, account binding, and installation revision fences prevent stale sends',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    const f = await fixture()
    try {
      await f.enqueue()
      const [item] = await f.run(f.notificationRepo.claimPending(1))
      const installation = item!.installations[0]!
      expect(await f.run(f.notificationRepo.isStillBound(item!, installation))).toBe(true)
      await f.run(
        f.notificationRepo.register({
          ...f.registration,
          revision: 2,
          recipient: { kind: 'user', id: f.otherRecipientId },
        })
      )
      expect(await f.run(f.notificationRepo.isStillBound(item!, installation))).toBe(false)
      await f.run(f.notificationRepo.disableInstallation(installation))
      expect(
        (
          await f.db
            .select()
            .from(f.notificationInstallation)
            .where(f.eq(f.notificationInstallation.id, f.installationId))
        )[0]
      ).toMatchObject({ revision: 2, enabled: true, recipientId: f.otherRecipientId })
      await f.run(f.notificationRepo.register({ ...f.registration, revision: 3 }))
      expect(await f.run(f.notificationRepo.isStillBound(item!, installation))).toBe(false)
      await f.run(f.notificationRepo.retry(item!, 'provider_failure'))
      await f.db
        .update(f.nativeNotificationOutbox)
        .set({ nextAttemptAt: f.sql`clock_timestamp() - interval '1 second'` })
        .where(f.eq(f.nativeNotificationOutbox.id, item!.id))
      const [current] = await f.run(f.notificationRepo.claimPending(1))
      const currentInstallation = current!.installations[0]!
      expect(await f.run(f.notificationRepo.isStillBound(current!, currentInstallation))).toBe(true)
      await f.db.delete(f.eventParticipant).where(f.eq(f.eventParticipant.personId, f.personId))
      expect(await f.run(f.notificationRepo.isStillBound(current!, currentInstallation))).toBe(
        false
      )
      await f.run(f.notificationRepo.disableInstallation(currentInstallation))
      expect(
        (
          await f.db
            .select()
            .from(f.notificationInstallation)
            .where(f.eq(f.notificationInstallation.id, f.installationId))
        )[0]
      ).toMatchObject({ revision: 3, enabled: false, recipientId: null, tokenHash: null })
    } finally {
      await f.cleanup()
    }
  }
)

test(
  'a revoked head does not starve eligible work behind it in a claim of one',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    const f = await fixture()
    try {
      const revoked = await f.enqueue({
        recipientId: f.otherRecipientId,
        createdAt: new Date(Date.now() - 60_000),
      })
      const eligible = await f.enqueue()
      const [item] = await f.run(f.notificationRepo.claimPending(1))
      expect(item?.id).toBe(eligible.id)
      expect(await f.row(revoked.id)).toMatchObject({
        state: 'discarded',
        attempts: 0,
        leaseKey: null,
      })
      expect(await f.row(eligible.id)).toMatchObject({ state: 'leased', attempts: 1 })
    } finally {
      await f.cleanup()
    }
  }
)

test(
  'event-change dispatch rechecks current lifecycle, reason, and child parent state',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    const f = await fixture()
    const childId = randomUUID()
    try {
      // A draft edit after claim revokes an ordinary schedule alert before provider access.
      const draftEdit = await f.enqueue({ eventChangeKind: 'schedule' })
      const [draftClaim] = await f.run(f.notificationRepo.claimPending(1))
      expect(draftClaim?.eventChangeKind).toBe('schedule')
      await f.db.update(f.event).set({ status: 'draft' }).where(f.eq(f.event.id, f.id))
      expect(
        await f.run(f.notificationRepo.isStillBound(draftClaim!, draftClaim!.installations[0]!))
      ).toBe(false)
      expect(await f.row(draftEdit.id)).toMatchObject({ state: 'leased' })

      // A captured cancellation remains eligible only while the event is currently cancelled.
      await f.db.update(f.event).set({ status: 'cancelled' }).where(f.eq(f.event.id, f.id))
      const cancellation = await f.enqueue({ eventChangeKind: 'cancelled' })
      const [cancelClaim] = await f.run(f.notificationRepo.claimPending(1))
      expect(cancelClaim?.id).toBe(cancellation.id)
      expect(
        await f.run(f.notificationRepo.isStillBound(cancelClaim!, cancelClaim!.installations[0]!))
      ).toBe(true)
      await f.db.update(f.event).set({ status: 'ongoing' }).where(f.eq(f.event.id, f.id))
      expect(
        await f.run(f.notificationRepo.isStillBound(cancelClaim!, cancelClaim!.installations[0]!))
      ).toBe(false)

      // A reopened alert is valid for a live event, but is revoked if it is cancelled again.
      const reopened = await f.enqueue({ eventChangeKind: 'reopened' })
      const [reopenClaim] = await f.run(f.notificationRepo.claimPending(1))
      expect(reopenClaim?.id).toBe(reopened.id)
      expect(
        await f.run(f.notificationRepo.isStillBound(reopenClaim!, reopenClaim!.installations[0]!))
      ).toBe(true)
      await f.db.update(f.event).set({ status: 'cancelled' }).where(f.eq(f.event.id, f.id))
      expect(
        await f.run(f.notificationRepo.isStillBound(reopenClaim!, reopenClaim!.installations[0]!))
      ).toBe(false)

      // Approved child alerts still require the root event to remain live.
      await f.db.update(f.event).set({ status: 'ongoing' }).where(f.eq(f.event.id, f.id))
      await f.db.insert(f.event).values({
        id: childId,
        organizationId: (
          await f.db
            .select({ organizationId: f.event.organizationId })
            .from(f.event)
            .where(f.eq(f.event.id, f.id))
        )[0]!.organizationId,
        parentEventId: f.id,
        title: 'Child dispatch test',
        category: 'other',
        purpose: 'part_of_event',
        planningStatus: 'approved',
        timeZone: 'UTC',
        startsAt: new Date('2031-01-02T00:00:00Z'),
        createdByUserId: f.recipientId,
      })
      await f.db.insert(f.eventParticipant).values({
        eventId: childId,
        personId: f.personId,
        role: 'host',
        planningPermission: 'manage',
      })
      const childAlert = await f.enqueue({ eventId: childId, eventChangeKind: 'location' })
      const [childClaim] = await f.run(f.notificationRepo.claimPending(1))
      expect(childClaim?.id).toBe(childAlert.id)
      expect(
        await f.run(f.notificationRepo.isStillBound(childClaim!, childClaim!.installations[0]!))
      ).toBe(true)
      await f.db.update(f.event).set({ status: 'cancelled' }).where(f.eq(f.event.id, f.id))
      expect(
        await f.run(f.notificationRepo.isStillBound(childClaim!, childClaim!.installations[0]!))
      ).toBe(false)
    } finally {
      await f.db
        .delete(f.nativeNotificationOutbox)
        .where(f.eq(f.nativeNotificationOutbox.eventId, childId))
      await f.db.delete(f.event).where(f.eq(f.event.id, childId))
      await f.cleanup()
    }
  }
)

test(
  'corrupted token cleanup releases ownership for a new installation',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    const f = await fixture()
    const replacementId = randomUUID()
    try {
      await f.enqueue()
      await f.db
        .update(f.notificationInstallation)
        .set({ tokenCiphertext: 'corrupted-ciphertext' })
        .where(f.eq(f.notificationInstallation.id, f.installationId))
      const [item] = await f.run(f.notificationRepo.claimPending(1))
      expect(item?.installations).toEqual([])
      const [disabled] = await f.db
        .select()
        .from(f.notificationInstallation)
        .where(f.eq(f.notificationInstallation.id, f.installationId))
      expect(disabled).toMatchObject({
        enabled: false,
        recipientKind: null,
        recipientId: null,
        platform: null,
        tokenHash: null,
        tokenCiphertext: null,
        revision: 1,
        bindingGeneration: 1,
      })
      expect(disabled?.detachedAt).toBeInstanceOf(Date)
      const registered = await f.run(
        f.notificationRepo.register({
          ...f.registration,
          id: replacementId,
          secret: randomBytes(32).toString('base64url'),
        })
      )
      expect(registered).toMatchObject({ installationId: replacementId, accepted: true })
      const [replacement] = await f.db
        .select()
        .from(f.notificationInstallation)
        .where(f.eq(f.notificationInstallation.id, replacementId))
      expect(replacement).toMatchObject({ enabled: true, recipientId: f.recipientId })
      expect(replacement?.tokenHash).toHaveLength(64)
    } finally {
      await f.db
        .delete(f.notificationInstallation)
        .where(f.eq(f.notificationInstallation.id, replacementId))
      await f.cleanup()
    }
  }
)

test(
  'fresh mutation scope claims once under concurrency and leaves unrelated backlog untouched',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    const f = await fixture()
    try {
      const mutationIds = [randomUUID(), randomUUID()]
      const options = {
        scope: { kind: 'mutations' as const, mutationIds },
        freshOnly: true as const,
      }
      const fresh = await Promise.all(
        Array.from({ length: 6 }, (_, index) =>
          f.enqueue({ mutationId: mutationIds[index % mutationIds.length]! })
        )
      )
      const untouched = await Promise.all([
        f.enqueue(),
        f.enqueue({
          mutationId: mutationIds[0],
          attempts: 1,
          nextAttemptAt: new Date(Date.now() + 3_600_000),
        }),
        f.enqueue({
          mutationId: mutationIds[0],
          state: 'leased',
          attempts: 1,
          leaseKey: randomUUID(),
          leaseUntil: new Date(Date.now() - 60_000),
        }),
        f.enqueue({
          mutationId: mutationIds[0],
          state: 'delivered',
          attempts: 1,
          deliveredAt: new Date(),
        }),
        f.enqueue({ mutationId: mutationIds[0], state: 'discarded', attempts: 0 }),
        f.enqueue({ attempts: 8 }),
        f.enqueue({ createdAt: new Date(Date.now() - 25 * 3_600_000) }),
      ])
      expect(
        await f.run(
          f.notificationRepo.claimPending(100, {
            scope: { kind: 'mutations', mutationIds: [] },
            freshOnly: true,
          })
        )
      ).toEqual([])
      const claims = (
        await Promise.all(
          Array.from({ length: 6 }, () => f.run(f.notificationRepo.claimPending(1, options)))
        )
      ).flat()
      expect(claims.map((item) => item.id).sort()).toEqual(fresh.map((row) => row.id).sort())
      expect(new Set(claims.map((item) => item.id)).size).toBe(6)
      expect(await f.run(f.notificationRepo.claimPending(100, options))).toEqual([])
      for (const item of claims) await f.run(f.notificationRepo.delivered(item))
      expect(await f.run(f.notificationRepo.claimPending(100, options))).toEqual([])
      for (const row of untouched) expect(await f.row(row.id)).toEqual(row)
    } finally {
      await f.cleanup()
    }
  }
)

test(
  'announcement scope is isolated from mutation IDs and other notification entities',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    const f = await fixture()
    try {
      const { eventAnnouncement } = await import('@/db/schema/announcement.schema')
      const { workspacePerson } = await import('@/db/schema/event.schema')
      const [eventRow] = await f.db.select().from(f.event).where(f.eq(f.event.id, f.id))
      const authorPersonId = randomUUID()
      await f.db.insert(workspacePerson).values({
        id: authorPersonId,
        organizationId: eventRow!.organizationId,
        userId: f.otherRecipientId,
        displayName: 'Announcement author',
      })
      await f.db.insert(f.eventParticipant).values({
        eventId: f.id,
        personId: authorPersonId,
        role: 'collaborator',
        planningPermission: 'manage',
      })
      const announcementId = randomUUID()
      const otherAnnouncementId = randomUUID()
      await f.db.insert(eventAnnouncement).values(
        [announcementId, otherAnnouncementId].map((id) => ({
          id,
          eventId: f.id,
          authorUserId: f.otherRecipientId,
          requestId: randomUUID(),
          message: 'Scoped announcement test',
          audience: 'planning' as const,
        }))
      )
      const mutationId = randomUUID()
      const announcement = await f.enqueue({
        type: 'event_announcement',
        entityId: announcementId,
        mutationId,
      })
      const otherAnnouncement = await f.enqueue({
        type: 'event_announcement',
        entityId: otherAnnouncementId,
        mutationId,
      })
      const mutation = await f.enqueue({ mutationId })
      const sameEntityDifferentType = await f.enqueue({ entityId: announcementId })
      const mutationOptions = {
        scope: { kind: 'mutations' as const, mutationIds: [mutationId] },
        freshOnly: true as const,
      }
      const mutationClaims = await f.run(f.notificationRepo.claimPending(100, mutationOptions))
      expect(mutationClaims.map((item) => item.id)).toEqual([mutation.id])
      expect(await f.row(announcement.id)).toEqual(announcement)
      expect(await f.row(otherAnnouncement.id)).toEqual(otherAnnouncement)
      const announcementOptions = {
        scope: { kind: 'announcement' as const, announcementId },
        freshOnly: true as const,
      }
      const announcementClaims = await f.run(
        f.notificationRepo.claimPending(100, announcementOptions)
      )
      expect(announcementClaims.map((item) => item.id)).toEqual([announcement.id])
      expect(await f.row(otherAnnouncement.id)).toEqual(otherAnnouncement)
      expect(await f.row(sameEntityDifferentType.id)).toEqual(sameEntityDifferentType)
      expect(await f.run(f.notificationRepo.claimPending(100, announcementOptions))).toEqual([])
      expect(
        await f.run(
          f.notificationRepo.discardFresh({
            kind: 'announcement',
            announcementId: otherAnnouncementId,
          })
        )
      ).toBe(1)
      expect(await f.row(otherAnnouncement.id)).toMatchObject({ state: 'discarded', attempts: 0 })
      expect(await f.row(sameEntityDifferentType.id)).toEqual(sameEntityDifferentType)
      expect(await f.row(announcement.id)).toMatchObject({ state: 'leased', attempts: 1 })
    } finally {
      await f.cleanup()
    }
  }
)

test(
  'discardFresh clears only scoped untouched intents even with disabled installations',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    const f = await fixture()
    try {
      await f.run(f.notificationRepo.register({ ...f.registration, revision: 2, enabled: false }))
      const mutationId = randomUUID()
      const scope = { kind: 'mutations' as const, mutationIds: [mutationId] }
      const fresh = await Promise.all([f.enqueue({ mutationId }), f.enqueue({ mutationId })])
      const untouched = await Promise.all([
        f.enqueue(),
        f.enqueue({ mutationId, attempts: 1, nextAttemptAt: new Date(Date.now() + 60_000) }),
        f.enqueue({
          mutationId,
          state: 'leased',
          attempts: 0,
          leaseKey: randomUUID(),
          leaseUntil: new Date(Date.now() - 60_000),
        }),
        f.enqueue({ mutationId, state: 'delivered', attempts: 0, deliveredAt: new Date() }),
        f.enqueue({ mutationId, state: 'discarded', attempts: 0 }),
        f.enqueue({ mutationId, type: 'event_announcement', entityId: randomUUID() }),
      ])
      expect(
        await f.run(f.notificationRepo.discardFresh({ kind: 'mutations', mutationIds: [] }))
      ).toBe(0)
      expect(await f.run(f.notificationRepo.discardFresh(scope))).toBe(2)
      expect(await f.run(f.notificationRepo.discardFresh(scope))).toBe(0)
      for (const row of fresh)
        expect(await f.row(row.id)).toMatchObject({
          state: 'discarded',
          attempts: 0,
          leaseKey: null,
          leaseUntil: null,
        })
      for (const row of untouched) expect(await f.row(row.id)).toEqual(row)
    } finally {
      await f.cleanup()
    }
  }
)

import { expect, test } from 'vitest'
import { createHash, randomBytes, randomUUID } from 'node:crypto'

const enabled = process.env.RUN_ANNOUNCEMENT_DB_TESTS === '1'
function assertDisposableLocalDatabase() {
  const url = process.env.DATABASE_URL
  if (!url || !['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname))
    throw new Error('Announcement tests require a disposable localhost DATABASE_URL')
}

test(
  'announcements enforce exact participation, host sends, atomic capture, retry receipts, dispatch suppression, and deletion privacy',
  { skip: !enabled, timeout: 60_000 },
  async () => {
    assertDisposableLocalDatabase()
    const { db, PgClientLive } = await import('@/db')
    const { user, organization, member } = await import('@/db/schema/auth.schema')
    const { event, eventParticipant, eventDeparture, workspacePerson, eventGuestProfile } =
      await import('@/db/schema/event.schema')
    const { eventAnnouncement } = await import('@/db/schema/announcement.schema')
    const { nativeNotificationOutbox, notificationInstallation } =
      await import('@/db/schema/notification.schema')
    const { announcementRepo } = await import('@/server/announcements/repos/announcement.repo.live')
    const { notificationRepo } = await import('@/server/notifications/repos/notification.repo.live')
    const { verifyDeviceGuestProfile } =
      await import('@/server/events/repos/device-guest.repo.persistence')
    const { Effect, Result } = await import('effect')
    const { and, eq, sql } = await import('drizzle-orm')
    const id = randomUUID()
    const organizationId = `announcement-${id}`
    const [
      rootId,
      childId,
      siblingId,
      hostPerson,
      childPerson,
      managerPerson,
      guestPerson,
      guestId,
      installationId,
      guestInstallationId,
      hostInstallationId,
      managerInstallationId,
    ] = Array.from({ length: 12 }, randomUUID)
    const host = `host-${id}`,
      child = `child-${id}`,
      manager = `manager-${id}`,
      outsider = `outsider-${id}`
    const credential = randomBytes(32).toString('base64url')
    const triggerName = `announcement_test_${id.replaceAll('-', '')}`
    const list = (eventId: string, actor: { kind: 'user' | 'device_guest'; id: string }) =>
      Effect.runPromise(
        announcementRepo.list({ eventId, actor }).pipe(Effect.provide(PgClientLive))
      )
    const send = (
      message: string,
      requestId: string = randomUUID(),
      userId = host,
      audience?: 'all' | 'planning' | 'guests'
    ) =>
      Effect.runPromise(
        announcementRepo
          .send({ eventId: childId!, requestId, message, userId, audience })
          .pipe(Effect.provide(PgClientLive))
      )
    const failed = async <A, E>(
      program: import('effect').Effect.Effect<A, E, import('@effect/sql-pg/PgClient').PgClient>
    ) => {
      const result = await Effect.runPromise(
        Effect.result(program.pipe(Effect.provide(PgClientLive)))
      )
      expect(Result.isFailure(result)).toBe(true)
      return Result.isFailure(result) ? result.failure : undefined
    }
    try {
      await db.insert(user).values(
        [host, child, manager, outsider].map((userId) => ({
          id: userId,
          name: `Private ${userId}`,
          email: `${userId}@example.test`,
          emailVerified: true,
        }))
      )
      await db.insert(organization).values({
        id: organizationId,
        name: 'Announcement test',
        slug: organizationId,
        createdAt: new Date(),
        workspaceType: 'event',
      })
      await db.insert(member).values({
        id: randomUUID(),
        organizationId,
        userId: outsider,
        role: 'owner',
        createdAt: new Date(),
      })
      await db.insert(event).values({
        id: rootId!,
        organizationId,
        title: 'Parent',
        timeZone: 'UTC',
        status: 'draft',
        startsAt: new Date(),
        createdByUserId: host,
      })
      await db.insert(event).values(
        [childId, siblingId].map((eventId) => ({
          id: eventId!,
          parentEventId: rootId!,
          organizationId,
          title: 'Private child',
          timeZone: 'UTC',
          purpose: 'planning_scouting' as const,
          category: 'other' as const,
          planningStatus: 'draft' as const,
          startsAt: new Date(),
          createdByUserId: host,
        }))
      )
      await db.insert(eventGuestProfile).values({
        id: guestId!,
        displayName: 'Private device guest',
        credentialHash: createHash('sha256').update(`${guestId}:${credential}`).digest('hex'),
      })
      await db.insert(workspacePerson).values([
        { id: hostPerson!, organizationId, userId: host, displayName: 'Private Host' },
        { id: childPerson!, organizationId, userId: child, displayName: 'Private Child' },
        { id: managerPerson!, organizationId, userId: manager, displayName: 'Private Manager' },
        { id: guestPerson!, organizationId, guestProfileId: guestId!, displayName: 'Device guest' },
      ])
      await db.insert(eventParticipant).values([
        { eventId: rootId!, personId: hostPerson!, role: 'host', planningPermission: 'manage' },
        { eventId: childId!, personId: hostPerson!, role: 'host', planningPermission: 'manage' },
        {
          eventId: childId!,
          personId: childPerson!,
          role: 'guest',
          planningPermission: 'view_only',
        },
        {
          eventId: childId!,
          personId: managerPerson!,
          role: 'collaborator',
          planningPermission: 'manage',
        },
        {
          eventId: childId!,
          personId: guestPerson!,
          role: 'guest',
          planningPermission: 'view_only',
        },
      ])
      expect(await list(childId!, { kind: 'user', id: child })).toEqual({
        announcements: [],
        canSend: false,
        allowedAudiences: [],
      })
      expect(await list(childId!, { kind: 'user', id: manager })).toEqual({
        announcements: [],
        canSend: true,
        allowedAudiences: ['planning'],
      })
      for (const eventId of [rootId!, siblingId!])
        await failed(announcementRepo.list({ eventId, actor: { kind: 'user', id: child } }))
      await failed(
        announcementRepo.list({ eventId: childId!, actor: { kind: 'user', id: outsider } })
      )
      for (const userId of [child, manager, outsider])
        await failed(
          announcementRepo.send({
            eventId: childId!,
            userId,
            requestId: randomUUID(),
            message: 'Denied',
          })
        )
      await failed(
        verifyDeviceGuestProfile({
          guestId: guestId!,
          credential: randomBytes(32).toString('base64url'),
        })
      )
      expect(
        await Effect.runPromise(
          verifyDeviceGuestProfile({ guestId: guestId!, credential }).pipe(
            Effect.provide(PgClientLive)
          )
        )
      ).toMatchObject({ id: guestId })

      // A failure during notification capture rolls back the canonical send as well.
      await db.execute(
        sql.raw(
          `create function ${triggerName}() returns trigger language plpgsql as $$ begin if NEW.event_id = '${childId}' then raise exception 'announcement test capture failure'; end if; return NEW; end $$`
        )
      )
      await db.execute(
        sql.raw(
          `create trigger ${triggerName} before insert on native_notification_outbox for each row execute function ${triggerName}()`
        )
      )
      await failed(
        announcementRepo.send({
          eventId: childId!,
          userId: host,
          requestId: randomUUID(),
          message: 'Must roll back',
        })
      )
      expect(
        await db.select().from(eventAnnouncement).where(eq(eventAnnouncement.eventId, childId!))
      ).toEqual([])
      await db.execute(sql.raw(`drop trigger ${triggerName} on native_notification_outbox`))
      await db.execute(sql.raw(`drop function ${triggerName}()`))

      const receipt = randomUUID()
      const [first, retry] = await Promise.all([
        send('Private announcement text', receipt),
        send('Private announcement text', receipt),
      ])
      expect(first).toEqual(retry)
      expect(first.authorName).toBe('Host')
      expect(first.createdAt).toMatch(/Z$/)
      expect(await list(childId!, { kind: 'device_guest', id: guestId! })).toEqual({
        announcements: [first],
        canSend: false,
        allowedAudiences: [],
      })
      await failed(
        announcementRepo.list({ eventId: rootId!, actor: { kind: 'device_guest', id: guestId! } })
      )
      const conflict = await failed(
        announcementRepo.send({
          eventId: childId!,
          userId: host,
          requestId: receipt,
          message: 'Changed',
        })
      )
      expect(conflict).toMatchObject({
        _tag: 'ConflictError',
        code: 'ANNOUNCEMENT_REQUEST_CONFLICT',
      })
      const outbox = await db
        .select()
        .from(nativeNotificationOutbox)
        .where(eq(nativeNotificationOutbox.eventId, childId!))
      expect(outbox).toHaveLength(3)
      expect(
        outbox.every((row) => row.type === 'event_announcement' && row.entityId === first.id)
      ).toBe(true)
      expect(JSON.stringify(outbox)).not.toContain('Private announcement text')

      const audienceConflict = await failed(
        announcementRepo.send({
          eventId: childId!,
          userId: host,
          requestId: receipt,
          message: first.message,
          audience: 'planning',
        })
      )
      expect(audienceConflict).toMatchObject({
        _tag: 'ConflictError',
        code: 'ANNOUNCEMENT_REQUEST_CONFLICT',
      })
      const hostPlanning = await send('Private planning update', randomUUID(), host, 'planning')
      const hostGuests = await send('Private guest update', randomUUID(), host, 'guests')
      await db
        .update(eventParticipant)
        .set({ planningPermission: 'contribute' })
        .where(
          and(eq(eventParticipant.eventId, childId!), eq(eventParticipant.personId, managerPerson!))
        )
      expect((await list(childId!, { kind: 'user', id: manager })).allowedAudiences).toEqual([
        'planning',
      ])
      const managerPlanning = await send(
        'Collaborator planning update',
        randomUUID(),
        manager,
        'planning'
      )
      expect(managerPlanning.authorName).toBe('Planning Team')
      const managerRetry = await send(
        'Collaborator planning update',
        (
          await db
            .select()
            .from(eventAnnouncement)
            .where(eq(eventAnnouncement.id, managerPlanning.id))
        )[0]!.requestId,
        manager,
        'planning'
      )
      expect(managerRetry).toEqual(managerPlanning)
      for (const audience of ['all', 'guests'] as const)
        await failed(
          announcementRepo.send({
            eventId: childId!,
            userId: manager,
            requestId: randomUUID(),
            message: 'Denied audience',
            audience,
          })
        )
      await db
        .update(eventParticipant)
        .set({ planningPermission: 'view_only' })
        .where(
          and(eq(eventParticipant.eventId, childId!), eq(eventParticipant.personId, managerPerson!))
        )
      expect((await list(childId!, { kind: 'user', id: manager })).allowedAudiences).toEqual([])
      await failed(
        announcementRepo.send({
          eventId: childId!,
          userId: manager,
          requestId: randomUUID(),
          message: 'Denied viewer send',
          audience: 'planning',
        })
      )
      await db
        .update(eventParticipant)
        .set({ planningPermission: 'contribute' })
        .where(
          and(eq(eventParticipant.eventId, childId!), eq(eventParticipant.personId, managerPerson!))
        )
      const guestHistory = await list(childId!, { kind: 'device_guest', id: guestId! })
      expect(guestHistory.announcements.map((row) => row.id).sort()).toEqual(
        [first.id, hostGuests.id].sort()
      )
      expect((await list(childId!, { kind: 'user', id: child })).announcements).toEqual(
        guestHistory.announcements
      )
      expect(
        (await list(childId!, { kind: 'user', id: manager })).announcements
          .map((row) => row.id)
          .sort()
      ).toEqual([first.id, hostPlanning.id, managerPlanning.id].sort())
      expect((await list(childId!, { kind: 'user', id: host })).announcements).toHaveLength(4)
      const planningRecipients = await db
        .select()
        .from(nativeNotificationOutbox)
        .where(eq(nativeNotificationOutbox.entityId, hostPlanning.id))
      expect(planningRecipients.map((row) => row.recipientId)).toEqual([manager])
      const guestRecipients = await db
        .select()
        .from(nativeNotificationOutbox)
        .where(eq(nativeNotificationOutbox.entityId, hostGuests.id))
      expect(guestRecipients.map((row) => row.recipientId).sort()).toEqual([child, guestId!].sort())
      for (const [installation, recipientId] of [
        [hostInstallationId!, host],
        [managerInstallationId!, manager],
      ])
        await Effect.runPromise(
          notificationRepo
            .register({
              id: installation!,
              secret: randomBytes(32).toString('base64url'),
              revision: 1,
              recipient: { kind: 'user', id: recipientId! },
              platform: 'ios',
              locale: 'en',
              token: `audience-test-${installation}`,
              enabled: true,
            })
            .pipe(Effect.provide(PgClientLive))
        )

      await Effect.runPromise(
        notificationRepo
          .register({
            id: installationId!,
            secret: randomBytes(32).toString('base64url'),
            revision: 1,
            recipient: { kind: 'user', id: child },
            platform: 'ios',
            locale: 'en',
            token: `test-${id}`,
            enabled: true,
          })
          .pipe(Effect.provide(PgClientLive))
      )
      await Effect.runPromise(
        notificationRepo
          .register({
            id: guestInstallationId!,
            secret: randomBytes(32).toString('base64url'),
            revision: 1,
            recipient: { kind: 'device_guest', id: guestId! },
            platform: 'ios',
            locale: 'es',
            token: `guest-test-${id}`,
            enabled: true,
          })
          .pipe(Effect.provide(PgClientLive))
      )
      const items = await Effect.runPromise(
        notificationRepo.claimPending(100).pipe(Effect.provide(PgClientLive))
      )
      const item = items.find((row) => row.entityId === first.id && row.recipient.id === child)!
      const planningItem = items.find(
        (row) => row.entityId === hostPlanning.id && row.recipient.id === manager
      )!
      const managerAuthorItem = items.find(
        (row) => row.entityId === managerPlanning.id && row.recipient.id === host
      )!
      expect(
        await Effect.runPromise(
          notificationRepo
            .isStillBound(planningItem, planningItem.installations[0]!)
            .pipe(Effect.provide(PgClientLive))
        )
      ).toBe(true)
      await db
        .update(eventParticipant)
        .set({ role: 'guest', planningPermission: 'view_only' })
        .where(
          and(eq(eventParticipant.eventId, childId!), eq(eventParticipant.personId, managerPerson!))
        )
      expect(
        await Effect.runPromise(
          notificationRepo
            .isStillBound(planningItem, planningItem.installations[0]!)
            .pipe(Effect.provide(PgClientLive))
        )
      ).toBe(false)
      expect(
        (await list(childId!, { kind: 'user', id: manager })).announcements.every(
          (row) => row.audience !== 'planning'
        )
      ).toBe(true)
      await db
        .update(eventParticipant)
        .set({ role: 'collaborator', planningPermission: 'view_only' })
        .where(
          and(eq(eventParticipant.eventId, childId!), eq(eventParticipant.personId, managerPerson!))
        )
      expect(
        await Effect.runPromise(
          notificationRepo
            .isStillBound(planningItem, planningItem.installations[0]!)
            .pipe(Effect.provide(PgClientLive))
        )
      ).toBe(true)
      expect(
        await Effect.runPromise(
          notificationRepo
            .isStillBound(managerAuthorItem, managerAuthorItem.installations[0]!)
            .pipe(Effect.provide(PgClientLive))
        )
      ).toBe(false)
      await db
        .update(eventParticipant)
        .set({ planningPermission: 'contribute' })
        .where(
          and(eq(eventParticipant.eventId, childId!), eq(eventParticipant.personId, managerPerson!))
        )
      expect(
        await Effect.runPromise(
          notificationRepo
            .isStillBound(managerAuthorItem, managerAuthorItem.installations[0]!)
            .pipe(Effect.provide(PgClientLive))
        )
      ).toBe(true)
      const guestItem = items.find(
        (row) => row.eventId === childId && row.recipient.id === guestId
      )!
      expect(guestItem.installations).toHaveLength(1)
      expect(
        await Effect.runPromise(
          notificationRepo
            .isStillBound(guestItem, guestItem.installations[0]!)
            .pipe(Effect.provide(PgClientLive))
        )
      ).toBe(true)
      expect(item.installations).toHaveLength(1)
      expect(
        await Effect.runPromise(
          notificationRepo
            .isStillBound(item, item.installations[0]!)
            .pipe(Effect.provide(PgClientLive))
        )
      ).toBe(true)
      await db.insert(eventDeparture).values({ eventId: childId!, userId: child })
      expect(
        await Effect.runPromise(
          notificationRepo
            .isStillBound(item, item.installations[0]!)
            .pipe(Effect.provide(PgClientLive))
        )
      ).toBe(false)
      await failed(announcementRepo.list({ eventId: childId!, actor: { kind: 'user', id: child } }))
      await db
        .delete(eventDeparture)
        .where(and(eq(eventDeparture.eventId, childId!), eq(eventDeparture.userId, child)))
      await db
        .update(eventParticipant)
        .set({ role: 'collaborator', planningPermission: 'manage' })
        .where(
          and(eq(eventParticipant.eventId, childId!), eq(eventParticipant.personId, hostPerson!))
        )
      expect(
        await Effect.runPromise(
          notificationRepo
            .isStillBound(item, item.installations[0]!)
            .pipe(Effect.provide(PgClientLive))
        )
      ).toBe(false)
      await db
        .update(eventParticipant)
        .set({ role: 'host' })
        .where(
          and(eq(eventParticipant.eventId, childId!), eq(eventParticipant.personId, hostPerson!))
        )
      await db
        .update(eventGuestProfile)
        .set({ claimedAt: new Date(), claimedByUserId: manager })
        .where(eq(eventGuestProfile.id, guestId!))
      await failed(
        announcementRepo.list({ eventId: childId!, actor: { kind: 'device_guest', id: guestId! } })
      )
      await failed(verifyDeviceGuestProfile({ guestId: guestId!, credential }))
      expect(
        await Effect.runPromise(
          notificationRepo
            .isStillBound(guestItem, guestItem.installations[0]!)
            .pipe(Effect.provide(PgClientLive))
        )
      ).toBe(false)

      await db.insert(eventAnnouncement).values(
        Array.from({ length: 55 }, (_, index) => ({
          eventId: childId!,
          authorUserId: host,
          requestId: randomUUID(),
          message: `History ${index}`,
          audience: 'planning' as const,
          createdAt: new Date('2036-10-20T12:00:00Z'),
        }))
      )
      const history = await list(childId!, { kind: 'user', id: manager })
      expect(
        (await list(childId!, { kind: 'user', id: child })).announcements
          .map((row) => row.id)
          .sort()
      ).toEqual([first.id, hostGuests.id].sort())
      expect(history.announcements).toHaveLength(50)
      expect(history.announcements).toEqual(
        [...history.announcements].sort(
          (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
        )
      )
      await db.update(event).set({ completionStatus: 'complete' }).where(eq(event.id, childId!))
      expect((await list(childId!, { kind: 'user', id: host })).canSend).toBe(false)
      await failed(
        announcementRepo.send({
          eventId: childId!,
          userId: host,
          requestId: randomUUID(),
          message: 'After completion',
        })
      )
      await db.delete(user).where(eq(user.id, host))
      const [afterDeletion] = await db
        .select()
        .from(eventAnnouncement)
        .where(eq(eventAnnouncement.id, first.id))
      expect(afterDeletion?.authorUserId).toBeNull()
      expect(
        (await list(childId!, { kind: 'user', id: manager })).announcements.every(
          (row) => row.authorName === 'Host'
        )
      ).toBe(true)
      await db.delete(event).where(eq(event.id, childId!))
      expect(
        await db.select().from(eventAnnouncement).where(eq(eventAnnouncement.eventId, childId!))
      ).toEqual([])
      expect(await db.select().from(event).where(eq(event.id, rootId!))).toHaveLength(1)
    } finally {
      await db.execute(
        sql.raw(`drop trigger if exists ${triggerName} on native_notification_outbox`)
      )
      await db.execute(sql.raw(`drop function if exists ${triggerName}()`))
      await db
        .delete(nativeNotificationOutbox)
        .where(eq(nativeNotificationOutbox.eventId, childId!))
      await db
        .delete(notificationInstallation)
        .where(eq(notificationInstallation.id, installationId!))
      await db
        .delete(notificationInstallation)
        .where(eq(notificationInstallation.id, guestInstallationId!))
      for (const installation of [hostInstallationId!, managerInstallationId!])
        await db
          .delete(notificationInstallation)
          .where(eq(notificationInstallation.id, installation))
      await db.delete(organization).where(eq(organization.id, organizationId))
      await db.delete(eventGuestProfile).where(eq(eventGuestProfile.id, guestId!))
      for (const userId of [host, child, manager, outsider])
        await db.delete(user).where(eq(user.id, userId))
    }
  }
)

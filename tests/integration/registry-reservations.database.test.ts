import { Effect, Exit } from 'effect'
import { and, eq } from 'drizzle-orm'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_REGISTRY_RESERVATION_DB_TESTS === '1'

test.skipIf(!enabled)(
  'shared registry reservations enforce exact access, capacity, idempotency, claim merge, and aggregate privacy',
  { timeout: 60_000 },
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL must target the disposable local registry test database'
    ).toBeTruthy()
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(new URL(databaseUrl!).hostname)

    const [{ db, PgClientLive }, schema, reservations, guest] = await Promise.all([
      import('@/db'),
      import('@/db/schema'),
      import('@/server/events/repos/registry-reservation.repo.persistence'),
      import('@/server/events/repos/device-guest.repo.persistence'),
    ])
    const run = <A, E>(
      program: Effect.Effect<A, E, import('effect/Layer').Success<typeof PgClientLive>>
    ) => Effect.runPromise(program.pipe(Effect.provide(PgClientLive)))
    const runExit = <A, E>(
      program: Effect.Effect<A, E, import('effect/Layer').Success<typeof PgClientLive>>
    ) => Effect.runPromiseExit(program.pipe(Effect.provide(PgClientLive)))

    const suffix = crypto.randomUUID().replaceAll('-', '')
    const hostId = `registry-host-${suffix}`
    const accountGuestId = `registry-account-guest-${suffix}`
    const crossOrgUserId = `registry-cross-org-${suffix}`
    const orgId = `registry-org-${suffix}`
    const privateOrgId = `registry-private-org-${suffix}`
    const hostPersonId = crypto.randomUUID()
    const accountPersonId = crypto.randomUUID()
    const guestId = crypto.randomUUID()
    const guestPersonId = crypto.randomUUID()
    const eventId = crypto.randomUUID()
    const unauthorizedEventId = crypto.randomUUID()
    const authorizedChildEventId = crypto.randomUUID()
    const privateEventId = crypto.randomUUID()
    const reservationItemId = crypto.randomUUID()
    const lastUnitItemId = crypto.randomUUID()
    const privateItemId = crypto.randomUUID()
    const mergeConflictItemId = crypto.randomUUID()
    const leaveCheckItemId = crypto.randomUUID()
    const childItemId = crypto.randomUUID()
    const credential = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url')
    const accountActor = { kind: 'user' as const, id: accountGuestId }
    const guestActor = { kind: 'device_guest' as const, id: guestId, credential }

    try {
      await db.insert(schema.user).values([
        { id: hostId, name: 'Registry host', email: `${hostId}@example.test`, emailVerified: true },
        {
          id: accountGuestId,
          name: 'Account guest',
          email: `${accountGuestId}@example.test`,
          emailVerified: true,
        },
        {
          id: crossOrgUserId,
          name: 'Cross organization',
          email: `${crossOrgUserId}@example.test`,
          emailVerified: true,
        },
      ])
      await db.insert(schema.organization).values([
        {
          id: orgId,
          slug: orgId,
          name: 'Shared registry test',
          workspaceType: 'event',
          createdAt: new Date(),
        },
        {
          id: privateOrgId,
          slug: privateOrgId,
          name: 'Private registry test',
          workspaceType: 'event',
          createdAt: new Date(),
        },
      ])
      await db.insert(schema.event).values([
        {
          id: eventId,
          organizationId: orgId,
          title: 'Reservation event',
          status: 'draft',
          schedulingState: 'unscheduled',
          timeZone: 'America/Detroit',
        },
        {
          id: unauthorizedEventId,
          organizationId: orgId,
          parentEventId: eventId,
          title: 'Other event',
          planningStatus: 'approved',
          schedulingState: 'unscheduled',
          category: 'other',
          purpose: 'part_of_event',
          timeZone: 'America/Detroit',
        },
        {
          id: authorizedChildEventId,
          organizationId: orgId,
          parentEventId: eventId,
          title: 'Account guest child',
          planningStatus: 'approved',
          schedulingState: 'unscheduled',
          category: 'other',
          purpose: 'part_of_event',
          timeZone: 'America/Detroit',
        },
        {
          id: privateEventId,
          organizationId: privateOrgId,
          title: 'Private event',
          status: 'draft',
          schedulingState: 'unscheduled',
          timeZone: 'America/Detroit',
        },
      ])
      await db.insert(schema.workspacePlanningSettings).values([
        { organizationId: orgId, registryShared: true },
        { organizationId: privateOrgId, registryShared: false },
      ])
      await db.insert(schema.workspacePerson).values([
        { id: hostPersonId, organizationId: orgId, userId: hostId, displayName: 'Host' },
        {
          id: accountPersonId,
          organizationId: orgId,
          userId: accountGuestId,
          displayName: 'Account guest',
        },
        {
          id: crypto.randomUUID(),
          organizationId: privateOrgId,
          userId: crossOrgUserId,
          displayName: 'Cross organization',
        },
        {
          id: crypto.randomUUID(),
          organizationId: privateOrgId,
          userId: accountGuestId,
          displayName: 'Account guest',
        },
      ])
      const privatePerson = await db
        .select()
        .from(schema.workspacePerson)
        .where(
          and(
            eq(schema.workspacePerson.organizationId, privateOrgId),
            eq(schema.workspacePerson.userId, accountGuestId)
          )
        )
        .limit(1)
      const crossOrgPerson = await db
        .select()
        .from(schema.workspacePerson)
        .where(
          and(
            eq(schema.workspacePerson.organizationId, privateOrgId),
            eq(schema.workspacePerson.userId, crossOrgUserId)
          )
        )
        .limit(1)
      await db.insert(schema.eventParticipant).values([
        { eventId, personId: hostPersonId, role: 'host', planningPermission: 'manage' },
        { eventId, personId: accountPersonId, role: 'guest', planningPermission: 'view_only' },
        {
          eventId,
          personId: crossOrgPerson[0]!.id,
          role: 'guest',
          planningPermission: 'view_only',
        },
        {
          eventId: authorizedChildEventId,
          personId: accountPersonId,
          role: 'guest',
          planningPermission: 'view_only',
        },
        {
          eventId: privateEventId,
          personId: privatePerson[0]!.id,
          role: 'guest',
          planningPermission: 'view_only',
        },
      ])
      await run(guest.registerDeviceGuestProfile({ id: guestId, name: 'Device guest', credential }))
      await db.insert(schema.workspacePerson).values({
        id: guestPersonId,
        organizationId: orgId,
        guestProfileId: guestId,
        displayName: 'Device guest',
      })
      await db.insert(schema.eventParticipant).values({
        eventId,
        personId: guestPersonId,
        role: 'guest',
        planningPermission: 'view_only',
      })
      await db.insert(schema.registryItem).values([
        {
          id: reservationItemId,
          organizationId: orgId,
          eventId,
          title: 'Two place settings',
          category: 'home',
          quantity: 2,
        },
        {
          id: lastUnitItemId,
          organizationId: orgId,
          eventId,
          title: 'One place setting',
          category: 'home',
          quantity: 1,
        },
        {
          id: privateItemId,
          organizationId: privateOrgId,
          eventId: privateEventId,
          title: 'Private gift',
          category: 'home',
          quantity: 1,
        },
        {
          id: mergeConflictItemId,
          organizationId: orgId,
          eventId,
          title: 'Capacity changed gift',
          category: 'home',
          quantity: 2,
        },
        {
          id: leaveCheckItemId,
          organizationId: orgId,
          eventId,
          title: 'Leave account gift',
          category: 'home',
          quantity: 3,
        },
        {
          id: childItemId,
          organizationId: orgId,
          eventId: authorizedChildEventId,
          title: 'Other event gift',
          category: 'home',
          quantity: 2,
        },
      ])

      const initial = await run(reservations.listVisibleRegistry(eventId, guestActor))
      expect(initial.items.map((item) => item.title)).toContain('Two place settings')
      expect(JSON.stringify(initial)).not.toContain(guestId)
      expect(JSON.stringify(initial)).not.toContain(accountGuestId)
      const crossOrgAccess = await runExit(
        reservations.listVisibleRegistry(eventId, { kind: 'user', id: crossOrgUserId })
      )
      expect(Exit.isFailure(crossOrgAccess)).toBe(true)

      const firstRequestId = crypto.randomUUID()
      const first = await run(
        reservations.changeRegistryReservation(
          eventId,
          accountActor,
          {
            requestId: firstRequestId,
            itemId: reservationItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      expect(first).toMatchObject({ committedCount: 1, reservedQuantity: 1, availableCount: 1 })
      const firstRetry = await run(
        reservations.changeRegistryReservation(
          eventId,
          accountActor,
          {
            requestId: firstRequestId,
            itemId: reservationItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      expect(firstRetry).toMatchObject({ committedCount: 1, reservedQuantity: 1, replayed: true })

      const newerRequestId = crypto.randomUUID()
      const newer = await run(
        reservations.changeRegistryReservation(
          eventId,
          accountActor,
          {
            requestId: newerRequestId,
            itemId: reservationItemId,
            quantity: 2,
          },
          'reserve'
        )
      )
      expect(newer).toMatchObject({ committedCount: 2, reservedQuantity: 2, availableCount: 0 })
      const staleRetry = await run(
        reservations.changeRegistryReservation(
          eventId,
          accountActor,
          {
            requestId: firstRequestId,
            itemId: reservationItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      expect(staleRetry).toMatchObject({ committedCount: 2, reservedQuantity: 2, replayed: true })
      const reusedKey = await runExit(
        reservations.changeRegistryReservation(
          eventId,
          accountActor,
          {
            requestId: newerRequestId,
            itemId: reservationItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      expect(Exit.isFailure(reusedKey)).toBe(true)
      const fullCapacity = await runExit(
        reservations.changeRegistryReservation(
          eventId,
          guestActor,
          {
            requestId: crypto.randomUUID(),
            itemId: reservationItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      expect(Exit.isFailure(fullCapacity)).toBe(true)

      const cancelRequestId = crypto.randomUUID()
      const cancelled = await run(
        reservations.changeRegistryReservation(
          eventId,
          accountActor,
          {
            requestId: cancelRequestId,
            itemId: reservationItemId,
          },
          'cancel'
        )
      )
      expect(cancelled).toMatchObject({ committedCount: 0, reservedQuantity: 0, availableCount: 2 })
      const cancelledRetry = await run(
        reservations.changeRegistryReservation(
          eventId,
          accountActor,
          {
            requestId: cancelRequestId,
            itemId: reservationItemId,
          },
          'cancel'
        )
      )
      expect(cancelledRetry).toMatchObject({
        committedCount: 0,
        reservedQuantity: 0,
        replayed: true,
      })
      const secondCancelled = await run(
        reservations.changeRegistryReservation(
          eventId,
          accountActor,
          {
            requestId: crypto.randomUUID(),
            itemId: reservationItemId,
          },
          'cancel'
        )
      )
      expect(secondCancelled.committedCount).toBe(0)

      const race = await Promise.allSettled([
        run(
          reservations.changeRegistryReservation(
            eventId,
            accountActor,
            {
              requestId: crypto.randomUUID(),
              itemId: lastUnitItemId,
              quantity: 1,
            },
            'reserve'
          )
        ),
        run(
          reservations.changeRegistryReservation(
            eventId,
            guestActor,
            {
              requestId: crypto.randomUUID(),
              itemId: lastUnitItemId,
              quantity: 1,
            },
            'reserve'
          )
        ),
      ])
      expect(race.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
      expect(race.filter((result) => result.status === 'rejected')).toHaveLength(1)
      const racedAggregate = await run(reservations.listVisibleRegistry(eventId, accountActor))
      const racedItem = racedAggregate.items.find((item) => item.id === lastUnitItemId)!
      expect(racedItem).toMatchObject({ committedCount: 1, availableCount: 0 })
      expect(racedItem.canReserve).toBe(racedItem.isReservedByViewer)

      await run(
        reservations.changeRegistryReservation(
          eventId,
          accountActor,
          {
            requestId: crypto.randomUUID(),
            itemId: reservationItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      await run(
        reservations.changeRegistryReservation(
          eventId,
          guestActor,
          {
            requestId: crypto.randomUUID(),
            itemId: reservationItemId,
            quantity: 1,
          },
          'reserve'
        )
      )

      // Simulate an organizer lowering capacity after both actors reserved.
      // Claim must not silently discard either commitment or exceed capacity.
      await run(
        reservations.changeRegistryReservation(
          eventId,
          accountActor,
          {
            requestId: crypto.randomUUID(),
            itemId: mergeConflictItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      await run(
        reservations.changeRegistryReservation(
          eventId,
          guestActor,
          {
            requestId: crypto.randomUUID(),
            itemId: mergeConflictItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      await db
        .update(schema.registryItem)
        .set({ quantity: 1 })
        .where(eq(schema.registryItem.id, mergeConflictItemId))
      const claimCollision = await runExit(
        guest.claimDeviceGuestProfile({
          guestId,
          credential,
          userId: accountGuestId,
          account: { name: 'Account guest', email: `${accountGuestId}@example.test`, image: null },
        })
      )
      expect(Exit.isFailure(claimCollision)).toBe(true)
      const preservedCommitments = await db
        .select()
        .from(schema.registryCommitment)
        .where(eq(schema.registryCommitment.registryItemId, mergeConflictItemId))
      expect(preservedCommitments).toHaveLength(2)
      expect(preservedCommitments.map((row) => row.quantity).sort()).toEqual([1, 1])
      await db
        .update(schema.registryItem)
        .set({ quantity: 2 })
        .where(eq(schema.registryItem.id, mergeConflictItemId))

      const beforeClaim = await run(reservations.listVisibleRegistry(eventId, accountActor))
      const claimCount = beforeClaim.items.find(
        (item) => item.id === reservationItemId
      )?.committedCount
      const claimed = await run(
        guest.claimDeviceGuestProfile({
          guestId,
          credential,
          userId: accountGuestId,
          account: { name: 'Account guest', email: `${accountGuestId}@example.test`, image: null },
        })
      )
      expect(claimed.claimedEventIds).toContain(eventId)
      const afterClaim = await run(reservations.listVisibleRegistry(eventId, accountActor))
      expect(afterClaim.items.find((item) => item.id === reservationItemId)).toMatchObject({
        committedCount: claimCount,
        reservedQuantity: 2,
      })
      const claimedGuestRejected = await runExit(
        reservations.changeRegistryReservation(
          eventId,
          guestActor,
          {
            requestId: crypto.randomUUID(),
            itemId: reservationItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      expect(Exit.isFailure(claimedGuestRejected)).toBe(true)

      const wrongEvent = await runExit(
        reservations.listVisibleRegistry(unauthorizedEventId, accountActor)
      )
      expect(Exit.isFailure(wrongEvent)).toBe(true)
      const privateRegistry = await runExit(
        reservations.listVisibleRegistry(privateEventId, {
          kind: 'user',
          id: accountGuestId,
        })
      )
      expect(Exit.isFailure(privateRegistry)).toBe(true)
      const wrongEventWrite = await runExit(
        reservations.changeRegistryReservation(
          unauthorizedEventId,
          accountActor,
          {
            requestId: crypto.randomUUID(),
            itemId: reservationItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      expect(Exit.isFailure(wrongEventWrite)).toBe(true)
      const privateRegistryWrite = await runExit(
        reservations.changeRegistryReservation(
          privateEventId,
          {
            kind: 'user',
            id: accountGuestId,
          },
          { requestId: crypto.randomUUID(), itemId: privateItemId, quantity: 1 },
          'reserve'
        )
      )
      expect(Exit.isFailure(privateRegistryWrite)).toBe(true)

      await run(
        reservations.changeRegistryReservation(
          eventId,
          accountActor,
          {
            requestId: crypto.randomUUID(),
            itemId: leaveCheckItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      await run(
        reservations.changeRegistryReservation(
          eventId,
          { kind: 'user', id: hostId },
          {
            requestId: crypto.randomUUID(),
            itemId: leaveCheckItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      await run(
        reservations.changeRegistryReservation(
          authorizedChildEventId,
          accountActor,
          {
            requestId: crypto.randomUUID(),
            itemId: childItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      const departures = await import('@/server/events/repos/event-departure.persistence')
      await run(departures.leaveGuestEvent(accountGuestId, eventId))
      const afterLeaveMain = await run(
        reservations.listVisibleRegistry(eventId, { kind: 'user', id: hostId })
      )
      expect(afterLeaveMain.items.find((item) => item.id === leaveCheckItemId)).toMatchObject({
        committedCount: 1,
        reservedQuantity: 1,
      })
      const afterLeaveChild = await run(
        reservations.listVisibleRegistry(authorizedChildEventId, accountActor)
      )
      expect(afterLeaveChild.items.find((item) => item.id === childItemId)).toMatchObject({
        committedCount: 1,
        reservedQuantity: 1,
      })
      const leftEventRead = await runExit(reservations.listVisibleRegistry(eventId, accountActor))
      expect(Exit.isFailure(leftEventRead)).toBe(true)

      await db
        .update(schema.event)
        .set({ completionStatus: 'complete' })
        .where(eq(schema.event.id, eventId))
      const closed = await runExit(
        reservations.changeRegistryReservation(
          eventId,
          accountActor,
          {
            requestId: crypto.randomUUID(),
            itemId: reservationItemId,
            quantity: 1,
          },
          'reserve'
        )
      )
      expect(Exit.isFailure(closed)).toBe(true)
    } finally {
      await db.delete(schema.organization).where(and(eq(schema.organization.id, orgId)))
      await db.delete(schema.organization).where(eq(schema.organization.id, privateOrgId))
      await db.delete(schema.eventGuestProfile).where(eq(schema.eventGuestProfile.id, guestId))
      await db.delete(schema.user).where(eq(schema.user.id, hostId))
      await db.delete(schema.user).where(eq(schema.user.id, accountGuestId))
      await db.delete(schema.user).where(eq(schema.user.id, crossOrgUserId))
    }
  }
)

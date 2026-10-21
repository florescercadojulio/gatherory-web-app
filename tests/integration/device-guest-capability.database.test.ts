import { Effect, Exit, Layer } from 'effect'
import { and, eq, inArray } from 'drizzle-orm'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_DEVICE_GUEST_DB_TESTS === '1'

test.skipIf(!enabled)(
  'device guest capability stays event-scoped and claims idempotently',
  { timeout: 60_000 },
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(databaseUrl, 'DATABASE_URL is required for the opt-in guest database test').toBeTruthy()
    const host = new URL(databaseUrl!).hostname
    expect(
      ['localhost', '127.0.0.1', '[::1]'],
      `Refusing non-local database host ${host}`
    ).toContain(host)

    const [database, schema, repo, invitationRepo] = await Promise.all([
      import('@/db'),
      import('@/db/schema'),
      import('@/server/events/repos/device-guest.repo.persistence'),
      import('@/server/events/repos/guest-invitation.repo.persistence'),
    ])
    const { db, PgClientLive } = database
    const {
      user,
      organization,
      event,
      eventShareLink,
      workspacePerson,
      eventParticipant,
      eventGuestProfile,
      eventGuestClaim,
      member,
      idea,
    } = schema
    const { nativeWorkspaceSnapshot, nativeSyncEntity, nativeSyncChange, nativeSyncScopeMember } =
      await import('@/db/schema/sync.schema')
    const layer = PgClientLive
    type Dependencies = Layer.Success<typeof layer>
    const run = <A, E>(program: Effect.Effect<A, E, Dependencies>) =>
      Effect.runPromise(program.pipe(Effect.provide(layer)))
    const runExit = <A, E>(program: Effect.Effect<A, E, Dependencies>) =>
      Effect.runPromiseExit(program.pipe(Effect.provide(layer)))

    const suffix = crypto.randomUUID().replaceAll('-', '')
    const hostUserId = `device-guest-host-${suffix}`
    const winnerUserId = `device-guest-winner-${suffix}`
    const otherUserId = `device-guest-other-${suffix}`
    const organizationIds = [
      `device-guest-org-main-${suffix}`,
      `device-guest-org-expired-${suffix}`,
      `device-guest-org-revoked-${suffix}`,
      `device-guest-org-collaborator-${suffix}`,
      `device-guest-org-broken-${suffix}`,
      `device-guest-org-closed-${suffix}`,
    ]
    const organizationId = organizationIds[0]!
    const rootId = crypto.randomUUID()
    const expiredEventId = crypto.randomUUID()
    const revokedEventId = crypto.randomUUID()
    const collaboratorEventId = crypto.randomUUID()
    const brokenEventId = crypto.randomUUID()
    const closedEventId = crypto.randomUUID()
    const hostChildId = crypto.randomUUID()
    const guestChildId = crypto.randomUUID()
    const siblingChildId = crypto.randomUUID()
    const guestId = crypto.randomUUID()
    const childGuestId = crypto.randomUUID()
    const wrongProofGuestId = crypto.randomUUID()
    const guestCredential = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
      'base64url'
    )
    const wrongProof = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url')
    const childGuestCredential = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
      'base64url'
    )
    const token = () => crypto.randomUUID()
    const linkTokens = {
      valid: token(),
      expired: token(),
      revoked: token(),
      collaborator: token(),
      broken: token(),
      child: token(),
      closed: token(),
    }
    const eventIds = [
      rootId,
      expiredEventId,
      revokedEventId,
      collaboratorEventId,
      brokenEventId,
      closedEventId,
    ]
    const scopeIds = [rootId, hostChildId, guestChildId, siblingChildId, ...eventIds.slice(1)]

    try {
      await db.insert(user).values([
        {
          id: hostUserId,
          name: 'Event host',
          email: `${hostUserId}@example.test`,
          emailVerified: true,
        },
        {
          id: winnerUserId,
          name: 'Verified account name',
          email: `${winnerUserId}@example.test`,
          emailVerified: true,
        },
        {
          id: otherUserId,
          name: 'Other account',
          email: `${otherUserId}@example.test`,
          emailVerified: true,
        },
      ])
      await db.insert(organization).values(
        organizationIds.map((id) => ({
          id,
          name: 'Device guest test workspace',
          slug: id,
          workspaceType: 'event' as const,
          createdAt: new Date(),
        }))
      )
      const titles = [
        'Valid guest event',
        'Expired event',
        'Revoked event',
        'Collaborator event',
        'Rollback event',
        'Closed event',
      ]
      await db.insert(event).values(
        eventIds.map((id, index) => ({
          id,
          organizationId: organizationIds[index]!,
          title: titles[index]!,
          status: 'draft' as const,
          startsAt: new Date(Date.now() + 86_400_000),
          timeZone: 'America/Detroit',
        }))
      )
      await db.insert(event).values([
        {
          id: hostChildId,
          organizationId,
          parentEventId: rootId,
          title: 'Host child event',
          planningStatus: 'draft',
          category: 'other',
          purpose: 'planning_scouting',
          startsAt: new Date(Date.now() + 86_400_000),
          timeZone: 'America/Detroit',
        },
        {
          id: guestChildId,
          organizationId,
          parentEventId: rootId,
          title: 'Guest child event',
          planningStatus: 'draft',
          category: 'other',
          purpose: 'planning_scouting',
          startsAt: new Date(Date.now() + 86_400_000),
          timeZone: 'America/Detroit',
        },
        {
          id: siblingChildId,
          organizationId,
          parentEventId: rootId,
          title: 'Sibling event outside invitation',
          planningStatus: 'draft',
          category: 'other',
          purpose: 'planning_scouting',
          startsAt: new Date(Date.now() + 86_400_000),
          timeZone: 'America/Detroit',
        },
      ])
      await db.update(event).set({ status: 'finished' }).where(eq(event.id, closedEventId))
      const now = new Date()
      await db.insert(eventShareLink).values([
        {
          eventId: rootId,
          token: linkTokens.valid,
          role: 'guest',
          createdByUserId: hostUserId,
          expiresAt: new Date(Date.now() + 86_400_000),
        },
        {
          eventId: expiredEventId,
          token: linkTokens.expired,
          role: 'guest',
          createdByUserId: hostUserId,
          expiresAt: new Date(Date.now() - 1000),
        },
        {
          eventId: revokedEventId,
          token: linkTokens.revoked,
          role: 'guest',
          createdByUserId: hostUserId,
          expiresAt: new Date(Date.now() + 86_400_000),
          revokedAt: now,
        },
        {
          eventId: collaboratorEventId,
          token: linkTokens.collaborator,
          role: 'collaborator',
          createdByUserId: hostUserId,
          expiresAt: new Date(Date.now() + 86_400_000),
        },
        {
          eventId: brokenEventId,
          token: linkTokens.broken,
          role: 'guest',
          createdByUserId: hostUserId,
          expiresAt: new Date(Date.now() + 86_400_000),
        },
        {
          eventId: guestChildId,
          token: linkTokens.child,
          role: 'guest',
          createdByUserId: hostUserId,
          expiresAt: new Date(Date.now() + 86_400_000),
        },
        {
          eventId: closedEventId,
          token: linkTokens.closed,
          role: 'guest',
          createdByUserId: hostUserId,
          expiresAt: new Date(Date.now() + 86_400_000),
        },
      ])
      const [hostPerson] = await db
        .insert(workspacePerson)
        .values({ organizationId, userId: hostUserId, displayName: 'Event host' })
        .returning()
      await db.insert(eventParticipant).values({
        eventId: rootId,
        personId: hostPerson!.id,
        role: 'host',
        planningPermission: 'manage',
      })
      const [otherHostPerson] = await db
        .insert(workspacePerson)
        .values({ organizationId, userId: otherUserId, displayName: 'Other account host' })
        .returning()
      await db.insert(eventParticipant).values({
        eventId: hostChildId,
        personId: otherHostPerson!.id,
        role: 'host',
        planningPermission: 'manage',
      })
      await db.insert(idea).values({
        organizationId,
        eventId: rootId,
        category: 'other',
        status: 'approved',
        guestVisibility: 'planning_only',
        title: 'PRIVATE planning detail',
        configuration: { version: 1 },
      })
      await db.insert(nativeWorkspaceSnapshot).values({
        scopeId: rootId,
        ownerUserId: hostUserId,
        organizationId,
        payload: Buffer.from(
          JSON.stringify({
            mainEventID: rootId,
            members: [
              {
                id: hostPerson!.id,
                name: 'Event host',
                userID: hostUserId,
                participantRole: 'host',
                planningPermission: 'manage',
              },
              {
                id: otherHostPerson!.id,
                name: 'Other account host',
                userID: otherUserId,
                participantRole: 'host',
                planningPermission: 'manage',
              },
            ],
            eventParticipations: [
              {
                id: crypto.randomUUID(),
                eventID: hostChildId,
                memberID: otherHostPerson!.id,
                role: 'host',
                planningPermission: 'manage',
                attendance: 'invited',
                invitationStatus: 'active',
              },
            ],
            mainEventParticipantIDs: [hostPerson!.id],
            timeline: [],
          })
        ).toString('base64'),
      })
      await db.insert(nativeWorkspaceSnapshot).values({
        scopeId: brokenEventId,
        ownerUserId: hostUserId,
        organizationId: organizationIds[4]!,
        payload: 'not-base64-json',
      })

      const registered = await run(
        repo.registerDeviceGuestProfile({
          id: guestId,
          name: 'Device guest',
          credential: guestCredential,
        })
      )
      expect(registered).toEqual({ id: guestId, name: 'Device guest' })
      expect(
        await run(
          repo.registerDeviceGuestProfile({
            id: guestId,
            name: 'Updated device name',
            credential: guestCredential,
          })
        )
      ).toEqual({ id: guestId, name: 'Updated device name' })
      await run(
        repo.registerDeviceGuestProfile({
          id: wrongProofGuestId,
          name: 'Rollback guest',
          credential: wrongProof,
        })
      )
      await run(
        repo.registerDeviceGuestProfile({
          id: childGuestId,
          name: 'Child guest',
          credential: childGuestCredential,
        })
      )
      const wrongRegistration = await runExit(
        repo.registerDeviceGuestProfile({ id: guestId, name: 'Attacker', credential: wrongProof })
      )
      expect(Exit.isFailure(wrongRegistration)).toBe(true)

      const joined = await run(
        repo.joinDeviceGuestEvent({ guestId, credential: guestCredential, token: linkTokens.valid })
      )
      expect(joined).toEqual({ eventId: rootId, role: 'guest', status: 'accepted' })
      for (const rejectedToken of [
        linkTokens.expired,
        linkTokens.revoked,
        linkTokens.collaborator,
      ]) {
        expect(
          Exit.isFailure(
            await runExit(
              repo.joinDeviceGuestEvent({
                guestId,
                credential: guestCredential,
                token: rejectedToken,
              })
            )
          )
        ).toBe(true)
      }
      expect(
        Exit.isFailure(
          await runExit(
            repo.joinDeviceGuestEvent({
              guestId,
              credential: guestCredential,
              token: linkTokens.closed,
            })
          )
        )
      ).toBe(true)

      const [devicePerson] = await db
        .select()
        .from(workspacePerson)
        .where(eq(workspacePerson.guestProfileId, guestId))
      expect(devicePerson).toBeTruthy()
      await expect(
        run(
          repo.respondToDeviceGuestEvent({
            guestId,
            credential: guestCredential,
            eventId: rootId,
            attendance: 'not_sure',
          })
        )
      ).resolves.toEqual({ eventId: rootId, attendance: 'not_sure' })
      await run(
        repo.joinDeviceGuestEvent({
          guestId: childGuestId,
          credential: childGuestCredential,
          token: linkTokens.child,
        })
      )
      const childFeed = await run(
        invitationRepo.listDeviceGuestEventInvitationProjections(childGuestId)
      )
      expect(childFeed.map((item) => item.id)).toEqual([guestChildId])
      expect(childFeed.some((item) => item.id === rootId || item.id === siblingChildId)).toBe(false)
      expect(childFeed.flatMap((item) => item.ideas)).toHaveLength(0)
      const rootFeed = await run(invitationRepo.listDeviceGuestEventInvitationProjections(guestId))
      expect(rootFeed.find((item) => item.id === rootId)?.ideas).toHaveLength(0)

      await db.update(event).set({ status: 'cancelled' }).where(eq(event.id, rootId))
      expect(
        Exit.isFailure(
          await runExit(
            repo.respondToDeviceGuestEvent({
              guestId: childGuestId,
              credential: childGuestCredential,
              eventId: guestChildId,
              attendance: 'going',
            })
          )
        )
      ).toBe(true)
      expect(
        Exit.isFailure(
          await runExit(
            repo.joinDeviceGuestEvent({
              guestId: childGuestId,
              credential: childGuestCredential,
              token: linkTokens.child,
            })
          )
        )
      ).toBe(true)

      // Existing account participation and RSVP win during claim; a claim does
      // not create planner/org membership or a native sync-scope grant.
      const [winnerPerson] = await db
        .insert(workspacePerson)
        .values({ organizationId, userId: winnerUserId, displayName: 'Account participant' })
        .returning()
      await db.insert(eventParticipant).values({
        eventId: rootId,
        personId: winnerPerson!.id,
        role: 'guest',
        planningPermission: 'view_only',
        attendanceStatus: 'going',
      })
      const account = {
        name: 'Verified account name',
        email: `${winnerUserId}@example.test`,
        image: null,
      }
      const claim = await run(
        repo.claimDeviceGuestProfile({
          guestId,
          credential: guestCredential,
          userId: winnerUserId,
          account,
        })
      )
      expect(claim.claimedEventIds).toEqual([rootId])
      expect(
        await db
          .select({
            personId: eventParticipant.personId,
            attendance: eventParticipant.attendanceStatus,
          })
          .from(eventParticipant)
          .where(eq(eventParticipant.eventId, rootId))
      ).toContainEqual({ personId: winnerPerson!.id, attendance: 'going' })
      const rootParticipants = await db
        .select()
        .from(eventParticipant)
        .where(eq(eventParticipant.eventId, rootId))
      expect(rootParticipants.filter((participant) => participant.role === 'guest')).toHaveLength(1)
      expect(await db.select().from(member).where(eq(member.userId, winnerUserId))).toHaveLength(0)
      expect(
        await db
          .select()
          .from(nativeSyncScopeMember)
          .where(eq(nativeSyncScopeMember.userId, winnerUserId))
      ).toHaveLength(0)
      expect(
        await db
          .select()
          .from(eventGuestClaim)
          .where(
            and(
              eq(eventGuestClaim.guestProfileId, guestId),
              eq(eventGuestClaim.claimedByUserId, winnerUserId)
            )
          )
      ).toHaveLength(1)
      const replay = await run(
        repo.claimDeviceGuestProfile({
          guestId,
          credential: guestCredential,
          userId: winnerUserId,
          account,
        })
      )
      expect(replay).toEqual(claim)
      expect(
        Exit.isFailure(
          await runExit(
            repo.claimDeviceGuestProfile({
              guestId,
              credential: guestCredential,
              userId: otherUserId,
              account: { name: 'Other account', email: `${otherUserId}@example.test`, image: null },
            })
          )
        )
      ).toBe(true)
      expect(
        await run(
          repo.registerDeviceGuestProfile({
            id: guestId,
            name: 'Device guest',
            credential: guestCredential,
          })
        )
      ).toEqual({ id: guestId, name: 'Updated device name' })
      expect(
        Exit.isFailure(
          await runExit(repo.verifyDeviceGuestProfile({ guestId, credential: guestCredential }))
        )
      ).toBe(true)

      // A claim that reuses an account person already hosting a sibling child
      // keeps that person's native host permission while adding this guest RSVP.
      const childClaim = await run(
        repo.claimDeviceGuestProfile({
          guestId: childGuestId,
          credential: childGuestCredential,
          userId: otherUserId,
          account: { name: 'Other account', email: `${otherUserId}@example.test`, image: null },
        })
      )
      expect(childClaim.claimedEventIds).toEqual([guestChildId])
      const mergedParticipation = await db
        .select({ personId: eventParticipant.personId, role: eventParticipant.role })
        .from(eventParticipant)
        .where(eq(eventParticipant.eventId, guestChildId))
      expect(mergedParticipation).toEqual([{ personId: otherHostPerson!.id, role: 'guest' }])
      const [updatedSnapshot] = await db
        .select({ payload: nativeWorkspaceSnapshot.payload })
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, rootId))
      const updatedMembers = JSON.parse(
        Buffer.from(updatedSnapshot!.payload, 'base64').toString('utf8')
      ).members
      expect(
        updatedMembers.find((item: { id: string }) => item.id === otherHostPerson!.id)
      ).toMatchObject({
        userID: otherUserId,
        participantRole: 'host',
        planningPermission: 'manage',
      })

      // A failure while publishing the host snapshot rolls the admission back.
      expect(
        Exit.isFailure(
          await runExit(
            repo.joinDeviceGuestEvent({
              guestId: wrongProofGuestId,
              credential: wrongProof,
              token: linkTokens.broken,
            })
          )
        )
      ).toBe(true)
      const brokenRows = await db
        .select({ id: eventParticipant.id })
        .from(eventParticipant)
        .where(eq(eventParticipant.eventId, brokenEventId))
      expect(brokenRows).toHaveLength(0)

      const [snapshot] = await db
        .select({ payload: nativeWorkspaceSnapshot.payload })
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, rootId))
      const archive = JSON.parse(Buffer.from(snapshot!.payload, 'base64').toString('utf8'))
      expect(archive.members.some((item: { id: string }) => item.id === devicePerson!.id)).toBe(
        false
      )
      expect(
        await db
          .select()
          .from(nativeSyncEntity)
          .where(
            and(
              eq(nativeSyncEntity.scopeId, rootId),
              eq(nativeSyncEntity.entityType, 'participant'),
              eq(nativeSyncEntity.entityId, devicePerson!.id)
            )
          )
      ).toHaveLength(1)
      expect(
        await db
          .select()
          .from(nativeSyncChange)
          .where(
            and(
              eq(nativeSyncChange.scopeId, rootId),
              eq(nativeSyncChange.entityType, 'participant'),
              eq(nativeSyncChange.entityId, devicePerson!.id)
            )
          )
      ).toHaveLength(3)
    } finally {
      await db.delete(nativeSyncChange).where(inArray(nativeSyncChange.scopeId, scopeIds))
      await db.delete(nativeSyncEntity).where(inArray(nativeSyncEntity.scopeId, scopeIds))
      await db
        .delete(nativeWorkspaceSnapshot)
        .where(inArray(nativeWorkspaceSnapshot.scopeId, scopeIds))
      await db
        .delete(eventGuestClaim)
        .where(inArray(eventGuestClaim.guestProfileId, [guestId, childGuestId]))
      await db
        .delete(eventGuestProfile)
        .where(inArray(eventGuestProfile.id, [guestId, childGuestId, wrongProofGuestId]))
      await db.delete(organization).where(inArray(organization.id, organizationIds))
      await db.delete(user).where(inArray(user.id, [hostUserId, winnerUserId, otherUserId]))
    }
  }
)

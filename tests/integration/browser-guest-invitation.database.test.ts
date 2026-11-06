import { Effect, Exit } from 'effect'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_BROWSER_GUEST_DB_TESTS === '1'

test.skipIf(!enabled)(
  'browser guest invitation workflow keeps enrollment and RSVP event-scoped',
  { timeout: 60_000 },
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the opt-in browser guest database test'
    ).toBeTruthy()
    const parsedDatabaseUrl = new URL(databaseUrl!)
    expect(
      ['localhost', '127.0.0.1', '[::1]'],
      `Refusing non-local database host ${parsedDatabaseUrl.hostname}`
    ).toContain(parsedDatabaseUrl.hostname)
    expect(
      parsedDatabaseUrl.pathname,
      'Browser guest database tests require a disposable database with test in its name'
    ).toMatch(/test|disposable/i)

    const [database, schema, guestWorkflows] = await Promise.all([
      import('@/db'),
      import('@/db/schema'),
      import('@/server/events/workflows/browser-guest-invitation.workflows.live'),
    ])
    const { db, PgClientLive } = database
    const { user, organization, event, eventShareLink, workspacePerson, eventParticipant, member } =
      schema
    const { eventGuestProfile } = await import('@/db/schema/event.schema')
    const { and, eq, inArray } = await import('drizzle-orm')
    const run = <A, E>(program: Effect.Effect<A, E, import('@effect/sql-pg').PgClient.PgClient>) =>
      Effect.runPromise(program.pipe(Effect.provide(PgClientLive)))
    const runExit = <A, E>(
      program: Effect.Effect<A, E, import('@effect/sql-pg').PgClient.PgClient>
    ) => Effect.runPromiseExit(program.pipe(Effect.provide(PgClientLive)))

    const suffix = crypto.randomUUID().replaceAll('-', '')
    const hostId = `browser-guest-host-${suffix}`
    const organizationId = `browser-guest-org-${suffix}`
    const rootId = crypto.randomUUID()
    const invitedChildId = crypto.randomUUID()
    const siblingId = crypto.randomUUID()
    const expiredEventId = crypto.randomUUID()
    const revokedEventId = crypto.randomUUID()
    const guestId = crypto.randomUUID()
    const outsiderGuestId = crypto.randomUUID()
    const credential = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url')
    const outsiderCredential = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
      'base64url'
    )
    const tokens = {
      invitedChild: crypto.randomUUID(),
      sibling: crypto.randomUUID(),
      expired: crypto.randomUUID(),
      revoked: crypto.randomUUID(),
      collaborator: crypto.randomUUID(),
    }
    const eventIds = [rootId, invitedChildId, siblingId, expiredEventId, revokedEventId]
    const guestIds = [guestId, outsiderGuestId]

    try {
      await db.insert(user).values({
        id: hostId,
        name: 'Browser invitation host',
        email: `${hostId}@example.test`,
        emailVerified: true,
      })
      await db.insert(organization).values({
        id: organizationId,
        name: 'Browser guest disposable fixture',
        slug: organizationId,
        workspaceType: 'event',
        createdAt: new Date(),
      })
      await db.insert(event).values([
        {
          id: rootId,
          organizationId,
          title: 'Private parent event',
          description: 'PRIVATE_PARENT_DESCRIPTION',
          status: 'draft',
          startsAt: new Date(Date.now() + 86_400_000),
          timeZone: 'America/Detroit',
          budgetCap: '9876.50',
        },
        {
          id: invitedChildId,
          organizationId,
          parentEventId: rootId,
          title: 'Guest invited child',
          description: 'PRIVATE_CHILD_DESCRIPTION',
          planningStatus: 'draft',
          category: 'other',
          purpose: 'part_of_event',
          startsAt: new Date(Date.now() + 86_400_000),
          timeZone: 'America/Detroit',
        },
        {
          id: siblingId,
          organizationId,
          parentEventId: rootId,
          title: 'Sibling outside invitation',
          planningStatus: 'draft',
          category: 'other',
          purpose: 'part_of_event',
          startsAt: new Date(Date.now() + 172_800_000),
          timeZone: 'America/Detroit',
        },
        ...[
          { id: expiredEventId, title: 'Expired link event' },
          { id: revokedEventId, title: 'Revoked link event' },
        ].map(({ id, title }) => ({
          id,
          organizationId,
          parentEventId: rootId,
          title,
          planningStatus: 'draft' as const,
          category: 'other' as const,
          purpose: 'part_of_event' as const,
          startsAt: new Date(Date.now() + 86_400_000),
          timeZone: 'America/Detroit',
        })),
      ])
      const [hostPerson] = await db
        .insert(workspacePerson)
        .values({ organizationId, userId: hostId, displayName: 'Browser invitation host' })
        .returning()
      await db.insert(eventParticipant).values(
        eventIds.map((eventId) => ({
          eventId,
          personId: hostPerson!.id,
          role: 'host' as const,
          planningPermission: 'manage' as const,
        }))
      )
      await db.insert(eventShareLink).values([
        {
          eventId: invitedChildId,
          token: tokens.invitedChild,
          role: 'guest',
          createdByUserId: hostId,
        },
        { eventId: siblingId, token: tokens.sibling, role: 'guest', createdByUserId: hostId },
        {
          eventId: expiredEventId,
          token: tokens.expired,
          role: 'guest',
          createdByUserId: hostId,
          expiresAt: new Date(Date.now() - 60_000),
        },
        {
          eventId: revokedEventId,
          token: tokens.revoked,
          role: 'guest',
          createdByUserId: hostId,
          revokedAt: new Date(),
        },
        {
          eventId: invitedChildId,
          token: tokens.collaborator,
          role: 'collaborator',
          createdByUserId: hostId,
        },
      ])

      const identity = { id: guestId, credential }
      const join = () =>
        run(
          guestWorkflows.joinBrowserGuestInvitationWorkflow({
            identity,
            token: tokens.invitedChild,
            name: 'Browser Guest',
          })
        )
      await expect(join()).resolves.toEqual({ eventId: invitedChildId, joined: true })
      await expect(join()).resolves.toEqual({ eventId: invitedChildId, joined: true })

      const profileRows = await db
        .select()
        .from(eventGuestProfile)
        .where(eq(eventGuestProfile.id, guestId))
      expect(profileRows).toHaveLength(1)
      const people = await db
        .select({
          id: workspacePerson.id,
          userId: workspacePerson.userId,
          email: workspacePerson.email,
        })
        .from(workspacePerson)
        .where(eq(workspacePerson.guestProfileId, guestId))
      expect(people).toHaveLength(1)
      expect(people[0]).toMatchObject({ userId: null, email: null })
      const guestParticipation = await db
        .select({
          eventId: eventParticipant.eventId,
          role: eventParticipant.role,
          permission: eventParticipant.planningPermission,
        })
        .from(eventParticipant)
        .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
        .where(eq(workspacePerson.guestProfileId, guestId))
      expect(guestParticipation).toEqual([
        { eventId: invitedChildId, role: 'guest', permission: 'view_only' },
      ])
      expect(await db.select().from(member).where(eq(member.userId, guestId))).toHaveLength(0)
      expect(await db.select().from(user).where(eq(user.id, guestId))).toHaveLength(0)

      await expect(
        run(
          guestWorkflows.respondAsBrowserGuestWorkflow({
            identity,
            eventId: invitedChildId,
            attendance: 'going',
          })
        )
      ).resolves.toEqual({ eventId: invitedChildId, attendance: 'going' })
      await expect(
        run(
          guestWorkflows.respondAsBrowserGuestWorkflow({
            identity,
            eventId: invitedChildId,
            attendance: 'not_sure',
          })
        )
      ).resolves.toEqual({ eventId: invitedChildId, attendance: 'not_sure' })
      const savedRows = await db
        .select({ attendance: eventParticipant.attendanceStatus })
        .from(eventParticipant)
        .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
        .where(
          and(
            eq(eventParticipant.eventId, invitedChildId),
            eq(workspacePerson.guestProfileId, guestId)
          )
        )
      expect(savedRows).toEqual([{ attendance: 'not_sure' }])

      const projection = await run(
        guestWorkflows.getBrowserGuestEventWorkflow({ identity, eventId: invitedChildId })
      )
      expect(projection.event).toEqual({
        id: invitedChildId,
        title: 'Guest invited child',
        startsAt: expect.any(String),
        endsAt: null,
        isAllDay: false,
        timeZone: 'America/Detroit',
        locationName: null,
        attendance: 'not_sure',
        name: 'Browser Guest',
        canRespond: true,
      })
      expect(Object.keys(projection.event!).sort()).toEqual(
        [
          'id',
          'title',
          'startsAt',
          'endsAt',
          'isAllDay',
          'timeZone',
          'locationName',
          'attendance',
          'name',
          'canRespond',
        ].sort()
      )
      expect(JSON.stringify(projection)).not.toContain('PRIVATE_')
      expect(projection).not.toHaveProperty('participants')
      expect(projection).not.toHaveProperty('budgetCap')
      expect(projection).not.toHaveProperty('description')

      const outsiderIdentity = { id: outsiderGuestId, credential: outsiderCredential }
      await run(
        guestWorkflows.joinBrowserGuestInvitationWorkflow({
          identity: outsiderIdentity,
          token: tokens.sibling,
          name: 'Different browser guest',
        })
      )
      expect(
        (
          await run(
            guestWorkflows.getBrowserGuestEventWorkflow({
              identity: outsiderIdentity,
              eventId: invitedChildId,
            })
          )
        ).event
      ).toBeNull()
      expect(
        (await run(guestWorkflows.getBrowserGuestEventWorkflow({ identity, eventId: siblingId })))
          .event
      ).toBeNull()
      expect(
        Exit.isFailure(
          await runExit(
            guestWorkflows.respondAsBrowserGuestWorkflow({
              identity: outsiderIdentity,
              eventId: invitedChildId,
              attendance: 'going',
            })
          )
        )
      ).toBe(true)

      for (const token of [tokens.expired, tokens.revoked, tokens.collaborator]) {
        const rejectedGuestId = crypto.randomUUID()
        guestIds.push(rejectedGuestId)
        expect(
          Exit.isFailure(
            await runExit(
              guestWorkflows.joinBrowserGuestInvitationWorkflow({
                identity: { id: rejectedGuestId, credential },
                token,
                name: 'Unavailable-link guest',
              })
            )
          )
        ).toBe(true)
      }

      // Revoking enrollment does not revoke an already admitted participant's own RSVP grant.
      await db
        .update(eventShareLink)
        .set({ revokedAt: new Date() })
        .where(eq(eventShareLink.token, tokens.invitedChild))
      await expect(
        run(
          guestWorkflows.respondAsBrowserGuestWorkflow({
            identity,
            eventId: invitedChildId,
            attendance: 'going',
          })
        )
      ).resolves.toEqual({ eventId: invitedChildId, attendance: 'going' })

      const revokedStatus = await run(
        guestWorkflows.getBrowserGuestInvitationStatusWorkflow({
          identity,
          token: tokens.invitedChild,
        })
      )
      // The revoked URL is unavailable to a new visitor, while this existing
      // session can still reopen its own previously admitted event.
      expect(revokedStatus.invitation).toMatchObject({
        eventId: invitedChildId,
        status: 'accepted',
      })
      expect(revokedStatus.guest).toMatchObject({
        eventId: invitedChildId,
        name: 'Browser Guest',
        attendance: 'going',
        canRespond: true,
      })
      expect(
        await run(
          guestWorkflows.getBrowserGuestInvitationStatusWorkflow({ token: tokens.invitedChild })
        )
      ).toEqual({ invitation: null, guest: null, identityName: null })
      await db
        .update(eventShareLink)
        .set({ revokedAt: null })
        .where(eq(eventShareLink.token, tokens.invitedChild))
      const reopenedStatus = await run(
        guestWorkflows.getBrowserGuestInvitationStatusWorkflow({
          identity,
          token: tokens.invitedChild,
        })
      )
      expect(reopenedStatus.invitation).toMatchObject({
        eventId: invitedChildId,
        status: 'accepted',
      })
      expect(reopenedStatus.guest).toMatchObject({ attendance: 'going', canRespond: true })

      await db.update(event).set({ status: 'finished' }).where(eq(event.id, rootId))
      const closedEvent = await run(
        guestWorkflows.getBrowserGuestEventWorkflow({ identity, eventId: invitedChildId })
      )
      expect(closedEvent.event).toMatchObject({ attendance: 'going', canRespond: false })
      expect(
        Exit.isFailure(
          await runExit(
            guestWorkflows.respondAsBrowserGuestWorkflow({
              identity,
              eventId: invitedChildId,
              attendance: 'not_going',
            })
          )
        )
      ).toBe(true)
      await db.update(event).set({ status: 'draft' }).where(eq(event.id, rootId))

      // Removing the event grant ends this browser guest's read and RSVP access.
      await db
        .delete(eventParticipant)
        .where(
          and(
            eq(eventParticipant.eventId, invitedChildId),
            eq(eventParticipant.personId, people[0]!.id)
          )
        )
      expect(
        (
          await run(
            guestWorkflows.getBrowserGuestEventWorkflow({ identity, eventId: invitedChildId })
          )
        ).event
      ).toBeNull()
      expect(
        Exit.isFailure(
          await runExit(
            guestWorkflows.respondAsBrowserGuestWorkflow({
              identity,
              eventId: invitedChildId,
              attendance: 'not_going',
            })
          )
        )
      ).toBe(true)
    } finally {
      await db.delete(organization).where(eq(organization.id, organizationId))
      await db.delete(eventGuestProfile).where(inArray(eventGuestProfile.id, guestIds))
      await db.delete(user).where(eq(user.id, hostId))
    }
  }
)

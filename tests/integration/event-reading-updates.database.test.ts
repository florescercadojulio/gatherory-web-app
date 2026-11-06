import { Effect } from 'effect'
import { and, eq, inArray } from 'drizzle-orm'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_EVENT_READING_DB_TESTS === '1'

test.skipIf(!enabled)(
  'event reading and selected updates enforce participant scope, role policy, lifecycle, CAS, retry, and native sync consistency',
  { timeout: 60_000 },
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(
      databaseUrl,
      'DATABASE_URL is required for the opt-in event-reading database test'
    ).toBeTruthy()
    const parsed = new URL(databaseUrl!)
    expect(
      ['localhost', '127.0.0.1', '[::1]'],
      'event-reading DB tests only run on loopback'
    ).toContain(parsed.hostname)
    expect(
      parsed.pathname,
      'event-reading DB tests require a disposable test database name'
    ).toMatch(/test|disposable/i)

    const [{ db, PgClientLive }, schema, reading, updates, guestWorkflows] = await Promise.all([
      import('@/db'),
      import('@/db/schema'),
      import('@/server/events/workflows/event-reading.workflows.live'),
      import('@/server/events/workflows/event-updates.workflows.live'),
      import('@/server/events/workflows/event-guest.workflows.live'),
    ])
    const {
      user,
      organization,
      event,
      workspacePerson,
      eventParticipant,
      eventTodo,
      eventNote,
      nativeWorkspaceSnapshot,
      nativeSyncScopeMember,
      nativeSyncEntity,
      nativeSyncChange,
    } = schema
    const run = <A, E>(program: Effect.Effect<A, E, import('@effect/sql-pg').PgClient.PgClient>) =>
      Effect.runPromise(program.pipe(Effect.provide(PgClientLive)))
    const expectFailure = async <A, E>(
      program: Effect.Effect<A, E, import('@effect/sql-pg').PgClient.PgClient>,
      code: string
    ) => expect(run(program), `expected typed failure ${code}`).rejects.toMatchObject({ code })

    const suffix = crypto.randomUUID().replaceAll('-', '')
    const ids = {
      host: `event-read-host-${suffix}`,
      manager: `event-read-manager-${suffix}`,
      contributor: `event-read-contributor-${suffix}`,
      viewer: `event-read-viewer-${suffix}`,
      guest: `event-read-guest-${suffix}`,
      childOnly: `event-read-child-only-${suffix}`,
      outsider: `event-read-outsider-${suffix}`,
    }
    const userIds = Object.values(ids)
    const orgId = `event-reading-disposable-${suffix}`
    const rootId = crypto.randomUUID()
    const childId = crypto.randomUUID()
    const siblingId = crypto.randomUUID()
    const personIds = Object.fromEntries(userIds.map((id) => [id, crypto.randomUUID()])) as Record<
      string,
      string
    >
    const todoId = crypto.randomUUID()
    const siblingTodoId = crypto.randomUUID()
    const noteKey = crypto.randomUUID()
    const startsAt = new Date(Math.floor((Date.now() + 86_400_000) / 1000) * 1000)
    const isoSeconds = Math.floor(startsAt.getTime() / 1000) - 978_307_200
    const archive = {
      mainEventID: rootId,
      title: 'PRIVATE_PARENT_TITLE_SENTINEL',
      eventMessage: 'PRIVATE_PARENT_DESCRIPTION_SENTINEL',
      mainEventStartsAt: isoSeconds,
      mainEventIsAllDay: false,
      mainEventTimeZoneIdentifier: 'America/Detroit',
      mainEventLocation: null,
      mainEventStatus: 'ongoing',
      members: [],
      eventParticipations: [],
      events: [],
      notes: [],
      todos: [],
    }
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')

    const makeEventEntity = (
      id: string,
      title: string,
      description: string,
      locationName: string
    ) => ({
      id,
      parentEventID: rootId,
      title,
      category: 'other',
      purpose: 'planningScouting',
      scheduledAt: isoSeconds,
      endsAt: null,
      isAllDay: false,
      timeZoneIdentifier: 'America/Detroit',
      eventDescription: description,
      eventLocation: {
        locationName,
        placeName: locationName,
        shortAddress: locationName,
        address: id === childId ? '17 Child Lane' : '55 Sibling Avenue',
        addressLine2: id === childId ? 'Suite 7' : 'Unit 3',
        latitude: id === childId ? 42.3301 : 42.3402,
        longitude: id === childId ? -83.0401 : -83.0502,
        mapItemIdentifier: id === childId ? 'child-place' : 'sibling-place',
      },
      status: 'approved',
      completionStatus: 'upcoming',
      schedulingState: 'scheduled',
    })
    const makeTodoPayload = (id: string, eventId: string, title: string, isCompleted = false) => ({
      id,
      eventID: eventId,
      title,
      dueDate: null,
      websiteURL: null,
      assigneePersonID: null,
      isCompleted,
      createdAt: isoSeconds,
    })

    const identity = async (userId: string, name: string) => ({
      id: personIds[userId]!,
      organizationId: orgId,
      userId,
      displayName: name,
      email: `${userId}@example.test`,
    })

    try {
      await db.insert(user).values(
        userIds.map((id) => ({
          id,
          name: `Account ${id}`,
          email: `${id}@example.test`,
          emailVerified: true,
        }))
      )
      await db.insert(organization).values({
        id: orgId,
        slug: orgId,
        name: 'Event reading disposable fixture',
        workspaceType: 'event',
        createdAt: new Date(),
      })
      await db.insert(event).values([
        {
          id: rootId,
          organizationId: orgId,
          title: 'PRIVATE_PARENT_TITLE_SENTINEL',
          description: 'PRIVATE_PARENT_DESCRIPTION_SENTINEL',
          status: 'ongoing',
          startsAt,
          schedulingState: 'scheduled',
          timeZone: 'America/Detroit',
          locationName: 'PRIVATE_PARENT_LOCATION_SENTINEL',
          locationAddress: '100 Root Lane',
          locationAddressLine2: 'Floor 2',
          locationLatitude: 42.3314,
          locationLongitude: -83.0458,
          mapItemIdentifier: 'root-place',
          createdByUserId: ids.host,
        },
        {
          id: childId,
          organizationId: orgId,
          parentEventId: rootId,
          title: 'Authorized child event',
          description: 'Child detail visible to participants',
          planningStatus: 'approved',
          category: 'other',
          purpose: 'part_of_event',
          startsAt,
          schedulingState: 'scheduled',
          timeZone: 'America/Detroit',
          locationName: 'Child room',
          locationAddress: '17 Child Lane',
          locationAddressLine2: 'Suite 7',
          locationLatitude: 42.3301,
          locationLongitude: -83.0401,
          mapItemIdentifier: 'child-place',
          createdByUserId: ids.host,
        },
        {
          id: siblingId,
          organizationId: orgId,
          parentEventId: rootId,
          title: 'PRIVATE_SIBLING_TITLE_SENTINEL',
          description: 'PRIVATE_SIBLING_DESCRIPTION_SENTINEL',
          planningStatus: 'approved',
          category: 'other',
          purpose: 'planning_scouting',
          startsAt: new Date(startsAt.getTime() + 86_400_000),
          schedulingState: 'scheduled',
          timeZone: 'America/Detroit',
          locationName: 'PRIVATE_SIBLING_LOCATION_SENTINEL',
          locationAddress: '55 Sibling Avenue',
          locationAddressLine2: 'Unit 3',
          locationLatitude: 42.3402,
          locationLongitude: -83.0502,
          createdByUserId: ids.host,
        },
      ])
      await db
        .insert(workspacePerson)
        .values(
          await Promise.all(
            userIds.map((id) =>
              identity(id, id === ids.childOnly ? 'Child only planner' : `Person ${id}`)
            )
          )
        )
      await db.insert(eventParticipant).values([
        {
          eventId: rootId,
          personId: personIds[ids.host]!,
          role: 'host',
          planningPermission: 'manage',
          attendanceStatus: 'going',
        },
        {
          eventId: rootId,
          personId: personIds[ids.manager]!,
          role: 'collaborator',
          planningPermission: 'manage',
          attendanceStatus: 'not_sure',
        },
        {
          eventId: rootId,
          personId: personIds[ids.contributor]!,
          role: 'collaborator',
          planningPermission: 'contribute',
          attendanceStatus: 'going',
        },
        {
          eventId: rootId,
          personId: personIds[ids.viewer]!,
          role: 'collaborator',
          planningPermission: 'view_only',
          attendanceStatus: 'not_going',
        },
        ...[
          [ids.host, 'host', 'manage', 'going'],
          [ids.manager, 'collaborator', 'manage', 'not_sure'],
          [ids.contributor, 'collaborator', 'contribute', 'going'],
          [ids.viewer, 'collaborator', 'view_only', 'not_going'],
          [ids.guest, 'guest', 'view_only', 'pending'],
          [ids.childOnly, 'collaborator', 'contribute', 'pending'],
        ].map(([userId, role, planningPermission, attendanceStatus]) => ({
          eventId: childId,
          personId: personIds[userId!]!,
          role: role as 'host' | 'collaborator' | 'guest',
          planningPermission: planningPermission as 'manage' | 'contribute' | 'view_only',
          attendanceStatus: attendanceStatus as 'going' | 'not_sure' | 'not_going' | 'pending',
        })),
      ])
      await db.insert(nativeWorkspaceSnapshot).values({
        scopeId: rootId,
        ownerUserId: ids.host,
        organizationId: orgId,
        payload: encode(archive),
        serverVersion: 5,
        isDeleted: false,
      })
      await db.insert(nativeSyncScopeMember).values(
        [ids.host, ids.manager, ids.contributor, ids.viewer].map((userId) => ({
          scopeId: rootId,
          userId,
          role: userId === ids.host ? ('owner' as const) : ('editor' as const),
        }))
      )
      await db.insert(eventTodo).values([
        {
          id: todoId,
          organizationId: orgId,
          eventId: childId,
          title: 'Child task to complete',
          isCompleted: false,
          createdAt: startsAt,
        },
        {
          id: siblingTodoId,
          organizationId: orgId,
          eventId: siblingId,
          title: 'PRIVATE_SIBLING_TASK_SENTINEL',
          isCompleted: false,
          createdAt: startsAt,
        },
      ])
      await db.insert(eventNote).values([
        {
          id: crypto.randomUUID(),
          organizationId: orgId,
          eventId: childId,
          authorUserId: ids.contributor,
          body: 'Authorized child note',
          sentAt: startsAt,
        },
        {
          id: crypto.randomUUID(),
          organizationId: orgId,
          eventId: siblingId,
          authorUserId: ids.host,
          body: 'PRIVATE_SIBLING_NOTE_SENTINEL',
          sentAt: startsAt,
        },
      ])
      await db.insert(nativeSyncEntity).values([
        {
          scopeId: rootId,
          entityType: 'event',
          entityId: childId,
          ownerUserId: ids.host,
          payload: encode(
            makeEventEntity(
              childId,
              'Authorized child event',
              'Child detail visible to participants',
              'Child room'
            )
          ),
          serverVersion: 1,
          isDeleted: false,
        },
        {
          scopeId: rootId,
          entityType: 'event',
          entityId: siblingId,
          ownerUserId: ids.host,
          payload: encode(
            makeEventEntity(
              siblingId,
              'PRIVATE_SIBLING_TITLE_SENTINEL',
              'PRIVATE_SIBLING_DESCRIPTION_SENTINEL',
              'PRIVATE_SIBLING_LOCATION_SENTINEL'
            )
          ),
          serverVersion: 1,
          isDeleted: false,
        },
        {
          scopeId: rootId,
          entityType: 'todo',
          entityId: todoId,
          ownerUserId: ids.host,
          payload: encode(makeTodoPayload(todoId, childId, 'Child task to complete')),
          serverVersion: 1,
          isDeleted: false,
        },
        {
          scopeId: rootId,
          entityType: 'todo',
          entityId: siblingTodoId,
          ownerUserId: ids.host,
          payload: encode(
            makeTodoPayload(siblingTodoId, siblingId, 'PRIVATE_SIBLING_TASK_SENTINEL')
          ),
          serverVersion: 1,
          isDeleted: false,
        },
      ])

      const getReading = (userId: string, eventId = childId) =>
        reading.getEventReadingWorkflow({ userId, eventId })
      const managerRead = await run(getReading(ids.manager))
      expect(managerRead).toMatchObject({
        event: {
          id: childId,
          title: 'Authorized child event',
          version: 1,
          timeZone: 'America/Detroit',
        },
        attendance: { value: 'not_sure', canRespond: true },
        permissions: {
          canReadPeople: true,
          canReadSchedule: true,
          canReadTasks: true,
          canReadNotes: true,
          canCompleteTasks: true,
          canCreateNotes: true,
          canEditDetails: true,
        },
      })
      expect(managerRead.schedule).toEqual([])
      expect(managerRead.tasks).toEqual([
        { id: todoId, title: 'Child task to complete', isCompleted: false, version: 1 },
      ])
      expect(managerRead.notes.map((item) => item.text)).toEqual(['Authorized child note'])
      const hostRead = await run(getReading(ids.host))
      expect(hostRead).toMatchObject({
        event: { id: childId, title: 'Authorized child event' },
        permissions: {
          canReadTasks: true,
          canReadNotes: true,
          canCompleteTasks: true,
          canCreateNotes: true,
        },
      })
      const serializedChildRead = JSON.stringify(managerRead)
      for (const privateSentinel of [
        'PRIVATE_PARENT_DESCRIPTION_SENTINEL',
        'PRIVATE_PARENT_LOCATION_SENTINEL',
        'PRIVATE_SIBLING_TITLE_SENTINEL',
        'PRIVATE_SIBLING_DESCRIPTION_SENTINEL',
        'PRIVATE_SIBLING_LOCATION_SENTINEL',
        'PRIVATE_SIBLING_TASK_SENTINEL',
        'PRIVATE_SIBLING_NOTE_SENTINEL',
      ])
        expect(serializedChildRead).not.toContain(privateSentinel)

      const childOnlyRead = await run(getReading(ids.childOnly))
      expect(childOnlyRead.event.id).toBe(childId)
      expect(childOnlyRead.schedule).toEqual([])
      expect(JSON.stringify(childOnlyRead)).not.toContain('PRIVATE_PARENT')
      expect(JSON.stringify(childOnlyRead)).not.toContain('PRIVATE_SIBLING')

      const rootPreRead = await run(getReading(ids.host, rootId))
      expect(rootPreRead.event).toMatchObject({
        id: rootId,
        version: 5,
        title: 'PRIVATE_PARENT_TITLE_SENTINEL',
      })

      const contributorRead = await run(getReading(ids.contributor))
      expect(contributorRead.permissions).toMatchObject({
        canReadTasks: true,
        canReadNotes: true,
        canCompleteTasks: true,
        canCreateNotes: true,
        canEditDetails: false,
      })
      const viewerRead = await run(getReading(ids.viewer))
      expect(viewerRead.permissions).toMatchObject({
        canReadTasks: true,
        canReadNotes: true,
        canCompleteTasks: false,
        canCreateNotes: false,
        canEditDetails: false,
      })
      expect(viewerRead.isReadOnly).toBe(true)
      await expectFailure(getReading(ids.guest), 'EVENT_PLANNING_REQUIRED')
      await expectFailure(getReading(ids.outsider), 'EVENT_PARTICIPANT_REQUIRED')

      const completed = await run(
        updates.completeTodoWorkflow({
          eventId: childId,
          todoId,
          isCompleted: true,
          expectedVersion: 1,
          userId: ids.manager,
        })
      )
      expect(completed).toMatchObject({ eventId: childId, todoId, isCompleted: true, version: 2 })
      const [canonicalTodo] = await db.select().from(eventTodo).where(eq(eventTodo.id, todoId))
      const [canonicalTodoEntity] = await db
        .select()
        .from(nativeSyncEntity)
        .where(
          and(
            eq(nativeSyncEntity.scopeId, rootId),
            eq(nativeSyncEntity.entityType, 'todo'),
            eq(nativeSyncEntity.entityId, todoId)
          )
        )
      const [nativeChange] = await db
        .select()
        .from(nativeSyncChange)
        .where(
          and(
            eq(nativeSyncChange.scopeId, rootId),
            eq(nativeSyncChange.entityType, 'todo'),
            eq(nativeSyncChange.entityId, todoId)
          )
        )
      expect(canonicalTodo?.isCompleted).toBe(true)
      expect(canonicalTodoEntity?.serverVersion).toBe(2)
      expect(
        JSON.parse(Buffer.from(canonicalTodoEntity!.payload, 'base64').toString('utf8'))
      ).toMatchObject({
        eventID: childId,
        isCompleted: true,
      })
      expect(nativeChange).toMatchObject({
        scopeId: rootId,
        entityType: 'todo',
        entityId: todoId,
        operation: 'update',
        serverVersion: 2,
      })
      expect(
        JSON.parse(Buffer.from(nativeChange!.payload, 'base64').toString('utf8'))
      ).toMatchObject({
        eventID: childId,
        isCompleted: true,
      })
      const postSyncRead = await run(getReading(ids.manager))
      expect(postSyncRead.tasks).toContainEqual({
        id: todoId,
        title: 'Child task to complete',
        isCompleted: true,
        version: 2,
      })
      await expectFailure(
        updates.completeTodoWorkflow({
          eventId: childId,
          todoId,
          isCompleted: false,
          expectedVersion: 1,
          userId: ids.manager,
        }),
        'SERVER_VERSION_CONFLICT'
      )
      await expectFailure(
        updates.completeTodoWorkflow({
          eventId: childId,
          todoId: siblingTodoId,
          isCompleted: true,
          expectedVersion: 1,
          userId: ids.manager,
        }),
        'TODO_NOT_FOUND'
      )
      await expectFailure(
        updates.completeTodoWorkflow({
          eventId: childId,
          todoId,
          isCompleted: false,
          expectedVersion: 2,
          userId: ids.viewer,
        }),
        'SCOPE_READ_ONLY'
      )

      const changedDetails = await run(
        updates.updateEventDetailsWorkflow({
          eventId: childId,
          expectedVersion: 1,
          changes: { title: 'Updated authorized child', description: 'Updated child description' },
          userId: ids.manager,
        })
      )
      expect(changedDetails).toMatchObject({
        eventId: childId,
        version: 2,
        changes: { title: 'Updated authorized child', description: 'Updated child description' },
      })
      const [updatedChild] = await db.select().from(event).where(eq(event.id, childId))
      expect(updatedChild).toMatchObject({
        title: 'Updated authorized child',
        description: 'Updated child description',
      })
      await expectFailure(
        updates.updateEventDetailsWorkflow({
          eventId: childId,
          expectedVersion: 1,
          changes: { title: 'Stale overwrite must not apply' },
          userId: ids.manager,
        }),
        'SERVER_VERSION_CONFLICT'
      )
      await expectFailure(
        updates.updateEventDetailsWorkflow({
          eventId: childId,
          expectedVersion: 2,
          changes: { title: 'Contributor cannot edit details' },
          userId: ids.contributor,
        }),
        'EVENT_PERMISSION_REQUIRED'
      )

      const clearedChildDetails = await run(
        updates.updateEventDetailsWorkflow({
          eventId: childId,
          expectedVersion: changedDetails.version,
          changes: { description: null, locationName: null },
          userId: ids.manager,
        })
      )
      expect(clearedChildDetails.version).toBe(changedDetails.version + 1)
      const [clearedChild] = await db.select().from(event).where(eq(event.id, childId))
      expect(clearedChild).toMatchObject({
        description: null,
        locationName: null,
        locationAddress: '17 Child Lane',
        locationAddressLine2: 'Suite 7',
        locationLatitude: 42.3301,
        locationLongitude: -83.0401,
        mapItemIdentifier: 'child-place',
      })
      const [clearedChildEntity] = await db
        .select()
        .from(nativeSyncEntity)
        .where(
          and(
            eq(nativeSyncEntity.scopeId, rootId),
            eq(nativeSyncEntity.entityType, 'event'),
            eq(nativeSyncEntity.entityId, childId)
          )
        )
      const [clearedChildChange] = await db
        .select()
        .from(nativeSyncChange)
        .where(
          and(
            eq(nativeSyncChange.scopeId, rootId),
            eq(nativeSyncChange.entityType, 'event'),
            eq(nativeSyncChange.entityId, childId),
            eq(nativeSyncChange.serverVersion, clearedChildDetails.version)
          )
        )
      for (const payload of [clearedChildEntity?.payload, clearedChildChange?.payload]) {
        expect(
          payload,
          'cleared child payload must be present in canonical state and native change log'
        ).toBeTruthy()
        const wireEvent = JSON.parse(Buffer.from(payload!, 'base64').toString('utf8'))
        expect(wireEvent.eventDescription).toBe('')
        expect(wireEvent.eventLocation).toMatchObject({
          locationName: '',
          placeName: '',
          shortAddress: '',
          address: '17 Child Lane',
          addressLine2: 'Suite 7',
          latitude: 42.3301,
          longitude: -83.0401,
          mapItemIdentifier: 'child-place',
        })
        for (const key of ['locationName', 'placeName', 'shortAddress', 'address', 'addressLine2'])
          expect(typeof wireEvent.eventLocation[key]).toBe('string')
      }

      const createdNote = await run(
        updates.createEventNoteWorkflow({
          eventId: childId,
          idempotencyKey: noteKey,
          body: 'Created by authenticated planner',
          userId: ids.manager,
        })
      )
      const retriedNote = await run(
        updates.createEventNoteWorkflow({
          eventId: childId,
          idempotencyKey: noteKey,
          body: 'Created by authenticated planner',
          userId: ids.manager,
        })
      )
      expect(createdNote).toMatchObject({ eventId: childId, noteId: noteKey, duplicate: false })
      expect(retriedNote).toMatchObject({ eventId: childId, noteId: noteKey, duplicate: true })
      const [savedNote] = await db.select().from(eventNote).where(eq(eventNote.id, noteKey))
      const [savedNoteEntity] = await db
        .select()
        .from(nativeSyncEntity)
        .where(
          and(
            eq(nativeSyncEntity.scopeId, rootId),
            eq(nativeSyncEntity.entityType, 'note'),
            eq(nativeSyncEntity.entityId, noteKey)
          )
        )
      const [savedNoteChange] = await db
        .select()
        .from(nativeSyncChange)
        .where(
          and(
            eq(nativeSyncChange.scopeId, rootId),
            eq(nativeSyncChange.entityType, 'note'),
            eq(nativeSyncChange.entityId, noteKey)
          )
        )
      expect(savedNote).toMatchObject({
        eventId: childId,
        body: 'Created by authenticated planner',
        authorUserId: ids.manager,
      })
      for (const payload of [savedNoteEntity?.payload, savedNoteChange?.payload]) {
        expect(
          payload,
          'native note payload should be present in both canonical state and the change log'
        ).toBeTruthy()
        const wireNote = JSON.parse(Buffer.from(payload!, 'base64').toString('utf8'))
        const foundationNow = Date.now() / 1000 - 978_307_200
        expect(wireNote).toMatchObject({
          id: noteKey,
          eventID: childId,
          body: 'Created by authenticated planner',
          authorUserID: ids.manager,
        })
        expect(typeof wireNote.sentAt).toBe('number')
        expect(Math.abs(wireNote.sentAt - foundationNow)).toBeLessThan(5)
      }
      await expectFailure(
        updates.createEventNoteWorkflow({
          eventId: childId,
          idempotencyKey: noteKey,
          body: 'Changed retry payload',
          userId: ids.manager,
        }),
        'MCP_IDEMPOTENCY_KEY_REUSED'
      )
      await expectFailure(
        updates.createEventNoteWorkflow({
          eventId: childId,
          idempotencyKey: crypto.randomUUID(),
          body: 'Guest note must fail',
          userId: ids.guest,
        }),
        'SCOPE_WRITE_FORBIDDEN'
      )
      await expectFailure(
        updates.createEventNoteWorkflow({
          eventId: childId,
          idempotencyKey: crypto.randomUUID(),
          body: 'View-only note must fail',
          userId: ids.viewer,
        }),
        'SCOPE_READ_ONLY'
      )

      // Model an unrelated archive update landing after the browser read but
      // without changing the version token, then submit that previously-read
      // title version. The locked trusted patch must merge against this newest
      // archive instead of replacing it with a stale serialized payload.
      const [latestSnapshotBeforeRootEdit] = await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, rootId))
      const latestArchive = JSON.parse(
        Buffer.from(latestSnapshotBeforeRootEdit!.payload, 'base64').toString('utf8')
      )
      latestArchive.concurrentArchiveMarker = 'preserve concurrent archive value'
      latestArchive.notes = [{ id: crypto.randomUUID(), text: 'preserve concurrent archive note' }]
      await db
        .update(nativeWorkspaceSnapshot)
        .set({ payload: encode(latestArchive) })
        .where(
          and(
            eq(nativeWorkspaceSnapshot.scopeId, rootId),
            eq(nativeWorkspaceSnapshot.serverVersion, rootPreRead.event.version)
          )
        )
      const changedRootDetails = await run(
        updates.updateEventDetailsWorkflow({
          eventId: rootId,
          expectedVersion: rootPreRead.event.version,
          changes: { title: 'Updated root title' },
          userId: ids.host,
        })
      )
      expect(changedRootDetails).toMatchObject({
        eventId: rootId,
        version: rootPreRead.event.version + 1,
        changes: { title: 'Updated root title' },
      })
      const [rootAfterConcurrentUpdate] = await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, rootId))
      const mergedArchive = JSON.parse(
        Buffer.from(rootAfterConcurrentUpdate!.payload, 'base64').toString('utf8')
      )
      expect(mergedArchive).toMatchObject({
        title: 'Updated root title',
        concurrentArchiveMarker: 'preserve concurrent archive value',
        notes: [{ text: 'preserve concurrent archive note' }],
      })
      const [rootWorkspaceChange] = await db
        .select()
        .from(nativeSyncChange)
        .where(
          and(
            eq(nativeSyncChange.scopeId, rootId),
            eq(nativeSyncChange.entityType, 'workspace'),
            eq(nativeSyncChange.entityId, rootId)
          )
        )
      expect(rootWorkspaceChange).toMatchObject({
        ownerUserId: ids.host,
        scopeId: rootId,
        entityType: 'workspace',
        entityId: rootId,
        operation: 'update',
        serverVersion: rootPreRead.event.version + 1,
      })
      expect(
        JSON.parse(Buffer.from(rootWorkspaceChange!.payload, 'base64').toString('utf8'))
      ).toMatchObject({
        title: 'Updated root title',
        concurrentArchiveMarker: 'preserve concurrent archive value',
        notes: [{ text: 'preserve concurrent archive note' }],
      })

      // Simulate an older archive with no required native location object.
      // The trusted update must rebuild the strings from canonical event fields.
      const archiveBeforeRootClear = JSON.parse(
        Buffer.from(rootAfterConcurrentUpdate!.payload, 'base64').toString('utf8')
      )
      archiveBeforeRootClear.mainEventLocation = null
      await db
        .update(nativeWorkspaceSnapshot)
        .set({ payload: encode(archiveBeforeRootClear) })
        .where(
          and(
            eq(nativeWorkspaceSnapshot.scopeId, rootId),
            eq(nativeWorkspaceSnapshot.serverVersion, changedRootDetails.version)
          )
        )
      const clearedRootDetails = await run(
        updates.updateEventDetailsWorkflow({
          eventId: rootId,
          expectedVersion: changedRootDetails.version,
          changes: { description: null, locationName: null },
          userId: ids.host,
        })
      )
      expect(clearedRootDetails.version).toBe(changedRootDetails.version + 1)
      const [clearedRoot] = await db.select().from(event).where(eq(event.id, rootId))
      expect(clearedRoot).toMatchObject({
        description: null,
        locationName: null,
        locationAddress: '100 Root Lane',
        locationAddressLine2: 'Floor 2',
        locationLatitude: 42.3314,
        locationLongitude: -83.0458,
        mapItemIdentifier: 'root-place',
      })
      const [rootAfterClear] = await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, rootId))
      const clearedRootArchive = JSON.parse(
        Buffer.from(rootAfterClear!.payload, 'base64').toString('utf8')
      )
      expect(clearedRootArchive.eventMessage).toBe('')
      expect(clearedRootArchive.mainEventLocation).toMatchObject({
        locationName: '',
        placeName: '',
        shortAddress: '',
        address: '100 Root Lane',
        addressLine2: 'Floor 2',
        latitude: 42.3314,
        longitude: -83.0458,
        mapItemIdentifier: 'root-place',
      })
      for (const key of ['locationName', 'placeName', 'shortAddress', 'address', 'addressLine2'])
        expect(typeof clearedRootArchive.mainEventLocation[key]).toBe('string')

      await db.update(event).set({ planningStatus: 'cancelled' }).where(eq(event.id, childId))
      await expectFailure(
        updates.completeTodoWorkflow({
          eventId: childId,
          todoId,
          isCompleted: false,
          expectedVersion: 2,
          userId: ids.manager,
        }),
        'EVENT_CLOSED'
      )
      await expectFailure(
        updates.createEventNoteWorkflow({
          eventId: childId,
          idempotencyKey: crypto.randomUUID(),
          body: 'Closed child note must fail',
          userId: ids.manager,
        }),
        'EVENT_CLOSED'
      )
      await db.update(event).set({ planningStatus: 'approved' }).where(eq(event.id, childId))

      const [attendanceBeforeArchive] = await db
        .select({ status: eventParticipant.attendanceStatus })
        .from(eventParticipant)
        .where(
          and(
            eq(eventParticipant.eventId, childId),
            eq(eventParticipant.personId, personIds[ids.manager]!)
          )
        )
      expect(attendanceBeforeArchive?.status).toBe('not_sure')
      await db.update(event).set({ planningStatus: 'archived' }).where(eq(event.id, childId))
      await expectFailure(
        guestWorkflows.respondToEventWorkflow(ids.manager, childId, 'going'),
        'EVENT_CLOSED'
      )
      const [attendanceAfterArchiveAttempt] = await db
        .select({ status: eventParticipant.attendanceStatus })
        .from(eventParticipant)
        .where(
          and(
            eq(eventParticipant.eventId, childId),
            eq(eventParticipant.personId, personIds[ids.manager]!)
          )
        )
      expect(attendanceAfterArchiveAttempt?.status).toBe('not_sure')
      await db.update(event).set({ planningStatus: 'approved' }).where(eq(event.id, childId))

      await db.update(event).set({ status: 'cancelled' }).where(eq(event.id, rootId))
      await expectFailure(
        updates.updateEventDetailsWorkflow({
          eventId: rootId,
          expectedVersion: clearedRootDetails.version,
          changes: { title: 'Cancelled root overwrite must fail' },
          userId: ids.host,
        }),
        'EVENT_CLOSED'
      )
    } finally {
      await db.delete(organization).where(eq(organization.id, orgId))
      await db.delete(user).where(inArray(user.id, userIds))
    }
  }
)

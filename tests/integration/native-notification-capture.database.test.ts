import { expect, test } from 'vitest'

const enabled = process.env.RUN_NATIVE_NOTIFICATION_DB_TESTS === '1'

function assertLocalDatabase() {
  const value = process.env.DATABASE_URL
  if (!value) throw new Error('DATABASE_URL is required for native notification capture tests')
  const hostname = new URL(value).hostname
  if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
    throw new Error('Native notification capture tests only run against localhost')
  }
}

function archive(
  rootId: string,
  startsAt: number,
  childId: string,
  childStartsAt: number,
  title = 'Notification test'
) {
  return Buffer.from(
    JSON.stringify({
      mainEventID: rootId,
      title,
      mainEventStartsAt: startsAt,
      mainEventIsAllDay: false,
      mainEventTimeZoneIdentifier: 'America/Detroit',
      mainEventStatus: 'draft',
      mainEventParticipantIDs: [],
      mainEventLocation: { name: '', address: '', addressLine2: '' },
      mainEventBudgetCap: null,
      venueName: '',
      location: '',
      dressCode: '',
      eventMessage: '',
      planningMode: 'openToIdeas',
      members: [],
      ideas: [],
      timeline: [
        {
          id: childId,
          title: 'Child event',
          category: 'other',
          purpose: 'planning',
          scheduledAt: childStartsAt,
          isAllDay: false,
          timeZoneIdentifier: 'America/Detroit',
          participantIDs: [],
          parentEventID: rootId,
          status: 'draft',
          completionStatus: 'upcoming',
          eventDescription: '',
          dressCode: '',
        },
      ],
      eventExpenses: [],
      notes: [],
      eventMoments: [],
      isMainEventDeleted: false,
      registry: [],
      isRegistryShared: false,
      isCollaboratorLinkEnabled: true,
      requiresCollaboratorApproval: true,
      defaultCollaboratorPermission: 'contribute',
    })
  ).toString('base64')
}

function mutation(input: {
  id?: string
  scopeID: string
  entityType: 'todo' | 'workspace' | 'event'
  entityID: string
  operation: 'create' | 'update'
  baseVersion: number
  payload: Record<string, unknown>
}) {
  return {
    id: input.id ?? crypto.randomUUID(),
    scopeID: input.scopeID,
    entityType: input.entityType,
    entityID: input.entityID,
    operation: input.operation,
    payloadSchemaVersion: 1 as const,
    createdAt: new Date().toISOString(),
    attemptCount: 0,
    baseVersion: input.baseVersion,
    payload: Buffer.from(JSON.stringify(input.payload)).toString('base64'),
  }
}

test(
  'native assignment and event changes capture opaque notifications atomically and only on real changes',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    assertLocalDatabase()
    const { db } = await import('@/db')
    const { user, organization } = await import('@/db/schema/auth.schema')
    const { event, eventGuestProfile, eventParticipant, workspacePerson } =
      await import('@/db/schema/event.schema')
    const { eventTodo } = await import('@/db/schema/planning.schema')
    const { nativeWorkspaceSnapshot, nativeSyncEntity, nativeSyncScopeMember } =
      await import('@/db/schema/sync.schema')
    const { nativeNotificationOutbox } = await import('@/db/schema/notification.schema')
    const { eq, inArray, sql } = await import('drizzle-orm')
    const { applyNativeMutations } = await import('@/server/sync/native-sync')

    const rootId = crypto.randomUUID()
    const childId = crypto.randomUUID()
    const organizationId = `native-notification-${rootId}`
    const actorId = `native-notification-host-${rootId}`
    const assigneeId = `native-notification-assignee-${rootId}`
    const actorPersonId = crypto.randomUUID()
    const assigneePersonId = crypto.randomUUID()
    const guestProfileId = crypto.randomUUID()
    const guestPersonId = crypto.randomUUID()
    const actorParticipationId = crypto.randomUUID()
    const assigneeParticipationId = crypto.randomUUID()
    const childActorParticipationId = crypto.randomUUID()
    const childAssigneeParticipationId = crypto.randomUUID()
    const childGuestParticipationId = crypto.randomUUID()
    const childEntityId = childId
    const todoId = crypto.randomUUID()
    let rollbackTriggerInstalled = false
    const initialTime = new Date('2031-07-01T16:00:00.000Z')
    const initialEpoch = initialTime.getTime() / 1000 - 978_307_200
    const childTime = new Date('2031-07-02T16:00:00.000Z')
    const childEpoch = childTime.getTime() / 1000 - 978_307_200
    const initialArchive = archive(rootId, initialEpoch, childId, childEpoch)

    try {
      await db.insert(user).values([
        { id: actorId, name: actorId, email: `${actorId}@example.test`, emailVerified: true },
        {
          id: assigneeId,
          name: assigneeId,
          email: `${assigneeId}@example.test`,
          emailVerified: true,
        },
      ])
      await db.insert(organization).values({
        id: organizationId,
        name: 'Notification capture test',
        slug: `native-notification-${rootId}`,
        createdAt: new Date(),
        workspaceType: 'event',
      })
      await db.insert(event).values([
        {
          id: rootId,
          organizationId,
          title: 'Notification test',
          status: 'draft',
          timeZone: 'America/Detroit',
          startsAt: initialTime,
          createdByUserId: actorId,
        },
        {
          id: childId,
          organizationId,
          parentEventId: rootId,
          title: 'Child event',
          purpose: 'part_of_event',
          category: 'other',
          planningStatus: 'draft',
          timeZone: 'America/Detroit',
          startsAt: childTime,
          createdByUserId: actorId,
        },
      ])
      await db.insert(eventGuestProfile).values({
        id: guestProfileId,
        displayName: 'Device guest',
        credentialHash: crypto.randomUUID().replaceAll('-', '').repeat(2),
      })
      await db.insert(workspacePerson).values([
        { id: actorPersonId, organizationId, userId: actorId, displayName: actorId },
        { id: assigneePersonId, organizationId, userId: assigneeId, displayName: assigneeId },
        {
          id: guestPersonId,
          organizationId,
          guestProfileId,
          displayName: 'Device guest',
        },
      ])
      await db.insert(eventParticipant).values([
        {
          id: actorParticipationId,
          eventId: rootId,
          personId: actorPersonId,
          role: 'host',
          planningPermission: 'manage',
        },
        {
          id: assigneeParticipationId,
          eventId: rootId,
          personId: assigneePersonId,
          role: 'collaborator',
          planningPermission: 'contribute',
        },
        {
          id: childActorParticipationId,
          eventId: childId,
          personId: actorPersonId,
          role: 'host',
          planningPermission: 'manage',
        },
        {
          id: childAssigneeParticipationId,
          eventId: childId,
          personId: assigneePersonId,
          role: 'collaborator',
          planningPermission: 'contribute',
        },
        {
          id: childGuestParticipationId,
          eventId: childId,
          personId: guestPersonId,
          role: 'guest',
          planningPermission: 'view_only',
        },
      ])
      await db.insert(nativeWorkspaceSnapshot).values({
        scopeId: rootId,
        ownerUserId: actorId,
        organizationId,
        payload: initialArchive,
        serverVersion: 1,
      })
      await db
        .insert(nativeSyncScopeMember)
        .values({ scopeId: rootId, userId: actorId, role: 'owner' })
      await db.insert(nativeSyncEntity).values({
        scopeId: rootId,
        entityType: 'event',
        entityId: childEntityId,
        ownerUserId: actorId,
        serverVersion: 1,
        payload: Buffer.from(
          JSON.stringify({
            id: childId,
            parentEventID: rootId,
            title: 'Child event',
            category: 'other',
            purpose: 'planning',
            scheduledAt: childEpoch,
            schedulingState: 'scheduled',
            isAllDay: false,
            timeZoneIdentifier: 'America/Detroit',
            participantIDs: [],
            status: 'draft',
            completionStatus: 'upcoming',
            eventDescription: '',
            dressCode: '',
          })
        ).toString('base64'),
      })

      const assignment = mutation({
        scopeID: rootId,
        entityType: 'todo',
        entityID: todoId,
        operation: 'create',
        baseVersion: 0,
        payload: {
          id: todoId,
          eventID: rootId,
          title: 'Confirm venue',
          dueDate: null,
          websiteURL: null,
          assigneePersonID: assigneePersonId,
          isCompleted: false,
          createdAt: initialEpoch,
        },
      })
      const applied = await applyNativeMutations({
        userId: actorId,
        mutations: [assignment],
        supportsTodos: true,
      })
      expect(applied.results[0]?.disposition).toBe('applied')

      const [assignmentNotice] = await db
        .select()
        .from(nativeNotificationOutbox)
        .where(eq(nativeNotificationOutbox.mutationId, assignment.id))
      expect(assignmentNotice).toMatchObject({
        eventId: rootId,
        entityId: todoId,
        recipientKind: 'user',
        recipientId: assigneeId,
        type: 'assignment_changed',
        state: 'pending',
      })
      expect(JSON.stringify(assignmentNotice)).not.toContain('Confirm venue')

      const duplicate = await applyNativeMutations({
        userId: actorId,
        mutations: [assignment],
        supportsTodos: true,
      })
      expect(duplicate.results[0]?.disposition).toBe('duplicate')
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.mutationId, assignment.id))
      ).toHaveLength(1)

      const rejectedTodoId = crypto.randomUUID()
      const rejected = mutation({
        scopeID: rootId,
        entityType: 'todo',
        entityID: rejectedTodoId,
        operation: 'create',
        baseVersion: 0,
        payload: {
          id: rejectedTodoId,
          eventID: rootId,
          title: 'Rejected assignment',
          dueDate: null,
          websiteURL: null,
          assigneePersonID: crypto.randomUUID(),
          isCompleted: false,
          createdAt: initialEpoch,
        },
      })
      const rejectedResult = await applyNativeMutations({
        userId: actorId,
        mutations: [rejected],
        supportsTodos: true,
      })
      expect(rejectedResult.results[0]?.disposition).toBe('rejected')
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.mutationId, rejected.id))
      ).toHaveLength(0)

      const eventPayload = JSON.parse(Buffer.from(initialArchive, 'base64').toString('utf8'))
      eventPayload.mainEventStartsAt = initialEpoch + 3600
      const eventEdit = mutation({
        scopeID: rootId,
        entityType: 'workspace',
        entityID: rootId,
        operation: 'update',
        baseVersion: 1,
        payload: eventPayload,
      })
      const eventResult = await applyNativeMutations({
        userId: actorId,
        mutations: [eventEdit],
        supportsTodos: true,
      })
      expect(eventResult.results[0]?.disposition).toBe('applied')
      const eventNotices = await db
        .select()
        .from(nativeNotificationOutbox)
        .where(eq(nativeNotificationOutbox.mutationId, eventEdit.id))
      expect(eventNotices).toHaveLength(1)
      expect(eventNotices[0]).toMatchObject({
        eventId: rootId,
        entityId: rootId,
        recipientKind: 'user',
        recipientId: assigneeId,
        type: 'event_changed',
      })
      expect(JSON.stringify(eventNotices[0])).not.toContain('Notification test')

      const titleOnlyPayload = JSON.parse(Buffer.from(eventEdit.payload, 'base64').toString('utf8'))
      titleOnlyPayload.title = 'New title without a schedule change'
      const titleOnlyEdit = mutation({
        scopeID: rootId,
        entityType: 'workspace',
        entityID: rootId,
        operation: 'update',
        baseVersion: 2,
        payload: titleOnlyPayload,
      })
      const titleOnlyResult = await applyNativeMutations({
        userId: actorId,
        mutations: [titleOnlyEdit],
        supportsTodos: true,
      })
      expect(titleOnlyResult.results[0]?.disposition).toBe('applied')
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.mutationId, titleOnlyEdit.id))
      ).toHaveLength(0)

      const childPayload = {
        id: childId,
        title: 'Child event',
        category: 'other',
        purpose: 'planning',
        scheduledAt: childEpoch + 3600,
        schedulingState: 'scheduled',
        isAllDay: false,
        timeZoneIdentifier: 'America/Detroit',
        participantIDs: [],
        status: 'draft',
        completionStatus: 'upcoming',
        eventDescription: '',
        dressCode: '',
      }
      const childMutation = mutation({
        scopeID: childId,
        entityType: 'event',
        entityID: childId,
        operation: 'update',
        baseVersion: 1,
        payload: childPayload,
      })
      const childResult = await applyNativeMutations({
        userId: actorId,
        mutations: [childMutation],
        supportsTodos: true,
      })
      expect(childResult.results[0]?.disposition).toBe('applied')
      const childNotices = await db
        .select()
        .from(nativeNotificationOutbox)
        .where(eq(nativeNotificationOutbox.mutationId, childMutation.id))
      expect(childNotices).toHaveLength(2)
      expect(childNotices).toContainEqual(
        expect.objectContaining({
          eventId: childId,
          entityId: childId,
          recipientKind: 'user',
          recipientId: assigneeId,
          type: 'event_changed',
        })
      )
      expect(childNotices).toContainEqual(
        expect.objectContaining({
          eventId: childId,
          entityId: childId,
          recipientKind: 'device_guest',
          recipientId: guestProfileId,
          type: 'event_changed',
        })
      )

      const bootstrapEventId = crypto.randomUUID()
      const bootstrapEventMutation = mutation({
        scopeID: rootId,
        entityType: 'event',
        entityID: bootstrapEventId,
        operation: 'create',
        baseVersion: 0,
        payload: {
          id: bootstrapEventId,
          parentEventID: rootId,
          title: 'New child event',
          category: 'other',
          purpose: 'planning',
          scheduledAt: childEpoch + 7200,
          schedulingState: 'scheduled',
          isAllDay: false,
          timeZoneIdentifier: 'America/Detroit',
          participantIDs: [],
          status: 'draft',
          completionStatus: 'upcoming',
          eventDescription: '',
          dressCode: '',
        },
      })
      const bootstrapResult = await applyNativeMutations({
        userId: actorId,
        mutations: [bootstrapEventMutation],
        supportsTodos: true,
      })
      expect(bootstrapResult.results[0]?.disposition).toBe('applied')
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.mutationId, bootstrapEventMutation.id))
      ).toHaveLength(0)

      const rollbackTodoId = crypto.randomUUID()
      const rollbackMutation = mutation({
        scopeID: rootId,
        entityType: 'todo',
        entityID: rollbackTodoId,
        operation: 'create',
        baseVersion: 0,
        payload: {
          id: rollbackTodoId,
          eventID: rootId,
          title: 'Rolled back task',
          dueDate: null,
          websiteURL: null,
          assigneePersonID: assigneePersonId,
          isCompleted: false,
          createdAt: initialEpoch + 10,
        },
      })
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION codex_test_fail_native_sync_receipt()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'forced receipt failure for notification rollback test'; END;
        $$
      `)
      await db.execute(sql`
        CREATE TRIGGER codex_test_fail_native_sync_receipt
        BEFORE INSERT ON native_sync_mutation_receipt
        FOR EACH ROW EXECUTE FUNCTION codex_test_fail_native_sync_receipt()
      `)
      rollbackTriggerInstalled = true
      await expect(
        applyNativeMutations({
          userId: actorId,
          mutations: [rollbackMutation],
          supportsTodos: true,
        })
      ).rejects.toThrow('native_sync_mutation_receipt')
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.mutationId, rollbackMutation.id))
      ).toHaveLength(0)
      expect(
        await db.select().from(eventTodo).where(eq(eventTodo.id, rollbackTodoId))
      ).toHaveLength(0)

      await db.execute(
        sql`DROP TRIGGER codex_test_fail_native_sync_receipt ON native_sync_mutation_receipt`
      )
      await db.execute(sql`DROP FUNCTION codex_test_fail_native_sync_receipt()`)
      rollbackTriggerInstalled = false

      const [canonicalTodo] = await db.select().from(eventTodo).where(eq(eventTodo.id, todoId))
      expect(canonicalTodo?.isCompleted).toBe(false)
    } finally {
      if (rollbackTriggerInstalled) {
        await db.execute(
          sql`DROP TRIGGER IF EXISTS codex_test_fail_native_sync_receipt ON native_sync_mutation_receipt`
        )
        await db.execute(sql`DROP FUNCTION IF EXISTS codex_test_fail_native_sync_receipt()`)
      }
      await db.delete(nativeNotificationOutbox).where(eq(nativeNotificationOutbox.eventId, rootId))
      await db.delete(organization).where(eq(organization.id, organizationId))
      await db.delete(eventGuestProfile).where(eq(eventGuestProfile.id, guestProfileId))
      await db.delete(user).where(inArray(user.id, [actorId, assigneeId]))
    }
  }
)

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
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.mutationId, eventEdit.id))
      ).toHaveLength(0)

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

      const readyPayload = JSON.parse(Buffer.from(titleOnlyEdit.payload, 'base64').toString('utf8'))
      readyPayload.mainEventStatus = 'ongoing'
      // Preserve the child's independently approved state when the root snapshot is materialized.
      readyPayload.timeline[0].status = 'approved'
      readyPayload.timeline[0].scheduledAt = childEpoch + 3600
      const readyMutation = mutation({
        scopeID: rootId,
        entityType: 'workspace',
        entityID: rootId,
        operation: 'update',
        baseVersion: 3,
        payload: readyPayload,
      })
      const readyResult = await applyNativeMutations({
        userId: actorId,
        mutations: [readyMutation],
        supportsTodos: true,
      })
      expect(readyResult.results[0]?.disposition).toBe('applied')
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.mutationId, readyMutation.id))
      ).toHaveLength(0)

      const eligibleRootPayload = JSON.parse(
        Buffer.from(readyMutation.payload, 'base64').toString('utf8')
      )
      eligibleRootPayload.mainEventStartsAt = initialEpoch + 7200
      eligibleRootPayload.mainEventLocation = {
        locationName: 'New venue',
        address: '10 Main Street',
        addressLine2: '',
      }
      const eligibleRootEdit = mutation({
        scopeID: rootId,
        entityType: 'workspace',
        entityID: rootId,
        operation: 'update',
        baseVersion: 4,
        payload: eligibleRootPayload,
      })
      const eligibleRootResult = await applyNativeMutations({
        userId: actorId,
        mutations: [eligibleRootEdit],
        supportsTodos: true,
      })
      expect(eligibleRootResult.results[0]?.disposition).toBe('applied')
      const rootNotices = await db
        .select()
        .from(nativeNotificationOutbox)
        .where(eq(nativeNotificationOutbox.mutationId, eligibleRootEdit.id))
      expect(rootNotices).toHaveLength(1)
      expect(rootNotices[0]).toMatchObject({
        eventId: rootId,
        entityId: rootId,
        recipientKind: 'user',
        recipientId: assigneeId,
        type: 'event_changed',
        eventChangeKind: 'schedule_and_location',
      })
      expect(rootNotices.some((notice) => notice.recipientId === actorId)).toBe(false)
      expect(JSON.stringify(rootNotices[0])).not.toContain('Notification test')

      const duplicateRootEdit = await applyNativeMutations({
        userId: actorId,
        mutations: [eligibleRootEdit],
        supportsTodos: true,
      })
      expect(duplicateRootEdit.results[0]?.disposition).toBe('duplicate')
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.mutationId, eligibleRootEdit.id))
      ).toHaveLength(1)

      const staleRootPayload = JSON.parse(
        Buffer.from(eligibleRootEdit.payload, 'base64').toString('utf8')
      )
      staleRootPayload.mainEventStartsAt = initialEpoch + 10_800
      const staleRootEdit = mutation({
        scopeID: rootId,
        entityType: 'workspace',
        entityID: rootId,
        operation: 'update',
        baseVersion: 4,
        payload: staleRootPayload,
      })
      const staleRootResult = await applyNativeMutations({
        userId: actorId,
        mutations: [staleRootEdit],
        supportsTodos: true,
      })
      expect(staleRootResult.results[0]?.disposition).toBe('conflict')
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.mutationId, staleRootEdit.id))
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
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.mutationId, childMutation.id))
      ).toHaveLength(0)

      const approveChildMutation = mutation({
        scopeID: childId,
        entityType: 'event',
        entityID: childId,
        operation: 'update',
        baseVersion: 2,
        payload: { ...childPayload, status: 'approved', scheduledAt: childEpoch + 3600 },
      })
      const approveChildResult = await applyNativeMutations({
        userId: actorId,
        mutations: [approveChildMutation],
        supportsTodos: true,
      })
      expect(approveChildResult.results[0]?.disposition).toBe('applied')
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.mutationId, approveChildMutation.id))
      ).toHaveLength(0)

      const eligibleChildPayload = {
        ...childPayload,
        status: 'approved',
        scheduledAt: childEpoch + 7200,
        eventLocation: { locationName: 'Child venue', address: '20 Side Street' },
      }
      const eligibleChildEdit = mutation({
        scopeID: childId,
        entityType: 'event',
        entityID: childId,
        operation: 'update',
        baseVersion: 3,
        payload: eligibleChildPayload,
      })
      const eligibleChildResult = await applyNativeMutations({
        userId: actorId,
        mutations: [eligibleChildEdit],
        supportsTodos: true,
      })
      expect(eligibleChildResult.results[0]?.disposition).toBe('applied')
      const childNotices = await db
        .select()
        .from(nativeNotificationOutbox)
        .where(eq(nativeNotificationOutbox.mutationId, eligibleChildEdit.id))
      expect(childNotices).toHaveLength(2)
      expect(childNotices).toContainEqual(
        expect.objectContaining({
          eventId: childId,
          entityId: childId,
          recipientKind: 'user',
          recipientId: assigneeId,
          type: 'event_changed',
          eventChangeKind: 'schedule_and_location',
        })
      )
      expect(childNotices).toContainEqual(
        expect.objectContaining({
          eventId: childId,
          entityId: childId,
          recipientKind: 'device_guest',
          recipientId: guestProfileId,
          type: 'event_changed',
          eventChangeKind: 'schedule_and_location',
        })
      )
      expect(childNotices.some((notice) => notice.recipientId === actorId)).toBe(false)

      const cancelChildMutation = mutation({
        scopeID: childId,
        entityType: 'event',
        entityID: childId,
        operation: 'update',
        baseVersion: 4,
        payload: { ...eligibleChildPayload, status: 'cancelled' },
      })
      const cancelChildResult = await applyNativeMutations({
        userId: actorId,
        mutations: [cancelChildMutation],
        supportsTodos: true,
      })
      expect(cancelChildResult.results[0]?.disposition).toBe('applied')
      const cancelChildNotices = await db
        .select()
        .from(nativeNotificationOutbox)
        .where(eq(nativeNotificationOutbox.mutationId, cancelChildMutation.id))
      expect(cancelChildNotices).toHaveLength(2)
      expect(cancelChildNotices).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ eventChangeKind: 'cancelled', recipientId: assigneeId }),
          expect.objectContaining({ eventChangeKind: 'cancelled', recipientId: guestProfileId }),
        ])
      )

      const rejectedScopedReopenMutation = mutation({
        scopeID: childId,
        entityType: 'event',
        entityID: childId,
        operation: 'update',
        baseVersion: 5,
        payload: { ...eligibleChildPayload, status: 'approved' },
      })
      const rejectedScopedReopenResult = await applyNativeMutations({
        userId: actorId,
        mutations: [rejectedScopedReopenMutation],
        supportsTodos: true,
      })
      expect(rejectedScopedReopenResult.results[0]).toMatchObject({
        disposition: 'rejected',
        failureCode: 'EVENT_CLOSED',
      })
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.mutationId, rejectedScopedReopenMutation.id))
      ).toHaveLength(0)

      // A host cancels and reopens the root through its authorized workspace snapshot path.
      const [rootSnapshotBeforeCancel] = await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, rootId))
      expect(rootSnapshotBeforeCancel).toBeDefined()
      const rootCancelPayload = JSON.parse(
        Buffer.from(rootSnapshotBeforeCancel!.payload, 'base64').toString('utf8')
      )
      rootCancelPayload.mainEventStatus = 'cancelled'
      const cancelRootMutation = mutation({
        scopeID: rootId,
        entityType: 'workspace',
        entityID: rootId,
        operation: 'update',
        baseVersion: rootSnapshotBeforeCancel!.serverVersion,
        payload: rootCancelPayload,
      })
      const cancelRootResult = await applyNativeMutations({
        userId: actorId,
        mutations: [cancelRootMutation],
        supportsTodos: true,
      })
      expect(cancelRootResult.results[0]?.disposition).toBe('applied')
      const rootCancellationNotices = await db
        .select()
        .from(nativeNotificationOutbox)
        .where(eq(nativeNotificationOutbox.mutationId, cancelRootMutation.id))
      expect(rootCancellationNotices).toHaveLength(1)
      expect(rootCancellationNotices[0]).toMatchObject({
        eventId: rootId,
        eventChangeKind: 'cancelled',
        recipientKind: 'user',
        recipientId: assigneeId,
      })
      expect(rootCancellationNotices.some((notice) => notice.recipientId === guestProfileId)).toBe(
        false
      )

      const [rootSnapshotBeforeReopen] = await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, rootId))
      expect(rootSnapshotBeforeReopen).toBeDefined()
      const rootReopenPayload = JSON.parse(
        Buffer.from(rootSnapshotBeforeReopen!.payload, 'base64').toString('utf8')
      )
      rootReopenPayload.mainEventStatus = 'ongoing'
      const reopenRootMutation = mutation({
        scopeID: rootId,
        entityType: 'workspace',
        entityID: rootId,
        operation: 'update',
        baseVersion: rootSnapshotBeforeReopen!.serverVersion,
        payload: rootReopenPayload,
      })
      const reopenRootResult = await applyNativeMutations({
        userId: actorId,
        mutations: [reopenRootMutation],
        supportsTodos: true,
      })
      expect(reopenRootResult.results[0]?.disposition).toBe('applied')
      const rootReopenNotices = await db
        .select()
        .from(nativeNotificationOutbox)
        .where(eq(nativeNotificationOutbox.mutationId, reopenRootMutation.id))
      expect(rootReopenNotices).toHaveLength(1)
      expect(rootReopenNotices[0]).toMatchObject({
        eventId: rootId,
        eventChangeKind: 'reopened',
        recipientKind: 'user',
        recipientId: assigneeId,
      })
      expect(rootReopenNotices.some((notice) => notice.recipientId === guestProfileId)).toBe(false)

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

      const [rootSnapshotBeforeFinish] = await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, rootId))
      expect(rootSnapshotBeforeFinish).toBeDefined()
      const finishRootPayload = JSON.parse(
        Buffer.from(rootSnapshotBeforeFinish!.payload, 'base64').toString('utf8')
      )
      finishRootPayload.mainEventStatus = 'finished'
      const finishRootMutation = mutation({
        scopeID: rootId,
        entityType: 'workspace',
        entityID: rootId,
        operation: 'update',
        baseVersion: rootSnapshotBeforeFinish!.serverVersion,
        payload: finishRootPayload,
      })
      const finishRootResult = await applyNativeMutations({
        userId: actorId,
        mutations: [finishRootMutation],
        supportsTodos: true,
      })
      expect(finishRootResult.results[0]?.disposition).toBe('applied')
      expect(
        await db
          .select()
          .from(nativeNotificationOutbox)
          .where(eq(nativeNotificationOutbox.mutationId, finishRootMutation.id))
      ).toHaveLength(0)
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

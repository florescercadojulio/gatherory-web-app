import { expect, test } from 'vitest'

const enabled = process.env.RUN_MCP_DB_TESTS === '1'

function assertLocalDatabase() {
  const value = process.env.DATABASE_URL
  if (!value) throw new Error('DATABASE_URL is required for MCP planning database tests')
  let hostname: string
  try {
    hostname = new URL(value).hostname
  } catch {
    throw new Error('MCP planning tests require a valid local DATABASE_URL')
  }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname))
    throw new Error('MCP planning tests only run against localhost')
}

test(
  'MCP notes and tasks enforce authorship, exact child scope, roles, lifecycle, and native receipts',
  { skip: !enabled, timeout: 60_000 },
  async () => {
    assertLocalDatabase()
    const { db } = await import('@/db')
    const { user, organization } = await import('@/db/schema/auth.schema')
    const { event, eventParticipant, workspacePerson } = await import('@/db/schema/event.schema')
    const { eventNote, eventTodo } = await import('@/db/schema/planning.schema')
    const { nativeSyncMutationReceipt } = await import('@/db/schema/sync.schema')
    const { eq, inArray } = await import('drizzle-orm')
    const { createMcpEventTools } = await import('@/server/mcp/tools')
    const { liveMcpContentPort } = await import('@/server/mcp/content/live')
    const { listNativeWorkspaceSnapshots } =
      await import('@/server/sync/repos/native-sync-legacy.persistence')

    const suffix = crypto.randomUUID()
    const hostId = `mcp-planning-host-${suffix}`
    const contributorId = `mcp-planning-contributor-${suffix}`
    const managerId = `mcp-planning-manager-${suffix}`
    const viewerId = `mcp-planning-viewer-${suffix}`
    const guestId = `mcp-planning-guest-${suffix}`
    const childGuestWithParentPlanningId = `mcp-planning-child-guest-${suffix}`
    const outsiderId = `mcp-planning-outsider-${suffix}`
    const userIds = [
      hostId,
      contributorId,
      managerId,
      viewerId,
      guestId,
      childGuestWithParentPlanningId,
      outsiderId,
    ]
    let rootId: string | null = null
    let secondRootId: string | null = null

    try {
      await db.insert(user).values(
        userIds.map((id) => ({
          id,
          name: id,
          email: `${id}@example.test`,
          emailVerified: true,
          hasCompletedOnboarding: true,
        }))
      )

      const port = {
        ...liveMcpContentPort,
        bootstrap: (userId: string) =>
          listNativeWorkspaceSnapshots({
            userId,
            supportsBlueprintGuides: true,
            supportsTodos: true,
          }),
      }
      const tools = createMcpEventTools(port)
      const call = (name: string, input: unknown, userId: string) =>
        tools.call(name, input, { userId })

      const root = (await call(
        'create_event',
        {
          idempotencyKey: `root-create-${suffix}`,
          title: 'Planning boundary fixture',
          startsAt: '2033-05-10T16:00:00.000Z',
          timeZone: 'America/Detroit',
        },
        hostId
      )) as { id: string }
      rootId = root.id
      const otherRoot = (await call(
        'create_event',
        {
          idempotencyKey: `other-root-${suffix}`,
          title: 'Separate event fixture',
          startsAt: '2033-06-10T16:00:00.000Z',
          timeZone: 'America/Detroit',
        },
        hostId
      )) as { id: string }
      secondRootId = otherRoot.id

      async function addMember(
        eventId: string,
        userId: string,
        role: 'collaborator' | 'guest',
        planningPermission: 'manage' | 'contribute' | 'view_only'
      ) {
        const [person] = await db
          .insert(workspacePerson)
          .values({ id: crypto.randomUUID(), organizationId: rootId!, userId, displayName: userId })
          .returning({ id: workspacePerson.id })
        await db
          .insert(eventParticipant)
          .values({ eventId, personId: person!.id, role, planningPermission })
        return person!.id
      }
      const contributorRootPerson = await addMember(
        root.id,
        contributorId,
        'collaborator',
        'contribute'
      )
      const managerPersonId = await addMember(root.id, managerId, 'collaborator', 'manage')
      const viewerPersonId = await addMember(root.id, viewerId, 'collaborator', 'view_only')
      const guestPersonId = await addMember(root.id, guestId, 'guest', 'view_only')
      const childGuestWithParentPlanningPersonId = await addMember(
        root.id,
        childGuestWithParentPlanningId,
        'collaborator',
        'contribute'
      )

      const child = (await call(
        'create_child_event',
        {
          parentEventId: root.id,
          idempotencyKey: `child-create-${suffix}`,
          title: 'Contributor-owned child',
          startsAt: '2033-05-10T18:00:00.000Z',
          timeZone: 'America/Detroit',
          purpose: 'planning',
          category: 'other',
        },
        contributorId
      )) as { id: string; version: number }

      // Give other roles membership in this exact child so the tests exercise note
      // authorship and child planning permission separately from parent access.
      await db.insert(eventParticipant).values({
        eventId: child.id,
        personId: managerPersonId,
        role: 'collaborator',
        planningPermission: 'manage',
      })
      await db.insert(eventParticipant).values({
        eventId: child.id,
        personId: viewerPersonId,
        role: 'collaborator',
        planningPermission: 'view_only',
      })
      await db.insert(eventParticipant).values({
        eventId: child.id,
        personId: guestPersonId,
        role: 'guest',
        planningPermission: 'view_only',
      })
      await db.insert(eventParticipant).values({
        eventId: child.id,
        personId: childGuestWithParentPlanningPersonId,
        role: 'guest',
        planningPermission: 'view_only',
      })

      const noteInput = {
        eventId: child.id,
        idempotencyKey: `note-create-${suffix}`,
        body: '😀'.repeat(750),
      }
      const firstNote = (await call('create_note', noteInput, contributorId)) as {
        id: string
        version: number
      }
      const [storedUnicodeNote] = await db
        .select({ body: eventNote.body })
        .from(eventNote)
        .where(eq(eventNote.id, firstNote.id))
      expect(storedUnicodeNote?.body).toBe(noteInput.body)
      await expect(
        call(
          'create_note',
          {
            ...noteInput,
            idempotencyKey: `note-over-limit-${suffix}`,
            body: '😀'.repeat(751),
          },
          contributorId
        )
      ).rejects.toThrow()
      const replayedNote = (await call('create_note', noteInput, contributorId)) as {
        id: string
        version: number
      }
      expect(replayedNote).toEqual(firstNote)
      await expect(
        call(
          'create_note',
          { ...noteInput, body: 'Changed source with reused key.' },
          contributorId
        )
      ).rejects.toMatchObject({ code: 'WRITE_REJECTED' })
      await expect(
        call(
          'update_note',
          {
            eventId: child.id,
            noteId: firstNote.id,
            expectedVersion: 1,
            idempotencyKey: `manager-edits-contributor-note-${suffix}`,
            body: 'Manager must not edit this.',
          },
          managerId
        )
      ).rejects.toMatchObject({ code: 'WRITE_REJECTED' })

      const editedNote = (await call(
        'update_note',
        {
          eventId: child.id,
          noteId: firstNote.id,
          expectedVersion: 1,
          idempotencyKey: `note-update-${suffix}`,
          body: 'Edited by its author.',
        },
        contributorId
      )) as { version: number }
      expect(editedNote.version).toBe(2)
      await expect(
        call(
          'update_note',
          {
            eventId: child.id,
            noteId: firstNote.id,
            expectedVersion: 1,
            idempotencyKey: `note-stale-${suffix}`,
            body: 'Stale update.',
          },
          contributorId
        )
      ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' })
      await expect(
        call(
          'update_note',
          {
            eventId: root.id,
            noteId: firstNote.id,
            expectedVersion: 2,
            idempotencyKey: `cross-event-note-${suffix}`,
            body: 'Cross event.',
          },
          contributorId
        )
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })

      const taskInput = {
        eventId: child.id,
        idempotencyKey: `task-create-${suffix}`,
        title: 'Send agenda',
        dueDate: '2033-05-01',
        websiteURL: 'https://example.test/agenda',
      }
      const task = (await call('create_task', taskInput, contributorId)) as {
        id: string
        version: number
        assigneePersonId: string | null
      }
      expect(task).toMatchObject({ version: 1, assigneePersonId: null })
      await expect(
        call(
          'create_task',
          {
            eventId: child.id,
            idempotencyKey: `assigned-task-${suffix}`,
            title: 'No implicit assignment',
            assigneePersonId: contributorRootPerson,
          },
          contributorId
        )
      ).rejects.toThrow()
      const taskRows = await db
        .select({
          eventId: eventTodo.eventId,
          dueDate: eventTodo.dueDate,
          websiteUrl: eventTodo.websiteUrl,
          assigneePersonId: eventTodo.assigneePersonId,
        })
        .from(eventTodo)
        .where(eq(eventTodo.id, task.id))
      expect(taskRows[0]).toMatchObject({
        eventId: child.id,
        dueDate: '2033-05-01',
        websiteUrl: 'https://example.test/agenda',
        assigneePersonId: null,
      })

      const taskUpdate = {
        eventId: child.id,
        taskId: task.id,
        expectedVersion: 1,
        idempotencyKey: `task-update-${suffix}`,
        changes: { dueDate: null, websiteURL: null, isCompleted: true },
      }
      const completed = (await call('update_task', taskUpdate, contributorId)) as {
        version: number
        isCompleted: boolean
      }
      expect(completed).toMatchObject({ version: 2, isCompleted: true })
      const taskUpdateReplay = (await call('update_task', taskUpdate, contributorId)) as {
        version: number
      }
      expect(taskUpdateReplay.version).toBe(2)
      await expect(
        call('update_task', { ...taskUpdate, changes: { isCompleted: false } }, contributorId)
      ).rejects.toMatchObject({ code: 'WRITE_REJECTED' })
      await expect(
        call(
          'update_task',
          {
            eventId: otherRoot.id,
            taskId: task.id,
            expectedVersion: 2,
            idempotencyKey: `cross-event-task-${suffix}`,
            changes: { isCompleted: false },
          },
          hostId
        )
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })
      const clearedTask = await db
        .select({
          dueDate: eventTodo.dueDate,
          websiteUrl: eventTodo.websiteUrl,
          isCompleted: eventTodo.isCompleted,
        })
        .from(eventTodo)
        .where(eq(eventTodo.id, task.id))
      expect(clearedTask[0]).toEqual({ dueDate: null, websiteUrl: null, isCompleted: true })

      const visibleNotes = (await call('list_notes', { eventId: child.id }, viewerId)) as {
        items: unknown[]
      }
      expect(visibleNotes.items).toHaveLength(1)
      // This actor is a planner on the parent root, so bootstrap includes that
      // root's shared log and the child note. Child guest status must still block
      // private Planning history when listing it for the exact child scope.
      const guestParentBootstrap = await port.bootstrap(childGuestWithParentPlanningId)
      expect(guestParentBootstrap.snapshots.some((item) => item.scopeID === root.id)).toBe(true)
      expect(
        guestParentBootstrap.entities.some(
          (item) => item.entityType === 'note' && item.entityID === firstNote.id
        )
      ).toBe(true)
      await expect(
        call('list_notes', { eventId: child.id }, childGuestWithParentPlanningId)
      ).rejects.toMatchObject({ code: 'EVENT_PERMISSION_REQUIRED' })
      const visibleTasks = (await call('list_tasks', { eventId: child.id }, viewerId)) as {
        items: unknown[]
      }
      expect(visibleTasks.items).toHaveLength(1)
      await expect(
        call(
          'create_note',
          { eventId: child.id, idempotencyKey: `viewer-note-${suffix}`, body: 'No write.' },
          viewerId
        )
      ).rejects.toBeDefined()
      await expect(
        call(
          'create_task',
          { eventId: child.id, idempotencyKey: `viewer-task-${suffix}`, title: 'No write.' },
          viewerId
        )
      ).rejects.toBeDefined()
      await expect(call('list_tasks', { eventId: child.id }, guestId)).rejects.toBeDefined()
      await expect(call('list_notes', { eventId: child.id }, outsiderId)).rejects.toBeDefined()
      await expect(call('list_tasks', { eventId: child.id }, outsiderId)).rejects.toBeDefined()

      // The host can create and edit their own note on the child, while IDs stay
      // bound to that child even though its sync log is the parent root.
      const ownByManager = (await call(
        'create_note',
        {
          eventId: child.id,
          idempotencyKey: `manager-note-${suffix}`,
          body: 'Manager-authored note.',
        },
        managerId
      )) as { id: string; version: number }
      await call(
        'update_note',
        {
          eventId: child.id,
          noteId: ownByManager.id,
          expectedVersion: 1,
          idempotencyKey: `manager-note-update-${suffix}`,
          body: 'Manager edit to own note.',
        },
        managerId
      )

      // Closing the child in the database must block writes and retry receipts at
      // the native transaction boundary, even if bootstrap still reports it open.
      await db.update(event).set({ completionStatus: 'complete' }).where(eq(event.id, child.id))
      await expect(
        call(
          'create_note',
          {
            eventId: child.id,
            idempotencyKey: `closed-child-note-${suffix}`,
            body: 'Closed child.',
          },
          contributorId
        )
      ).rejects.toBeDefined()
      await expect(
        call(
          'create_task',
          {
            eventId: child.id,
            idempotencyKey: `closed-child-task-${suffix}`,
            title: 'Closed child.',
          },
          contributorId
        )
      ).rejects.toBeDefined()

      // A previously committed receipt cannot replay after its event closes.
      // Override only the read snapshot to model a stale client cache.
      const stalePort = {
        ...port,
        bootstrap: async (userId: string) => {
          const data = await listNativeWorkspaceSnapshots({
            userId,
            supportsBlueprintGuides: true,
            supportsTodos: true,
          })
          for (const snapshot of data.snapshots) {
            if (snapshot.scopeID === root.id) {
              const value = JSON.parse(Buffer.from(snapshot.payload, 'base64').toString())
              value.mainEventStatus = 'draft'
              snapshot.payload = Buffer.from(JSON.stringify(value)).toString('base64')
            }
          }
          const childEntity = data.entities.find(
            (item) => item.entityType === 'event' && item.entityID === child.id
          )
          if (childEntity) {
            const value = JSON.parse(Buffer.from(childEntity.payload, 'base64').toString())
            value.completionStatus = 'upcoming'
            childEntity.payload = Buffer.from(JSON.stringify(value)).toString('base64')
          }
          return data
        },
      }
      const staleTools = createMcpEventTools(stalePort)
      await expect(
        staleTools.call('create_note', noteInput, { userId: contributorId })
      ).rejects.toBeDefined()

      // Main-event closure blocks planning mutations independently of child state.
      await db.update(event).set({ completionStatus: 'upcoming' }).where(eq(event.id, child.id))
      const rootNoteInput = {
        eventId: root.id,
        idempotencyKey: `root-note-before-close-${suffix}`,
        body: 'Root note before closure.',
      }
      await call('create_note', rootNoteInput, hostId)
      await db.update(event).set({ completionStatus: 'complete' }).where(eq(event.id, root.id))
      await expect(
        call(
          'create_task',
          { eventId: root.id, idempotencyKey: `closed-root-task-${suffix}`, title: 'Closed root.' },
          hostId
        )
      ).rejects.toBeDefined()
      await expect(
        staleTools.call('create_note', rootNoteInput, { userId: hostId })
      ).rejects.toBeDefined()

      const receiptRows = await db
        .select({
          id: nativeSyncMutationReceipt.mutationId,
          fingerprint: nativeSyncMutationReceipt.mcpFingerprint,
        })
        .from(nativeSyncMutationReceipt)
        .where(eq(nativeSyncMutationReceipt.ownerUserId, contributorId))
      expect(receiptRows.length).toBeGreaterThanOrEqual(5)
      expect(receiptRows.every((row) => typeof row.fingerprint === 'string')).toBe(true)
      const noteRows = await db
        .select({ id: eventNote.id, author: eventNote.authorUserId, eventId: eventNote.eventId })
        .from(eventNote)
        .where(inArray(eventNote.id, [firstNote.id, ownByManager.id]))
      expect(noteRows).toHaveLength(2)
      expect(noteRows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: firstNote.id, author: contributorId, eventId: child.id }),
          expect.objectContaining({ id: ownByManager.id, author: managerId, eventId: child.id }),
        ])
      )
    } finally {
      if (rootId) await db.delete(organization).where(eq(organization.id, rootId))
      if (secondRootId) await db.delete(organization).where(eq(organization.id, secondRootId))
      await db.delete(user).where(inArray(user.id, userIds))
    }
  }
)

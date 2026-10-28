import { expect, test } from 'vitest'
import type { EventPermissions } from '@/lib/permissions'

const enabled = process.env.RUN_MCP_DB_TESTS === '1'

function assertLocalDatabase() {
  const value = process.env.DATABASE_URL
  if (!value) throw new Error('DATABASE_URL is required for MCP content database tests')
  let hostname: string
  try {
    hostname = new URL(value).hostname
  } catch {
    throw new Error('MCP content database tests require a valid local DATABASE_URL')
  }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
    throw new Error('MCP content database tests only run against localhost')
  }
}

test(
  'MCP content writes materialize through native sync, bind retries, and recheck event access',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    assertLocalDatabase()
    const { db } = await import('@/db')
    const { user, organization } = await import('@/db/schema/auth.schema')
    const { event, eventParticipant, workspacePerson } = await import('@/db/schema/event.schema')
    const { nativeSyncMutationReceipt, nativeSyncEntity } =
      await import('@/db/schema/sync.schema')
    const { and, eq, inArray } = await import('drizzle-orm')
    const { applyNativeMutations, listNativeWorkspaceSnapshots } =
      await import('@/server/sync/repos/native-sync-legacy.persistence')
    const { createMcpContentService } = await import('@/server/mcp/content/service')
    const { liveMcpContentPort } = await import('@/server/mcp/content/live')

    const rootHostId = `mcp-host-${crypto.randomUUID()}`
    const viewerId = `mcp-viewer-${crypto.randomUUID()}`
    const contributorId = `mcp-contributor-${crypto.randomUUID()}`
    const scopedOnlyId = `mcp-scoped-only-${crypto.randomUUID()}`
    const managerId = `mcp-manager-${crypto.randomUUID()}`
    const outsiderId = `mcp-outsider-${crypto.randomUUID()}`
    const allUsers = [rootHostId, viewerId, contributorId, scopedOnlyId, managerId, outsiderId]
    let organizationId: string | null = null
    let liveWorkflowEventId: string | null = null
    let managerPersonId: string | null = null
    let downgradeManagerBeforePush = false

    try {
      await db.insert(user).values(
        allUsers.map((id) => ({
          id,
          name: id,
          email: `${id}@example.test`,
          emailVerified: true,
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
        push: async ({
          userId,
          mutation,
          fingerprint,
        }: Parameters<typeof liveMcpContentPort.push>[0]) => {
          const response = await applyNativeMutations({
            userId,
            mutations: [mutation],
            requestFingerprints: { [mutation.id]: fingerprint },
            supportsBlueprintGuides: true,
            supportsTodos: true,
          })
          const result = response.results[0]
          if (!result) throw new Error('Native mutation returned no result.')
          return result
        },
        authorize: async (
          userId: string,
          targetEventId: string,
          permissions: EventPermissions
        ) => {
          await liveMcpContentPort.authorize(userId, targetEventId, permissions)
          if (downgradeManagerBeforePush && userId === managerId && managerPersonId) {
            downgradeManagerBeforePush = false
            await db
              .update(eventParticipant)
              .set({ planningPermission: 'contribute' })
              .where(
                and(
                  eq(eventParticipant.eventId, targetEventId),
                  eq(eventParticipant.personId, managerPersonId)
                )
              )
          }
        },
      }
      const service = createMcpContentService(port)
      const liveWorkflowService = createMcpContentService(liveMcpContentPort)
      const liveWorkflowEvent = (await liveWorkflowService.call(
        'create_event',
        {
          idempotencyKey: 'mcp-live-workflow-event-001',
          title: 'MCP live workflow fixture',
          startsAt: '2032-07-02T16:00:00.000Z',
          timeZone: 'America/Detroit',
        },
        { userId: rootHostId }
      )) as { id: string; version: number }
      liveWorkflowEventId = liveWorkflowEvent.id
      expect(liveWorkflowEvent.version).toBe(1)
      const liveWorkflowEventRow = await db
        .select({ id: event.id })
        .from(event)
        .where(eq(event.id, liveWorkflowEvent.id))
      expect(liveWorkflowEventRow).toHaveLength(1)

      const created = (await service.call(
        'create_event',
        {
          idempotencyKey: 'mcp-event-create-001',
          title: 'MCP event fixture',
          startsAt: '2032-07-01T16:00:00.000Z',
          timeZone: 'America/Detroit',
          locationName: 'Lake pavilion',
        },
        { userId: rootHostId }
      )) as { id: string; version: number }
      organizationId = created.id
      expect(created.version).toBe(1)

      const { snapshots, entities } = await listNativeWorkspaceSnapshots({
        userId: rootHostId,
        supportsBlueprintGuides: true,
        supportsTodos: true,
      })
      const snapshot = snapshots.find((item) => item.scopeID === created.id)
      expect(snapshot).toBeDefined()
      const archive = JSON.parse(Buffer.from(snapshot!.payload, 'base64').toString('utf8'))
      for (const requiredArchiveKey of [
        'mainEventID',
        'title',
        'mainEventStartsAt',
        'mainEventIsAllDay',
        'mainEventTimeZoneIdentifier',
        'venueName',
        'location',
        'dressCode',
        'planningMode',
        'members',
        'eventParticipations',
        'mainEventParticipantIDs',
        'ideas',
        'timeline',
        'eventExpenses',
        'notes',
        'eventMoments',
        'mainEventStatus',
        'isMainEventDeleted',
        'registry',
        'isRegistryShared',
        'isCollaboratorLinkEnabled',
        'requiresCollaboratorApproval',
        'defaultCollaboratorPermission',
      ])
        expect(archive).toHaveProperty(requiredArchiveKey)
      expect(entities).toEqual([])

      const idea = (await service.call(
        'create_idea',
        {
          idempotencyKey: 'mcp-idea-create-001',
          eventId: created.id,
          title: 'Rent canoes',
          category: 'event',
          note: 'For Saturday',
        },
        { userId: rootHostId }
      )) as { id: string; version: number }
      expect(idea.version).toBe(1)
      const initialIdeaEntity = await db
        .select({ payload: nativeSyncEntity.payload })
        .from(nativeSyncEntity)
        .where(eq(nativeSyncEntity.entityId, idea.id))
      const initialIdeaPayload = JSON.parse(
        Buffer.from(initialIdeaEntity[0]!.payload, 'base64').toString('utf8')
      )
      expect(initialIdeaPayload).toMatchObject({
        id: idea.id,
        eventID: created.id,
        note: 'For Saturday',
        submittedBy: 'Planner',
        submittedByUserID: rootHostId,
        status: 'new',
        configuration: { standard: {} },
      })
      expect(typeof initialIdeaPayload.submittedAt).toBe('number')
      const editedIdea = (await service.call(
        'update_idea',
        {
          idempotencyKey: 'mcp-idea-update-001',
          eventId: created.id,
          ideaId: idea.id,
          expectedVersion: 1,
          changes: { note: 'Two canoes' },
        },
        { userId: rootHostId }
      )) as { note: string; version: number }
      expect(editedIdea).toMatchObject({ note: 'Two canoes', version: 2 })
      const clearedIdea = (await service.call(
        'update_idea',
        {
          idempotencyKey: 'mcp-idea-clear-note-001',
          eventId: created.id,
          ideaId: idea.id,
          expectedVersion: 2,
          changes: { note: null },
        },
        { userId: rootHostId }
      )) as { note: string | null; version: number }
      expect(clearedIdea).toMatchObject({ note: null, version: 3 })
      const retriedIdea = (await service.call(
        'update_idea',
        {
          idempotencyKey: 'mcp-idea-update-001',
          eventId: created.id,
          ideaId: idea.id,
          expectedVersion: 1,
          changes: { note: 'Two canoes' },
        },
        { userId: rootHostId }
      )) as { version: number }
      expect(retriedIdea.version).toBe(2)
      await expect(
        service.call(
          'update_idea',
          {
            idempotencyKey: 'mcp-idea-update-001',
            eventId: created.id,
            ideaId: idea.id,
            expectedVersion: 1,
            changes: { note: 'Changed replay' },
          },
          { userId: rootHostId }
        )
      ).rejects.toMatchObject({ code: 'WRITE_REJECTED' })
      await expect(
        service.call(
          'update_idea',
          {
            idempotencyKey: 'mcp-idea-stale-001',
            eventId: created.id,
            ideaId: idea.id,
            expectedVersion: 1,
            changes: { note: 'Stale write' },
          },
          { userId: rootHostId }
        )
      ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' })

      const editedEvent = (await service.call(
        'update_event',
        {
          idempotencyKey: 'mcp-event-update-001',
          eventId: created.id,
          expectedVersion: 1,
          changes: { title: 'Updated MCP event', isAllDay: true },
        },
        { userId: rootHostId }
      )) as { version: number }
      expect(editedEvent.version).toBe(2)
      const retriedEvent = (await service.call(
        'update_event',
        {
          idempotencyKey: 'mcp-event-update-001',
          eventId: created.id,
          expectedVersion: 1,
          changes: { title: 'Updated MCP event', isAllDay: true },
        },
        { userId: rootHostId }
      )) as { version: number }
      expect(retriedEvent.version).toBe(2)
      await expect(
        service.call(
          'update_event',
          {
            idempotencyKey: 'mcp-event-update-001',
            eventId: created.id,
            expectedVersion: 1,
            changes: { title: 'Changed event replay' },
          },
          { userId: rootHostId }
        )
      ).rejects.toMatchObject({ code: 'WRITE_REJECTED' })

      const eventRow = await db.select({ id: event.id }).from(event).where(eq(event.id, created.id))
      expect(eventRow).toHaveLength(1)
      const ideaRows = await db
        .select({ id: nativeSyncEntity.entityId, payload: nativeSyncEntity.payload })
        .from(nativeSyncEntity)
        .where(eq(nativeSyncEntity.entityId, idea.id))
      expect(ideaRows).toHaveLength(1)
      const nativeIdeaPayload = JSON.parse(
        Buffer.from(ideaRows[0]!.payload, 'base64').toString('utf8')
      )
      expect(nativeIdeaPayload).toMatchObject({
        id: idea.id,
        eventID: created.id,
        note: '',
        submittedBy: 'Planner',
        submittedByUserID: rootHostId,
        status: 'new',
        configuration: { standard: {} },
      })
      expect(typeof nativeIdeaPayload.submittedAt).toBe('number')
      expect(nativeIdeaPayload.submittedAt).toBe(initialIdeaPayload.submittedAt)
      const rootReceipts = await db
        .select({ mcpFingerprint: nativeSyncMutationReceipt.mcpFingerprint })
        .from(nativeSyncMutationReceipt)
        .where(eq(nativeSyncMutationReceipt.ownerUserId, rootHostId))
      expect(rootReceipts.length).toBeGreaterThanOrEqual(5)
      expect(rootReceipts.every((row) => typeof row.mcpFingerprint === 'string')).toBe(true)

      const rootPerson = await db
        .select({ id: workspacePerson.id })
        .from(workspacePerson)
        .where(eq(workspacePerson.organizationId, created.id))
      const personRows = [
        { userId: viewerId, permission: 'view_only' as const },
        { userId: contributorId, permission: 'contribute' as const },
        { userId: managerId, permission: 'manage' as const },
      ]
      for (const [index, person] of personRows.entries()) {
        const personId = crypto.randomUUID()
        if (person.userId === managerId) managerPersonId = personId
        await db
          .insert(workspacePerson)
          .values({
            id: personId,
            organizationId: created.id,
            userId: person.userId,
            displayName: person.userId,
          })
        await db
          .insert(eventParticipant)
          .values({
            eventId: created.id,
            personId,
            role: 'collaborator',
            planningPermission: person.permission,
          })
        expect(index).toBeLessThan(3)
      }
      expect(rootPerson).toHaveLength(1)

      const scopedEventId = crypto.randomUUID()
      await db.insert(event).values({
        id: scopedEventId,
        organizationId: created.id,
        parentEventId: created.id,
        title: 'Contributor planning scope',
        status: null,
        planningStatus: 'approved',
        completionStatus: 'upcoming',
        schedulingState: 'scheduled',
        category: 'venue',
        purpose: 'planning_scouting',
        startsAt: new Date('2032-07-01T16:00:00.000Z'),
        timeZone: 'America/Detroit',
        createdByUserId: rootHostId,
      })
      const [scopedOnlyPerson] = await db
        .insert(workspacePerson)
        .values({
          id: crypto.randomUUID(),
          organizationId: created.id,
          userId: scopedOnlyId,
          displayName: 'Scoped only collaborator',
        })
        .returning({ id: workspacePerson.id })
      await db.insert(eventParticipant).values({
        eventId: scopedEventId,
        personId: scopedOnlyPerson!.id,
        role: 'collaborator',
        planningPermission: 'contribute',
      })

      const viewerIdeas = (await service.call(
        'list_ideas',
        { eventId: created.id },
        { userId: viewerId }
      )) as { items: unknown[] }
      expect(viewerIdeas.items).toHaveLength(1)
      const contributorEvents = (await service.call(
        'list_events',
        {},
        { userId: scopedOnlyId }
      )) as { items: Array<Record<string, unknown>> }
      const scopedEvent = contributorEvents.items.find((item) => item.id === scopedEventId)
      expect(scopedEvent).toMatchObject({ isScopedEvent: true, title: 'Contributor planning scope' })
      expect(scopedEvent).not.toHaveProperty('parentEventID')
      expect(scopedEvent).not.toHaveProperty('parentEventId')
      const outsiderEvents = (await service.call(
        'list_events',
        {},
        { userId: outsiderId }
      )) as { items: unknown[] }
      expect(outsiderEvents.items).toHaveLength(0)
      await expect(
        service.call(
          'create_idea',
          {
            idempotencyKey: 'mcp-viewer-write-001',
            eventId: created.id,
            title: 'No write',
            category: 'event',
          },
          { userId: viewerId }
        )
      ).rejects.toBeDefined()
      await expect(
        service.call(
          'update_event',
          {
            idempotencyKey: 'mcp-contributor-event-001',
            eventId: created.id,
            expectedVersion: 2,
            changes: { title: 'No event write' },
          },
          { userId: contributorId }
        )
      ).rejects.toBeDefined()
      const managerEvent = (await service.call(
        'update_event',
        {
          idempotencyKey: 'mcp-manager-event-001',
          eventId: created.id,
          expectedVersion: 2,
          changes: { description: 'Manager edit' },
        },
        { userId: managerId }
      )) as { version: number }
      expect(managerEvent.version).toBe(3)
      downgradeManagerBeforePush = true
      await expect(
        service.call(
          'update_event',
          {
            idempotencyKey: 'mcp-manager-race-001',
            eventId: created.id,
            expectedVersion: 3,
            changes: { title: 'Race should be rejected' },
          },
          { userId: managerId }
        )
      ).rejects.toMatchObject({ code: 'WRITE_REJECTED' })
      const afterRace = await db.select({ title: event.title }).from(event).where(eq(event.id, created.id))
      expect(afterRace[0]?.title).toBe('Updated MCP event')
      await expect(
        service.call('get_event', { eventId: created.id }, { userId: outsiderId })
      ).rejects.toBeDefined()
    } finally {
      if (organizationId) {
        await db.delete(organization).where(eq(organization.id, organizationId))
      }
      if (liveWorkflowEventId) {
        await db.delete(organization).where(eq(organization.id, liveWorkflowEventId))
      }
      await db.delete(user).where(inArray(user.id, allUsers))
    }
  }
)

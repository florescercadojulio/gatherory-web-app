import { and, eq } from 'drizzle-orm'
import { expect, test } from 'vitest'
import {
  assertNoScheduledOverlaps,
  conferencePlan,
  conferencePlanSourceText,
} from '../fixtures/mcp-techxchange-plan'

const enabled = process.env.RUN_MCP_DB_TESTS === '1'

function assertLoopbackDatabase() {
  const value = process.env.DATABASE_URL
  if (!value) throw new Error('DATABASE_URL is required for MCP conference database tests')
  const hostname = new URL(value).hostname
  if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
    throw new Error('MCP conference database tests only run against localhost')
  }
}

test(
  'MCP imports a conference itinerary with linked sessions, source notes, ideas, and retry-safe tasks',
  { skip: !enabled, timeout: 90_000 },
  async () => {
    assertLoopbackDatabase()
    expect(assertNoScheduledOverlaps()).toBe(true)
    const { db } = await import('@/db')
    const { user, organization } = await import('@/db/schema/auth.schema')
    const { nativeSyncEntity } = await import('@/db/schema/sync.schema')
    const { eq: equals } = await import('drizzle-orm')
    const { liveMcpContentPort } = await import('@/server/mcp/content/live')
    const { createMcpEventTools } = await import('@/server/mcp/tools')

    const userId = `mcp-conference-${crypto.randomUUID()}`
    let rootEventId: string | null = null
    const actor = { userId }
    await db.insert(user).values({
      id: userId,
      name: 'Disposable MCP conference fixture user',
      email: `${userId}@example.test`,
      emailVerified: true,
      hasCompletedOnboarding: true,
    })

    try {
      const tools = createMcpEventTools(liveMcpContentPort)
      const rootInput = {
        idempotencyKey: `conference-root-${userId}`,
        title: conferencePlan.title,
        startsAt: conferencePlan.startsAt,
        endsAt: conferencePlan.endsAt,
        timeZone: conferencePlan.timeZone,
        description:
          'Recommended itinerary imported from user-supplied plan. Dates and catalog details were not independently verified.',
      }
      const created = (await tools.call('create_event', rootInput, actor)) as { id: string }
      rootEventId = created.id
      const retriedRoot = (await tools.call('create_event', rootInput, actor)) as { id: string }
      expect(retriedRoot.id).toBe(created.id)

      const importSessions = async (
        items: readonly (typeof conferencePlan.scheduledSessions)[number][]
      ) => {
        for (const [index, session] of items.entries()) {
          const result = (await tools.call(
            'create_child_event',
            {
              parentEventId: created.id,
              idempotencyKey: `conference-child-${index + 1}`,
              title: session.title,
              category: 'other',
              purpose: 'eventExperience',
              description: [
                `Source: ${session.sourceAttribution}`,
                `Catalog URL: ${session.sourceUrl}`,
                session.isOptional ? 'Optional item in the source itinerary.' : '',
              ]
                .filter(Boolean)
                .join('\n'),
              startsAt: session.startsAt,
              endsAt: session.endsAt,
              timeZone: conferencePlan.timeZone,
              isAllDay: false,
              locationName: session.locationName,
            },
            actor
          )) as { id: string; parentEventId: string; startsAt: string; endsAt: string }
          expect(result.parentEventId).toBe(created.id)
          expect(Date.parse(result.endsAt)).toBeGreaterThan(Date.parse(result.startsAt))
        }
      }

      // Simulate a client stopping after a committed prefix; the restart replays
      // those keys and continues without creating duplicate children.
      await importSessions(conferencePlan.scheduledSessions.slice(0, 8))
      await importSessions(conferencePlan.scheduledSessions)
      const childListAfterSchedule = (await tools.call(
        'list_child_events',
        { parentEventId: created.id, limit: 50 },
        actor
      )) as { items: Array<{ id: string }> }
      const firstChildId = childListAfterSchedule.items[0]!.id
      await tools.call(
        'create_note',
        {
          eventId: firstChildId,
          idempotencyKey: 'conference-child-note-1',
          body: 'Session preparation: bring current Power and IBM i configuration details. Source and context are in the parent event notes.',
        },
        actor
      )
      await tools.call(
        'create_task',
        {
          eventId: firstChildId,
          idempotencyKey: 'conference-child-task-1',
          title: 'Capture one useful idea, prerequisite, use case, contact, and next action',
          dueDate: '2026-10-26',
        },
        actor
      )

      for (const [index, idea] of conferencePlan.optionalIdeas.entries()) {
        await tools.call(
          'create_idea',
          {
            idempotencyKey: `conference-option-${index + 1}`,
            eventId: created.id,
            title: idea.title,
            category: 'event',
            note: [
              idea.when,
              idea.reason,
              idea.sourceUrl ? `Source: ${idea.sourceUrl}` : 'No formal URL supplied.',
            ].join('\n'),
          },
          actor
        )
      }

      const importNotes = async () => {
        for (const [index, note] of conferencePlan.notes.entries()) {
          await tools.call(
            'create_note',
            {
              eventId: created.id,
              idempotencyKey: `conference-note-${index + 1}`,
              body: note.body,
            },
            actor
          )
        }
      }
      // Replaying notes and tasks uses the same stable keys as a client retry.
      expect(conferencePlan.notes.every((note) => note.body.length <= 750)).toBe(true)
      await expect(
        tools.call(
          'create_note',
          {
            eventId: created.id,
            idempotencyKey: 'conference-note-1',
            body: 'x'.repeat(751),
          },
          actor
        )
      ).rejects.toBeDefined()
      await importNotes()
      await expect(
        tools.call(
          'create_task',
          {
            eventId: created.id,
            idempotencyKey: 'conference-task-1',
            title: conferencePlan.tasks[0]!.title,
            dueDate: '2026-02-30',
          },
          actor
        )
      ).rejects.toBeDefined()
      for (const [index, task] of conferencePlan.tasks.entries()) {
        await tools.call(
          'create_task',
          {
            eventId: created.id,
            idempotencyKey: `conference-task-${index + 1}`,
            title: task.title,
            dueDate: task.dueDate,
          },
          actor
        )
      }
      await importNotes()
      for (const [index, task] of conferencePlan.tasks.entries()) {
        await tools.call(
          'create_task',
          {
            eventId: created.id,
            idempotencyKey: `conference-task-${index + 1}`,
            title: task.title,
            dueDate: task.dueDate,
          },
          actor
        )
      }

      const childList = (await tools.call(
        'list_child_events',
        { parentEventId: created.id, limit: 50 },
        actor
      )) as { items: Array<Record<string, unknown>> }
      expect(childList.items).toHaveLength(conferencePlan.scheduledSessions.length)
      expect(childList.items.every((item) => item.parentEventId === created.id)).toBe(true)
      for (const session of conferencePlan.scheduledSessions) {
        expect(childList.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              title: session.title,
              startsAt: new Date(session.startsAt).toISOString(),
              endsAt: new Date(session.endsAt).toISOString(),
              timeZone: conferencePlan.timeZone,
              locationName: session.locationName,
              description: expect.stringContaining(session.sourceUrl),
            }),
          ])
        )
      }
      const optionalBlockParty = childList.items.find(
        (item) => item.title === 'Opening night block party (optional) (NETWORK)'
      )
      expect(optionalBlockParty?.description).toContain('Optional item in the source itinerary.')
      expect(childList.items.map((item) => item.title)).toEqual(
        expect.arrayContaining(conferencePlan.scheduledSessions.map((item) => item.title))
      )
      const sorted = [...childList.items].sort(
        (a, b) => Date.parse(String(a.startsAt)) - Date.parse(String(b.startsAt))
      )
      for (let i = 1; i < sorted.length; i++) {
        expect(Date.parse(String(sorted[i - 1]!.endsAt))).toBeLessThanOrEqual(
          Date.parse(String(sorted[i]!.startsAt))
        )
      }
      const firstImportedChildId = String(childList.items[0]!.id)
      const childNotes = (await tools.call(
        'list_notes',
        { eventId: firstImportedChildId, limit: 50 },
        actor
      )) as { items: Array<{ body: string }> }
      const childTasks = (await tools.call(
        'list_tasks',
        { eventId: firstImportedChildId, limit: 50 },
        actor
      )) as { items: Array<Record<string, unknown>> }
      expect(childNotes.items).toHaveLength(1)
      expect(childTasks.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Capture one useful idea, prerequisite, use case, contact, and next action',
          }),
        ])
      )
      const notesList = (await tools.call(
        'list_notes',
        { eventId: created.id, limit: 50 },
        actor
      )) as { items: Array<{ body: string }> }
      expect(notesList.items).toHaveLength(conferencePlan.notes.length)
      const normalizedOriginalText = notesList.items
        .filter((item) => item.body.startsWith('Original conference plan ('))
        .sort(
          (a, b) => Number(a.body.match(/\((\d+)\//)?.[1]) - Number(b.body.match(/\((\d+)\//)?.[1])
        )
        .map((item) => item.body.slice(item.body.indexOf('\n') + 1))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      expect(normalizedOriginalText).toBe(conferencePlanSourceText.replace(/\s+/g, ' ').trim())
      const tasksList = (await tools.call(
        'list_tasks',
        { eventId: created.id, limit: 50 },
        actor
      )) as { items: Array<Record<string, unknown>> }
      expect(tasksList.items).toHaveLength(conferencePlan.tasks.length)
      for (const task of conferencePlan.tasks) {
        expect(tasksList.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              title: task.title,
              dueDate: task.dueDate,
              assigneePersonId: null,
            }),
          ])
        )
      }
      const ideasList = (await tools.call(
        'list_ideas',
        { eventId: created.id, limit: 50 },
        actor
      )) as { items: Array<Record<string, unknown>> }
      expect(ideasList.items).toHaveLength(conferencePlan.optionalIdeas.length)
      expect(ideasList.items.map((item) => item.title)).toContain('TechXchange Unplugged')

      await expect(
        tools.call(
          'list_child_events',
          { parentEventId: created.id, limit: 50 },
          { userId: `${userId}-outsider` }
        )
      ).rejects.toBeDefined()
      await expect(
        tools.call(
          'list_notes',
          { eventId: created.id, limit: 50 },
          { userId: `${userId}-outsider` }
        )
      ).rejects.toBeDefined()
      const persistedChildren = await db
        .select({ id: nativeSyncEntity.entityId })
        .from(nativeSyncEntity)
        .where(
          and(
            equals(nativeSyncEntity.entityType, 'event'),
            equals(nativeSyncEntity.scopeId, created.id)
          )
        )
      expect(persistedChildren).toHaveLength(conferencePlan.scheduledSessions.length)

      const exportPath = process.env.MCP_CONFERENCE_EXPORT_PATH
      if (exportPath) {
        const { isAbsolute, resolve } = await import('node:path')
        const { writeFile } = await import('node:fs/promises')
        const destination = resolve(exportPath)
        if (!isAbsolute(exportPath) || !destination.startsWith('/tmp/')) {
          throw new Error('MCP_CONFERENCE_EXPORT_PATH must resolve to a file under /tmp')
        }
        const native = await liveMcpContentPort.bootstrap(userId)
        const decodePayload = (payload: string) =>
          JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as Record<string, unknown>
        const workspace = native.snapshots.find(
          (snapshot) => snapshot.scopeID.toLowerCase() === created.id.toLowerCase()
        )
        if (!workspace)
          throw new Error('Imported root event snapshot was missing from native sync bootstrap')
        const childEntities = native.entities
          .filter((entity) => entity.entityType === 'event')
          .map((entity) => ({ entity, decoded: decodePayload(entity.payload) }))
          .filter(({ decoded }) => decoded.parentEventID === created.id)
        const childIds = new Set([
          created.id.toLowerCase(),
          ...childEntities.map(({ decoded }) => String(decoded.id).toLowerCase()),
        ])
        const notes = native.entities
          .filter((entity) => entity.entityType === 'note')
          .map((entity) => decodePayload(entity.payload))
          .filter((payload) => childIds.has(String(payload.eventID).toLowerCase()))
        const tasks = native.entities
          .filter((entity) => entity.entityType === 'todo')
          .map((entity) => decodePayload(entity.payload))
          .filter((payload) => childIds.has(String(payload.eventID).toLowerCase()))
        const exported = {
          workspace: decodePayload(workspace.payload),
          childEvents: childEntities.map(({ decoded }) => decoded),
          notes,
          tasks,
        }
        await writeFile(destination, JSON.stringify(exported, null, 2), {
          encoding: 'utf8',
          flag: 'w',
        })
      }
    } finally {
      if (rootEventId) await db.delete(organization).where(eq(organization.id, rootEventId))
      await db.delete(user).where(eq(user.id, userId))
    }
  }
)

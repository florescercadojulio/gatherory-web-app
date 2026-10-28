import { describe, expect, it } from 'vitest'
import { hasEventPermission, type EventPermissions } from '@/lib/permissions'
import type {
  NativeMutation,
  NativePushResult,
  NativeWorkspaceSnapshots,
} from '@/server/sync/contracts/native-sync.contracts'
import { createMcpPlanningService, MCP_PLANNING_TOOLS } from '@/server/mcp/planning/service'
import type { McpContentPort } from '@/server/mcp/content/service'
import { MCP_PLANNING_TOOL_SCHEMAS } from '@/server/mcp/planning/contracts'

const actor = { userId: 'account-1' }
const eventId = '10000000-0000-4000-8000-000000000001'
const childId = '10000000-0000-4000-8000-000000000002'
const noteId = '20000000-0000-4000-8000-000000000001'
const taskId = '30000000-0000-4000-8000-000000000001'
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')
const entity = (
  scopeID: string,
  entityType: string,
  entityID: string,
  payload: unknown,
  serverVersion = 2
) => ({
  scopeID,
  payloadSchemaVersion: 1 as const,
  entityType,
  entityID,
  payload: encode(payload),
  serverVersion,
  updatedAt: '2026-10-01T00:00:00Z',
})
function fixture(): NativeWorkspaceSnapshots {
  return {
    account: { hasCompletedOnboarding: true },
    snapshots: [eventId, childId].map((scopeID) => ({
      scopeID,
      payloadSchemaVersion: 1 as const,
      payload: encode({ mainEventID: scopeID, title: 'Conference', mainEventStatus: 'draft' }),
      serverVersion: 3,
      updatedAt: '2026-10-01T00:00:00Z',
    })),
    entities: [
      entity(eventId, 'note', noteId, {
        id: noteId,
        eventID: eventId,
        authorUserID: actor.userId,
        body: 'Venue shortlist',
        sentAt: 800000000,
      }),
      entity(eventId, 'todo', taskId, {
        id: taskId,
        eventID: eventId,
        title: 'Book room',
        dueDate: '2026-11-02',
        websiteURL: null,
        assigneePersonID: '40000000-0000-4000-8000-000000000001',
        isCompleted: false,
        createdAt: 800000000,
      }),
      entity(childId, 'note', '20000000-0000-4000-8000-000000000002', {
        id: '20000000-0000-4000-8000-000000000002',
        eventID: childId,
        authorUserID: 'other',
        body: 'Child private',
        sentAt: 800000000,
      }),
    ],
  }
}
function makePort(overrides: Partial<McpContentPort> = {}) {
  const calls: {
    permissions: Array<{ eventId: string; value: EventPermissions }>
    mutations: NativeMutation[]
  } = { permissions: [], mutations: [] }
  const receipts = new Map<string, { fingerprint: string; version: number }>()
  const value: McpContentPort = {
    bootstrap: async () => fixture(),
    push: async ({ mutation, fingerprint }) => {
      calls.mutations.push(mutation)
      const prior = receipts.get(mutation.id)
      if (prior)
        return {
          mutationID: mutation.id,
          disposition: prior.fingerprint === fingerprint ? 'duplicate' : 'rejected',
          serverVersion: prior.version,
          failureCode: prior.fingerprint === fingerprint ? null : 'MCP_IDEMPOTENCY_KEY_REUSED',
        }
      const result: NativePushResult = {
        mutationID: mutation.id,
        disposition: 'applied',
        serverVersion: (mutation.baseVersion ?? 0) + 1,
        failureCode: null,
      }
      receipts.set(mutation.id, { fingerprint, version: result.serverVersion! })
      return result
    },
    authorize: async (_userId, target, permissions) => {
      calls.permissions.push({ eventId: target, value: permissions })
    },
    isRootEvent: async () => true,
    ...overrides,
  }
  return { value, calls }
}

const toolNames = MCP_PLANNING_TOOLS.map(({ name }) => name)

describe('MCP notes and tasks', () => {
  it('counts note bodies and task titles by Unicode code point at native limits', () => {
    const note = { eventId, idempotencyKey: 'unicode-note-001', body: '😀'.repeat(750) }
    expect(MCP_PLANNING_TOOL_SCHEMAS.create_note.safeParse(note).success).toBe(true)
    expect(
      MCP_PLANNING_TOOL_SCHEMAS.create_note.safeParse({ ...note, body: '😀'.repeat(751) }).success
    ).toBe(false)

    const task = { eventId, idempotencyKey: 'unicode-task-001', title: '😀'.repeat(200) }
    expect(MCP_PLANNING_TOOL_SCHEMAS.create_task.safeParse(task).success).toBe(true)
    expect(
      MCP_PLANNING_TOOL_SCHEMAS.create_task.safeParse({ ...task, title: '😀'.repeat(201) }).success
    ).toBe(false)
  })

  it('allows view-only collaborators to read tasks, denies their writes, and denies guest task access', () => {
    const viewOnly = { role: 'collaborator' as const, planningPermission: 'viewOnly' as const }
    const guest = { role: 'guest' as const, planningPermission: 'viewOnly' as const }
    const contributor = { role: 'collaborator' as const, planningPermission: 'contribute' as const }
    expect(hasEventPermission(viewOnly, { todo: ['read'] })).toBe(true)
    expect(hasEventPermission(viewOnly, { todo: ['create'] })).toBe(false)
    expect(hasEventPermission(viewOnly, { todo: ['update'] })).toBe(false)
    expect(hasEventPermission(guest, { todo: ['read'] })).toBe(false)
    expect(hasEventPermission(viewOnly, { note: ['read'] })).toBe(true)
    expect(hasEventPermission(viewOnly, { note: ['send'] })).toBe(false)
    expect(hasEventPermission(contributor, { note: ['read'] })).toBe(true)
    expect(hasEventPermission(contributor, { note: ['send'] })).toBe(true)
    expect(hasEventPermission(guest, { note: ['read'] })).toBe(false)
    expect(hasEventPermission(guest, { note: ['send'] })).toBe(false)
  })

  it('publishes all six planning tools as read or write tools', () => {
    expect(toolNames).toEqual([
      'list_notes',
      'create_note',
      'update_note',
      'list_tasks',
      'create_task',
      'update_task',
    ])
    expect(MCP_PLANNING_TOOLS.filter((tool) => tool.readOnly).map(({ name }) => name)).toEqual([
      'list_notes',
      'list_tasks',
    ])
  })

  it('lists only exact-scope notes/tasks and never returns author ids', async () => {
    const { value, calls } = makePort()
    const service = createMcpPlanningService(value)
    const notes = (await service.call('list_notes', { eventId }, actor)) as {
      items: Array<Record<string, unknown>>
    }
    const tasks = (await service.call('list_tasks', { eventId }, actor)) as {
      items: Array<Record<string, unknown>>
    }
    expect(notes.items).toHaveLength(1)
    expect(notes.items[0]).toMatchObject({
      id: noteId,
      eventId,
      body: 'Venue shortlist',
      version: 2,
    })
    expect(notes.items[0]).not.toHaveProperty('authorUserID')
    expect(tasks.items[0]).toMatchObject({ id: taskId, dueDate: '2026-11-02', isCompleted: false })
    expect(calls.permissions).toEqual([
      { eventId, value: { note: ['read'] } },
      { eventId, value: { todo: ['read'] } },
    ])
  })

  it('creates native note/task payloads, preserves null assignees, and retries idempotently', async () => {
    const { value, calls } = makePort()
    const service = createMcpPlanningService(value)
    const noteInput = {
      eventId,
      idempotencyKey: 'note-create-001',
      body: 'Full source text for the conference.',
    }
    const note1 = (await service.call('create_note', noteInput, actor)) as Record<string, unknown>
    const note2 = (await service.call('create_note', noteInput, actor)) as Record<string, unknown>
    const task = (await service.call(
      'create_task',
      {
        eventId,
        idempotencyKey: 'task-create-001',
        title: 'Send call for papers',
        dueDate: '2026-11-02',
      },
      actor
    )) as Record<string, unknown>
    expect(note1.id).toBe(note2.id)
    expect(calls.mutations[0]?.entityType).toBe('note')
    expect(JSON.parse(Buffer.from(calls.mutations[0]!.payload, 'base64').toString())).toMatchObject(
      { eventID: eventId, authorUserID: actor.userId, body: noteInput.body }
    )
    const payload = JSON.parse(Buffer.from(calls.mutations[2]!.payload, 'base64').toString())
    expect(payload).toMatchObject({
      eventID: eventId,
      title: 'Send call for papers',
      dueDate: '2026-11-02',
      isCompleted: false,
      assigneePersonID: null,
    })
    expect(task.assigneePersonId).toBeNull()
    expect(calls.mutations[0]!.id).toBe(calls.mutations[1]!.id)
    await expect(
      service.call('create_note', { ...noteInput, body: 'Changed content with reused key.' }, actor)
    ).rejects.toMatchObject({ code: 'WRITE_REJECTED' })
  })

  it('updates only authored notes and maps task completion and explicit null clearing to native payloads', async () => {
    const { value, calls } = makePort()
    const service = createMcpPlanningService(value)
    await service.call(
      'update_note',
      {
        eventId,
        noteId,
        expectedVersion: 2,
        idempotencyKey: 'note-update-001',
        body: 'Updated shortlist',
      },
      actor
    )
    await service.call(
      'update_task',
      {
        eventId,
        taskId,
        expectedVersion: 2,
        idempotencyKey: 'task-update-001',
        changes: { dueDate: null, websiteURL: null, isCompleted: true },
      },
      actor
    )
    const updatedNote = JSON.parse(Buffer.from(calls.mutations[0]!.payload, 'base64').toString())
    const updatedTask = JSON.parse(Buffer.from(calls.mutations[1]!.payload, 'base64').toString())
    expect(updatedNote).toMatchObject({
      id: noteId,
      eventID: eventId,
      authorUserID: actor.userId,
      body: 'Updated shortlist',
    })
    expect(updatedTask).toMatchObject({
      dueDate: null,
      websiteURL: null,
      assigneePersonID: '40000000-0000-4000-8000-000000000001',
      isCompleted: true,
    })

    await expect(
      service.call(
        'update_note',
        {
          eventId,
          noteId: '20000000-0000-4000-8000-000000000002',
          expectedVersion: 2,
          idempotencyKey: 'note-update-002',
          body: 'Nope',
        },
        actor
      )
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('resolves child notes and tasks inside the accessible parent log without crossing scopes', async () => {
    const data = fixture()
    data.snapshots = [data.snapshots[0]!]
    data.entities = [
      entity(eventId, 'event', childId, { id: childId, parentEventID: eventId, status: 'active' }),
      entity(eventId, 'note', '20000000-0000-4000-8000-000000000003', {
        id: '20000000-0000-4000-8000-000000000003',
        eventID: childId,
        authorUserID: actor.userId,
        body: 'Child planning note',
        sentAt: 800000000,
      }),
      entity(eventId, 'todo', '30000000-0000-4000-8000-000000000003', {
        id: '30000000-0000-4000-8000-000000000003',
        eventID: childId,
        title: 'Child task',
        dueDate: null,
        isCompleted: false,
        createdAt: 800000000,
      }),
      entity(eventId, 'note', '20000000-0000-4000-8000-000000000004', {
        id: '20000000-0000-4000-8000-000000000004',
        eventID: eventId,
        authorUserID: actor.userId,
        body: 'Root private note',
        sentAt: 800000000,
      }),
    ]
    const { value, calls } = makePort({ bootstrap: async () => data })
    const service = createMcpPlanningService(value)
    const notes = (await service.call('list_notes', { eventId: childId }, actor)) as {
      items: Array<Record<string, unknown>>
    }
    expect(notes.items).toHaveLength(1)
    expect(notes.items[0]).toMatchObject({ body: 'Child planning note', eventId: childId })
    const created = (await service.call(
      'create_task',
      { eventId: childId, idempotencyKey: 'child-task-create-01', title: 'Prepare room' },
      actor
    )) as { eventId: string }
    expect(created.eventId).toBe(childId)
    expect(calls.mutations[0]).toMatchObject({ scopeID: eventId, entityType: 'todo' })
    expect(JSON.parse(Buffer.from(calls.mutations[0]!.payload, 'base64').toString()).eventID).toBe(
      childId
    )
    expect(calls.permissions).toEqual([
      { eventId: childId, value: { note: ['read'] } },
      { eventId: childId, value: { todo: ['create'] } },
    ])
  })

  it('rejects cross-scope identifiers, invalid due dates, view-only writes, and closed-event writes', async () => {
    const { value } = makePort()
    const service = createMcpPlanningService(value)
    await expect(
      service.call(
        'update_task',
        {
          eventId,
          taskId: '30000000-0000-4000-8000-000000000099',
          expectedVersion: 2,
          idempotencyKey: 'task-update-002',
          changes: { isCompleted: true },
        },
        actor
      )
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(
      service.call(
        'create_task',
        { eventId, idempotencyKey: 'task-create-002', title: 'Bad date', dueDate: '2026-02-30' },
        actor
      )
    ).rejects.toThrow()
    await expect(
      service.call(
        'create_task',
        {
          eventId,
          idempotencyKey: 'task-create-assignee',
          title: 'Do not assign',
          assigneePersonId: '40000000-0000-4000-8000-000000000001',
        },
        actor
      )
    ).rejects.toThrow()
    await expect(
      service.call(
        'update_task',
        {
          eventId,
          taskId,
          expectedVersion: 2,
          idempotencyKey: 'task-update-assignee',
          changes: { assigneePersonId: '40000000-0000-4000-8000-000000000001' },
        },
        actor
      )
    ).rejects.toThrow()
    const viewPort = makePort({
      authorize: async (_user, _event, permissions) => {
        if (permissions.note?.includes('send') || permissions.todo?.includes('create'))
          throw new Error('permission denied')
      },
    })
    await expect(
      createMcpPlanningService(viewPort.value).call(
        'create_task',
        { eventId, idempotencyKey: 'task-create-003', title: 'Forbidden' },
        actor
      )
    ).rejects.toThrow('permission denied')
    const closed = makePort({
      bootstrap: async () => {
        const data = fixture()
        data.snapshots[0]!.payload = encode({ mainEventID: eventId, mainEventStatus: 'finished' })
        return data
      },
    })
    await expect(
      createMcpPlanningService(closed.value).call(
        'create_note',
        { eventId, idempotencyKey: 'note-create-003', body: 'Closed' },
        actor
      )
    ).rejects.toMatchObject({ code: 'WRITE_REJECTED' })
  })
})

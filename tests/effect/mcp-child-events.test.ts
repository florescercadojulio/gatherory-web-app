import { describe, expect, it } from 'vitest'
import type { EventPermissions } from '@/lib/permissions'
import type {
  NativeMutation,
  NativePushResult,
  NativeWorkspaceSnapshots,
} from '@/server/sync/contracts/native-sync.contracts'
import { createMcpChildEventsService, type McpChildEventsPort } from '@/server/mcp/children/service'
import { CreateChildEventInputSchema } from '@/server/mcp/children/contracts'
import { ConfirmedInstantSchema } from '@/contracts/date-time.contracts'

const actor = { userId: 'account-1' }
const rootId = '10000000-0000-4000-8000-000000000001'
const childId = '20000000-0000-4000-8000-000000000001'
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')
const toNativeDate = (value: string) => Date.parse(value) / 1000 - 978307200

function fixture(includeChild = false): NativeWorkspaceSnapshots {
  const entities: NativeWorkspaceSnapshots['entities'] = []
  if (includeChild) {
    entities.push({
      scopeID: rootId,
      payloadSchemaVersion: 1,
      entityType: 'event',
      entityID: childId,
      payload: encode({
        id: childId,
        parentEventID: rootId,
        title: 'Welcome dinner',
        category: 'reception',
        purpose: 'eventExperience',
        scheduledAt: toNativeDate('2026-11-15T19:00:00.000Z'),
        schedulingState: 'scheduled',
        endsAt: null,
        isAllDay: false,
        timeZoneIdentifier: 'America/Detroit',
        eventLocation: { locationName: 'Harbor Room', address: '4 Main St' },
        eventDescription: 'Conference welcome',
        dressCode: '',
        status: 'approved',
        completionStatus: 'upcoming',
      }),
      serverVersion: 3,
      updatedAt: '2026-01-01T00:00:00Z',
    })
  }
  return {
    account: { hasCompletedOnboarding: true },
    snapshots: [
      {
        scopeID: rootId,
        payloadSchemaVersion: 1,
        payload: encode({
          mainEventID: rootId,
          title: 'Gatherory conference',
          mainEventStatus: 'ongoing',
          mainEventStartsAt: toNativeDate('2026-11-15T00:00:00.000Z'),
        }),
        serverVersion: 4,
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    entities,
  }
}

function makePort(options: { blocked?: boolean } = {}) {
  const calls: {
    authorizations: Array<{ eventId: string; permissions: EventPermissions }>
    mutations: NativeMutation[]
  } = { authorizations: [], mutations: [] }
  const receipts = new Map<string, { fingerprint: string; version: number }>()
  let data = fixture()
  const port: McpChildEventsPort = {
    bootstrap: async () => data,
    authorize: async (_userId, eventId, permissions) => {
      calls.authorizations.push({ eventId, permissions })
      if (options.blocked) throw new Error('forbidden')
    },
    isRootEvent: async () => true,
    push: async ({ mutation, fingerprint }) => {
      calls.mutations.push(mutation)
      const previous = receipts.get(mutation.id)
      if (previous) {
        if (previous.fingerprint !== fingerprint)
          return {
            mutationID: mutation.id,
            disposition: 'rejected',
            serverVersion: null,
            failureCode: 'MCP_IDEMPOTENCY_KEY_REUSED',
          }
        return {
          mutationID: mutation.id,
          disposition: 'duplicate',
          serverVersion: previous.version,
          failureCode: null,
        }
      }
      const result: NativePushResult = {
        mutationID: mutation.id,
        disposition: 'applied',
        serverVersion: mutation.operation === 'create' ? 1 : (mutation.baseVersion ?? 0) + 1,
        failureCode: null,
      }
      receipts.set(mutation.id, { fingerprint, version: result.serverVersion! })
      if (mutation.entityType === 'event') {
        data.entities.push({
          scopeID: mutation.scopeID,
          payloadSchemaVersion: 1,
          entityType: 'event',
          entityID: mutation.entityID,
          payload: mutation.payload,
          serverVersion: result.serverVersion!,
          updatedAt: new Date().toISOString(),
        })
      }
      return result
    },
  }
  return { port, calls }
}

describe('MCP child events', () => {
  it('preserves purpose, category, all-day state and every omitted field on a title-only edit', async () => {
    const { port, calls } = makePort()
    const data = fixture(true)
    const original = JSON.parse(Buffer.from(data.entities[0]!.payload, 'base64').toString())
    original.isAllDay = true
    data.entities[0]!.payload = encode(original)
    port.bootstrap = async () => data
    await createMcpChildEventsService(port).call(
      'update_child_event',
      {
        parentEventId: rootId,
        childEventId: childId,
        expectedVersion: 3,
        idempotencyKey: 'title-only-preserves-plan',
        changes: { title: 'Welcome reception' },
      },
      actor
    )
    const updated = JSON.parse(Buffer.from(calls.mutations[0]!.payload, 'base64').toString())
    expect(updated).toEqual({ ...original, title: 'Welcome reception' })
  })

  it('counts child-event text by Unicode code point and requires confirmed instants', () => {
    const base = {
      parentEventId: rootId,
      idempotencyKey: 'unicode-child-title',
      title: '😀'.repeat(120),
      startsAt: '2026-11-15T19:00:00.000Z',
      timeZone: 'America/Detroit',
    }
    expect(CreateChildEventInputSchema.safeParse(base).success).toBe(true)
    expect(
      CreateChildEventInputSchema.safeParse({ ...base, title: '😀'.repeat(121) }).success
    ).toBe(false)
    expect(ConfirmedInstantSchema.safeParse('2026-11-15T19:00:00.0000Z').success).toBe(false)
    expect(ConfirmedInstantSchema.safeParse('2026-02-30T19:00:00Z').success).toBe(false)
    expect(ConfirmedInstantSchema.safeParse('2026-11-15T19:00:00-00:00').success).toBe(false)
  })

  it('creates a canonical scheduled native child event linked to the exact root', async () => {
    const { port, calls } = makePort()
    const service = createMcpChildEventsService(port)
    const input = {
      parentEventId: rootId,
      idempotencyKey: 'conference-session-001',
      title: 'Opening reception',
      category: 'reception',
      purpose: 'eventExperience',
      startsAt: '2026-11-15T19:00:00.000Z',
      endsAt: '2026-11-15T21:00:00.000Z',
      timeZone: 'America/Detroit',
      isAllDay: false,
      locationName: 'Harbor Room',
      locationAddress: '4 Main St',
      description: 'Conference welcome',
    }
    const created = (await service.call('create_child_event', input, actor)) as {
      id: string
      parentEventId: string
      version: number
    }

    const mutation = calls.mutations[0]!
    const payload = JSON.parse(Buffer.from(mutation.payload, 'base64').toString())
    expect(created).toMatchObject({ id: mutation.entityID, parentEventId: rootId, version: 1 })
    expect(mutation).toMatchObject({
      entityType: 'event',
      operation: 'create',
      scopeID: rootId,
      entityID: created.id,
      baseVersion: 0,
    })
    expect(payload).toMatchObject({
      id: created.id,
      parentEventID: rootId,
      title: 'Opening reception',
      category: 'reception',
      purpose: 'eventExperience',
      schedulingState: 'scheduled',
      timeZoneIdentifier: 'America/Detroit',
      status: 'approved',
      completionStatus: 'upcoming',
      eventDescription: 'Conference welcome',
    })
    expect(calls.authorizations[0]).toEqual({
      eventId: rootId,
      permissions: { event: ['create_child'] },
    })
  })

  it('lists children from native event entities and does not return grandchildren', async () => {
    const { port } = makePort()
    const data = fixture(true)
    data.entities.push({
      ...data.entities[0]!,
      entityID: '30000000-0000-4000-8000-000000000001',
      payload: encode({
        id: '30000000-0000-4000-8000-000000000001',
        parentEventID: childId,
        title: 'Nested event',
        scheduledAt: toNativeDate('2026-11-16T19:00:00.000Z'),
      }),
    })
    const withData = { ...port, bootstrap: async () => data }
    const service = createMcpChildEventsService(withData)
    const result = (await service.call('list_child_events', { parentEventId: rootId }, actor)) as {
      items: Array<Record<string, unknown>>
    }
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      id: childId,
      parentEventId: rootId,
      title: 'Welcome dinner',
      startsAt: '2026-11-15T19:00:00.000Z',
      locationName: 'Harbor Room',
      version: 3,
    })
  })

  it('updates one child with optimistic version and preserves its parent link', async () => {
    const { port, calls } = makePort()
    const data = fixture(true)
    const withData = { ...port, bootstrap: async () => data }
    const service = createMcpChildEventsService(withData)
    await service.call(
      'update_child_event',
      {
        parentEventId: rootId,
        childEventId: childId,
        idempotencyKey: 'conference-session-edit',
        expectedVersion: 3,
        changes: { title: 'Updated welcome', description: null },
      },
      actor
    )
    const mutation = calls.mutations[0]!
    const payload = JSON.parse(Buffer.from(mutation.payload, 'base64').toString())
    expect(mutation).toMatchObject({
      entityType: 'event',
      operation: 'update',
      scopeID: rootId,
      entityID: childId,
      baseVersion: 3,
    })
    expect(payload).toMatchObject({
      id: childId,
      parentEventID: rootId,
      title: 'Updated welcome',
      eventDescription: '',
    })
    expect(calls.authorizations[0]).toEqual({
      eventId: rootId,
      permissions: { event: ['update'] },
    })
  })

  it('rejects updating a child linked to a different root', async () => {
    const { port, calls } = makePort()
    const data = fixture(true)
    const child = JSON.parse(Buffer.from(data.entities[0]!.payload, 'base64').toString())
    child.parentEventID = '40000000-0000-4000-8000-000000000001'
    data.entities[0]!.payload = encode(child)
    const service = createMcpChildEventsService({ ...port, bootstrap: async () => data })
    await expect(
      service.call(
        'update_child_event',
        {
          parentEventId: rootId,
          childEventId: childId,
          idempotencyKey: 'cross-root-update-001',
          expectedVersion: 3,
          changes: { title: 'Must not update' },
        },
        actor
      )
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(calls.mutations).toHaveLength(0)
  })

  it('rejects invalid timezone and end-before-start intervals', async () => {
    const { port, calls } = makePort()
    const service = createMcpChildEventsService(port)
    const input = {
      parentEventId: rootId,
      idempotencyKey: 'invalid-child-time',
      title: 'Invalid session',
      startsAt: '2026-11-15T21:00:00.000Z',
      timeZone: 'Mars/Phobos',
    }
    await expect(service.call('create_child_event', input, actor)).rejects.toThrow()
    await expect(
      service.call(
        'create_child_event',
        { ...input, timeZone: 'UTC', endsAt: '2026-11-15T20:00:00.000Z' },
        actor
      )
    ).rejects.toThrow()
    expect(calls.mutations).toHaveLength(0)
  })

  it('rejects an explicit offset that disagrees with the child event IANA zone', async () => {
    const { port, calls } = makePort()
    const service = createMcpChildEventsService(port)
    await expect(
      service.call(
        'create_child_event',
        {
          parentEventId: rootId,
          idempotencyKey: 'offset-zone-mismatch',
          title: 'Mismatched confirmed time',
          startsAt: '2026-10-28T10:30:00-05:00',
          endsAt: '2026-10-28T11:00:00-05:00',
          timeZone: 'America/New_York',
        },
        actor
      )
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
    expect(calls.mutations).toHaveLength(0)
  })

  it('retries a create with the same deterministic id and rejects key reuse', async () => {
    const { port, calls } = makePort()
    const service = createMcpChildEventsService(port)
    const input = {
      parentEventId: rootId,
      idempotencyKey: 'retry-child-0001',
      title: 'Retry session',
      startsAt: '2026-11-15T21:00:00.000Z',
      timeZone: 'UTC',
    }
    const first = (await service.call('create_child_event', input, actor)) as { id: string }
    const second = (await service.call('create_child_event', input, actor)) as { id: string }
    expect(second.id).toBe(first.id)
    expect(calls.mutations[0]!.entityID).toBe(calls.mutations[1]!.entityID)
    await expect(
      service.call('create_child_event', { ...input, title: 'Different session' }, actor)
    ).rejects.toMatchObject({ code: 'WRITE_REJECTED' })
    expect(calls.authorizations).toHaveLength(3)
  })

  it('keeps viewer writes blocked before the idempotency receipt is checked', async () => {
    const { port, calls } = makePort({ blocked: true })
    const service = createMcpChildEventsService(port)
    await expect(
      service.call(
        'create_child_event',
        {
          parentEventId: rootId,
          idempotencyKey: 'viewer-child-0001',
          title: 'Forbidden session',
          startsAt: '2026-11-15T21:00:00.000Z',
          timeZone: 'UTC',
        },
        actor
      )
    ).rejects.toThrow('forbidden')
    expect(calls.mutations).toHaveLength(0)
  })
})

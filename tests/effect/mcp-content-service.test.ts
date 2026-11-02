import { describe, expect, it } from 'vitest'
import type { EventPermissions } from '@/lib/permissions'
import type {
  NativeMutation,
  NativePushResult,
  NativeWorkspaceSnapshots,
} from '@/server/sync/contracts/native-sync.contracts'
import { createMcpContentService, type McpContentPort } from '@/server/mcp/content/service'

const actor = { userId: 'account-1' }
const eventId = '10000000-0000-4000-8000-000000000001'
const ideaId = '20000000-0000-4000-8000-000000000001'
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')

function fixture(): NativeWorkspaceSnapshots {
  return {
    account: { hasCompletedOnboarding: true },
    snapshots: [
      {
        scopeID: eventId,
        payloadSchemaVersion: 1,
        payload: encode({
          mainEventID: eventId,
          title: 'Camp weekend',
          eventMessage: 'Bring warm clothes',
          mainEventStartsAt: 800000000,
          mainEventEndsAt: 800086400,
          mainEventTimeZoneIdentifier: 'America/Detroit',
          mainEventLocation: { locationName: 'Pine Lake', address: '1 Lake Rd' },
          members: [{ name: 'Private person' }],
          eventParticipations: [{ attendance: 'going' }],
        }),
        serverVersion: 4,
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    entities: [
      {
        scopeID: eventId,
        payloadSchemaVersion: 1,
        entityType: 'idea',
        entityID: ideaId,
        payload: encode({
          id: ideaId,
          eventID: eventId,
          title: 'Canoe rental',
          submittedBy: 'Original planner',
          submittedAt: 12345,
          category: 'event',
          note: 'Two hours',
          status: 'new',
          configuration: { standard: {} },
          submittedByUserID: 'other-account',
        }),
        serverVersion: 2,
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
  }
}

function port(overrides: Partial<McpContentPort> = {}) {
  const calls: {
    authorizations: Array<{ eventId: string; permissions: EventPermissions }>
    mutations: NativeMutation[]
  } = {
    authorizations: [],
    mutations: [],
  }
  const receipts = new Map<string, { fingerprint: string; serverVersion: number }>()
  const value: McpContentPort = {
    bootstrap: async () => fixture(),
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
          serverVersion: previous.serverVersion,
          failureCode: null,
        }
      }
      const currentVersion =
        mutation.entityType === 'workspace'
          ? (fixture().snapshots.find(({ scopeID }) => scopeID === mutation.scopeID)
              ?.serverVersion ?? 0)
          : (fixture().entities.find(({ entityID }) => entityID === mutation.entityID)
              ?.serverVersion ?? 0)
      if (mutation.operation === 'update' && mutation.baseVersion !== currentVersion) {
        const result = {
          mutationID: mutation.id,
          disposition: 'conflict',
          serverVersion: currentVersion,
          failureCode: 'SERVER_VERSION_CONFLICT',
        } satisfies NativePushResult
        receipts.set(mutation.id, { fingerprint, serverVersion: currentVersion })
        return result
      }
      const result = {
        mutationID: mutation.id,
        disposition: 'applied',
        serverVersion: (mutation.baseVersion ?? 0) + 1,
        failureCode: null,
      } satisfies NativePushResult
      receipts.set(mutation.id, { fingerprint, serverVersion: result.serverVersion })
      return result
    },
    authorize: async (_userId, target, permissions) => {
      calls.authorizations.push({ eventId: target, permissions })
    },
    isRootEvent: async () => true,
    ...overrides,
  }
  return { value, calls }
}

describe('MCP content service', () => {
  it('projects only planning event and idea fields, omitting roster and author data', async () => {
    const { value } = port()
    const service = createMcpContentService(value)
    const event = (await service.call('get_event', { eventId }, actor)) as Record<string, unknown>
    const ideas = (await service.call('list_ideas', { eventId }, actor)) as {
      items: Array<Record<string, unknown>>
    }

    expect(event).toMatchObject({
      id: eventId,
      title: 'Camp weekend',
      description: 'Bring warm clothes',
      locationName: 'Pine Lake',
      locationAddress: '1 Lake Rd',
      version: 4,
    })
    expect(event).not.toHaveProperty('members')
    expect(event).not.toHaveProperty('eventParticipations')
    expect(ideas.items[0]).toMatchObject({
      id: ideaId,
      eventId,
      title: 'Canoe rental',
      category: 'event',
      note: 'Two hours',
      version: 2,
    })
    expect(ideas.items[0]).not.toHaveProperty('submittedByUserID')
    expect(ideas.items[0]).not.toHaveProperty('configuration')
  })

  it('derives event identity from account and idempotency key and builds the native workspace payload server side', async () => {
    const { value, calls } = port()
    const service = createMcpContentService(value)
    const input = {
      idempotencyKey: 'request-0001',
      title: 'Dinner',
      startsAt: '2026-11-01T19:00:00.000Z',
      timeZone: 'America/Detroit',
    }
    const first = (await service.call('create_event', input, actor)) as {
      id: string
      version: number
    }
    const second = (await service.call('create_event', input, actor)) as {
      id: string
      version: number
    }

    expect(first.id).toBe(second.id)
    expect(calls.mutations).toHaveLength(2)
    expect(calls.mutations[0]).toMatchObject({
      entityType: 'workspace',
      operation: 'create',
      scopeID: first.id,
      entityID: first.id,
      baseVersion: 0,
    })
    const payload = JSON.parse(Buffer.from(calls.mutations[0]!.payload, 'base64').toString())
    expect(payload).toMatchObject({
      mainEventID: first.id,
      title: 'Dinner',
      mainEventStatus: 'ongoing',
    })
    expect(payload.members[0]).toMatchObject({ userID: actor.userId, participantRole: 'host' })
    expect(payload).not.toHaveProperty('userId')

    await expect(
      service.call('create_event', { ...input, title: 'Changed title' }, actor)
    ).rejects.toMatchObject({ code: 'WRITE_REJECTED' })
    await expect(
      service.call('create_event', { ...input, isAllDay: true }, actor)
    ).rejects.toMatchObject({ code: 'WRITE_REJECTED' })
    expect(calls.mutations[2]!.id).toBe(calls.mutations[0]!.id)
    expect(calls.mutations[2]!.scopeID).toBe(calls.mutations[0]!.scopeID)
  })

  it('authorizes exact event writes and uses required expected versions', async () => {
    const { value, calls } = port()
    const service = createMcpContentService(value)
    await service.call(
      'update_event',
      {
        idempotencyKey: 'request-event-edit',
        eventId,
        expectedVersion: 4,
        changes: { title: 'Updated camp' },
      },
      actor
    )
    await service.call(
      'create_idea',
      {
        idempotencyKey: 'request-idea-new',
        eventId,
        title: 'Hike',
        category: 'event',
      },
      actor
    )
    await service.call(
      'update_idea',
      {
        idempotencyKey: 'request-idea-edit',
        eventId,
        ideaId,
        expectedVersion: 2,
        changes: { note: 'Easy trail' },
      },
      actor
    )

    expect(calls.authorizations).toEqual([
      { eventId, permissions: { event: ['update'] } },
      { eventId, permissions: { idea: ['create'] } },
      { eventId, permissions: { idea: ['update'] } },
    ])
    expect(
      calls.mutations.map(({ entityType, operation, baseVersion }) => ({
        entityType,
        operation,
        baseVersion,
      }))
    ).toEqual([
      { entityType: 'workspace', operation: 'update', baseVersion: 4 },
      { entityType: 'idea', operation: 'create', baseVersion: 0 },
      { entityType: 'idea', operation: 'update', baseVersion: 2 },
    ])
    const createdIdeaPayload = JSON.parse(
      Buffer.from(calls.mutations[1]!.payload, 'base64').toString('utf8')
    )
    expect(createdIdeaPayload).toMatchObject({
      id: calls.mutations[1]!.entityID,
      eventID: eventId,
      title: 'Hike',
      note: '',
      submittedBy: 'Planner',
      submittedByUserID: actor.userId,
      status: 'new',
      configuration: { standard: {} },
    })
    expect(typeof createdIdeaPayload.submittedAt).toBe('number')
    expect(Number.isFinite(createdIdeaPayload.submittedAt)).toBe(true)
    const updatedIdeaPayload = JSON.parse(
      Buffer.from(calls.mutations[2]!.payload, 'base64').toString('utf8')
    )
    expect(updatedIdeaPayload.note).toBe('Easy trail')
    expect(updatedIdeaPayload.submittedBy).toBe('Original planner')
    expect(updatedIdeaPayload.submittedByUserID).toBe('other-account')
    expect(updatedIdeaPayload.submittedAt).toBe(12345)
    const retryKey = 'same-event-write-key'
    const retryInput = {
      idempotencyKey: retryKey,
      eventId,
      expectedVersion: 4,
      changes: { title: 'Stable retry' },
    }
    await service.call('update_event', retryInput, actor)
    const retryMutationId = calls.mutations.at(-1)!.id
    await service.call('update_event', retryInput, actor)
    expect(calls.mutations.at(-1)!.id).toBe(retryMutationId)
    await expect(
      service.call('update_event', { ...retryInput, changes: { title: 'Changed request' } }, actor)
    ).rejects.toMatchObject({ code: 'WRITE_REJECTED' })
    expect(calls.mutations.at(-1)!.id).toBe(retryMutationId)
  })

  it('rejects cross-event idea IDs, non-root event updates, stale versions, and arbitrary fields', async () => {
    const { value } = port({ isRootEvent: async () => false })
    const service = createMcpContentService(value)
    await expect(
      service.call(
        'update_event',
        {
          idempotencyKey: 'request-event-edit',
          eventId,
          expectedVersion: 4,
          changes: { title: 'Updated camp' },
        },
        actor
      )
    ).rejects.toMatchObject({ code: 'WRITE_REJECTED' })
    await expect(
      service.call(
        'update_idea',
        {
          idempotencyKey: 'request-idea-edit',
          eventId,
          ideaId: '30000000-0000-4000-8000-000000000001',
          expectedVersion: 1,
          changes: { title: 'Other event idea' },
        },
        actor
      )
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    const rootService = createMcpContentService(port().value)
    await expect(
      rootService.call(
        'update_event',
        {
          idempotencyKey: 'request-event-edit',
          eventId,
          expectedVersion: 3,
          changes: { title: 'Stale edit' },
        },
        actor
      )
    ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' })
    await expect(
      service.call(
        'create_idea',
        {
          idempotencyKey: 'request-idea-new',
          eventId,
          title: 'Hike',
          category: 'event',
          submittedByUserId: 'forged',
        },
        actor
      )
    ).rejects.toThrow()
  })

  it('clears native idea notes as an empty string and preserves submission metadata', async () => {
    const { value, calls } = port()
    const service = createMcpContentService(value)
    await service.call(
      'update_idea',
      {
        idempotencyKey: 'request-clear-idea-note',
        eventId,
        ideaId,
        expectedVersion: 2,
        changes: { note: null },
      },
      actor
    )

    const payload = JSON.parse(Buffer.from(calls.mutations[0]!.payload, 'base64').toString('utf8'))
    expect(payload.note).toBe('')
    expect(payload.submittedBy).toBe('Original planner')
    expect(payload.submittedByUserID).toBe('other-account')
    expect(payload.submittedAt).toBe(12345)
  })

  it('lists accessible scoped events without exposing their parent event IDs', async () => {
    const childId = '30000000-0000-4000-8000-000000000001'
    const { value } = port({
      bootstrap: async () => {
        const data = fixture()
        data.snapshots.push({
          scopeID: childId,
          payloadSchemaVersion: 1,
          payload: encode({
            mainEventID: childId,
            title: 'Cabin Saturday',
            mainEventStartsAt: 800000000,
            mainEventIsAllDay: false,
            mainEventTimeZoneIdentifier: 'America/Detroit',
            mainEventLocation: {},
            isScopedEvent: true,
            parentEventID: eventId,
          }),
          serverVersion: 1,
          updatedAt: '2026-01-01T00:00:00Z',
        })
        return data
      },
      isRootEvent: async () => {
        throw new Error('list_events should rely on the actor scoped bootstrap')
      },
    })
    const listed = (await createMcpContentService(value).call('list_events', {}, actor)) as {
      items: Array<Record<string, unknown>>
    }

    const child = listed.items.find((item) => item.id === childId)
    expect(child).toMatchObject({ id: childId, title: 'Cabin Saturday', isScopedEvent: true })
    expect(child).not.toHaveProperty('parentEventID')
    expect(child).not.toHaveProperty('parentEventId')
  })
})

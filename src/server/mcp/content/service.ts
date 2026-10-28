import { createHash } from 'node:crypto'
import {
  MCP_CONTENT_TOOL_SCHEMAS,
  type McpContentActor,
  type McpContentToolName,
  McpCreateEventInputSchema,
  McpCreateIdeaInputSchema,
  McpGetEventInputSchema,
  McpListEventsInputSchema,
  McpListIdeasInputSchema,
  McpUpdateEventInputSchema,
  McpUpdateIdeaInputSchema,
} from './contracts'
import type { EventPermissions } from '@/lib/permissions'
import type {
  NativeMutation,
  NativePushResult,
  NativeWorkspaceSnapshots,
} from '@/server/sync/contracts/native-sync.contracts'

const APPLE_REFERENCE_EPOCH_SECONDS = Date.UTC(2001, 0, 1) / 1_000
const PAGE_SIZE_MAX = 50

export class McpContentError extends Error {
  constructor(
    readonly code:
      'NOT_FOUND' | 'VERSION_CONFLICT' | 'WRITE_REJECTED' | 'INVALID_CURSOR' | 'INVALID_INPUT',
    message: string
  ) {
    super(message)
    this.name = 'McpContentError'
  }
}

export type McpContentPort = {
  bootstrap(userId: string): Promise<NativeWorkspaceSnapshots>
  push(input: {
    userId: string
    mutation: NativeMutation
    fingerprint: string
  }): Promise<NativePushResult>
  authorize(userId: string, eventId: string, permissions: EventPermissions): Promise<void>
  isRootEvent(userId: string, eventId: string): Promise<boolean>
}

export const MCP_CONTENT_TOOLS = [
  {
    name: 'list_events',
    description:
      'List events you can access. Use this first to avoid creating a duplicate event; follow nextCursor until it is null.',
    inputSchema: MCP_CONTENT_TOOL_SCHEMAS.list_events,
    readOnly: true,
  },
  {
    name: 'get_event',
    description:
      'Read the current details and version of one event you can access before making changes.',
    inputSchema: MCP_CONTENT_TOOL_SCHEMAS.get_event,
    readOnly: true,
  },
  {
    name: 'list_ideas',
    description:
      'List ideas for an event you can access. Preserve unscheduled or alternative options as ideas instead of scheduling them.',
    inputSchema: MCP_CONTENT_TOOL_SCHEMAS.list_ideas,
    readOnly: true,
  },
  {
    name: 'create_event',
    description:
      'Create a main Gatherory event. Use confirmed dates and an IANA time zone; do not invent dates, attendees, or commitments. Retain relevant source attribution in the description or notes.',
    inputSchema: MCP_CONTENT_TOOL_SCHEMAS.create_event,
    readOnly: false,
  },
  {
    name: 'update_event',
    description:
      'Update selected details on a main event you can manage. Read it first and pass its latest version as expectedVersion.',
    inputSchema: MCP_CONTENT_TOOL_SCHEMAS.update_event,
    readOnly: false,
  },
  {
    name: 'create_idea',
    description:
      'Add an unscheduled option, alternative, or idea to an event you can help plan. Do not use this to claim a registration or commitment.',
    inputSchema: MCP_CONTENT_TOOL_SCHEMAS.create_idea,
    readOnly: false,
  },
  {
    name: 'update_idea',
    description:
      'Update an idea in an event you can help plan. Read it first and pass its latest version as expectedVersion.',
    inputSchema: MCP_CONTENT_TOOL_SCHEMAS.update_idea,
    readOnly: false,
  },
] as const

type Snapshot = NativeWorkspaceSnapshots['snapshots'][number]
type Entity = NativeWorkspaceSnapshots['entities'][number]
type EventView = {
  id: string
  isScopedEvent: boolean
  title: string
  description: string | null
  startsAt: string | null
  endsAt: string | null
  isAllDay: boolean
  timeZone: string
  locationName: string | null
  locationAddress: string | null
  version: number
}
type IdeaView = {
  id: string
  eventId: string
  title: string | null
  category: string
  note: string | null
  version: number
}

function decodePayload(payload: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    return isRecord(value) ? value : {}
  } catch {
    return {}
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function appleDate(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const date = new Date((value + APPLE_REFERENCE_EPOCH_SECONDS) * 1_000)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function nativeDate(value: string): number {
  return new Date(value).getTime() / 1_000 - APPLE_REFERENCE_EPOCH_SECONDS
}

function decodeEvent(snapshot: Snapshot): EventView | null {
  const payload = decodePayload(snapshot.payload)
  const id = typeof payload.mainEventID === 'string' ? payload.mainEventID.toLowerCase() : ''
  if (!id || id !== snapshot.scopeID.toLowerCase()) return null
  const location = isRecord(payload.mainEventLocation) ? payload.mainEventLocation : {}
  return {
    id,
    isScopedEvent: payload.isScopedEvent === true,
    title: typeof payload.title === 'string' ? payload.title : '',
    description: typeof payload.eventMessage === 'string' ? payload.eventMessage : null,
    startsAt: appleDate(payload.mainEventStartsAt),
    endsAt: appleDate(payload.mainEventEndsAt),
    isAllDay: payload.mainEventIsAllDay === true,
    timeZone:
      typeof payload.mainEventTimeZoneIdentifier === 'string'
        ? payload.mainEventTimeZoneIdentifier
        : 'UTC',
    locationName: textOrNull(location.locationName ?? location.placeName),
    locationAddress: textOrNull(location.address),
    version: snapshot.serverVersion,
  }
}

function decodeIdea(entity: Entity): IdeaView | null {
  if (entity.entityType !== 'idea') return null
  const payload = decodePayload(entity.payload)
  const eventId = typeof payload.eventID === 'string' ? payload.eventID.toLowerCase() : ''
  if (!eventId) return null
  return {
    id: entity.entityID.toLowerCase(),
    eventId,
    title: textOrNull(payload.title),
    category: typeof payload.category === 'string' ? payload.category : 'other',
    note: textOrNull(payload.note),
    version: entity.serverVersion,
  }
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length ? value : null
}

function isClosed(payload: Record<string, unknown>): boolean {
  if (payload.mainEventStatus === 'finished' || payload.mainEventStatus === 'cancelled') return true
  const scoped = isRecord(payload.scopedEvent) ? payload.scopedEvent : null
  return scoped?.status === 'archived' || scoped?.status === 'cancelled'
}

function cursorOffset(cursor: string | undefined): number {
  if (!cursor) return 0
  try {
    const value = Number(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (Number.isSafeInteger(value) && value >= 0) return value
  } catch {
    // The common error below keeps cursor failures stable for MCP clients.
  }
  throw new McpContentError('INVALID_CURSOR', 'The page cursor is invalid.')
}

function page<T>(items: T[], limit: number, cursor?: string) {
  const offset = cursorOffset(cursor)
  const values = items.slice(offset, offset + Math.min(limit, PAGE_SIZE_MAX))
  const next = offset + values.length
  return {
    items: values,
    nextCursor: next < items.length ? Buffer.from(String(next)).toString('base64url') : null,
  }
}

function stableJSON(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJSON).join(',')}]`
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJSON(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function uuidFrom(namespace: string, value: unknown): string {
  const bytes = createHash('sha256')
    .update(namespace)
    .update('\0')
    .update(stableJSON(value))
    .digest()
    .subarray(0, 16)
  bytes[6] = (bytes[6]! & 0x0f) | 0x50
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function nativeMutation(input: {
  userId: string
  requestKey: string
  toolName: string
  operation: 'create' | 'update'
  entityType: NativeMutation['entityType']
  scopeId: string
  entityId: string
  baseVersion: number
  payload: Record<string, unknown>
}): NativeMutation {
  const fingerprint = stableJSON(input.payload)
  return {
    id: uuidFrom(`mcp-mutation:${input.userId}:${input.toolName}:${input.requestKey}`, 'v1'),
    scopeID: input.scopeId,
    payloadSchemaVersion: 1,
    entityType: input.entityType,
    entityID: input.entityId,
    operation: input.operation,
    payload: Buffer.from(fingerprint).toString('base64'),
    baseVersion: input.baseVersion,
    createdAt: new Date().toISOString(),
    attemptCount: 0,
  }
}

function requestFingerprint(userId: string, toolName: string, input: unknown): string {
  return createHash('sha256')
    .update(userId)
    .update('\0')
    .update(toolName)
    .update('\0')
    .update(stableJSON(input))
    .digest('hex')
}

function eventChangesToNative(changes: Record<string, unknown>, current: Record<string, unknown>) {
  const next = { ...current }
  if ('title' in changes) next.title = changes.title
  if ('description' in changes) next.eventMessage = changes.description ?? ''
  if ('startsAt' in changes && changes.startsAt)
    next.mainEventStartsAt = nativeDate(changes.startsAt as string)
  if ('endsAt' in changes)
    next.mainEventEndsAt = changes.endsAt ? nativeDate(changes.endsAt as string) : null
  if ('timeZone' in changes) next.mainEventTimeZoneIdentifier = changes.timeZone
  if ('isAllDay' in changes) next.mainEventIsAllDay = changes.isAllDay
  if ('locationName' in changes || 'locationAddress' in changes) {
    const old = isRecord(next.mainEventLocation) ? next.mainEventLocation : {}
    next.mainEventLocation = {
      ...old,
      ...(Object.hasOwn(changes, 'locationName')
        ? { locationName: changes.locationName ?? '' }
        : {}),
      ...(Object.hasOwn(changes, 'locationAddress')
        ? { address: changes.locationAddress ?? '' }
        : {}),
    }
  }
  return next
}

function assertMutationApplied(result: NativePushResult) {
  if (result.disposition === 'applied' || result.disposition === 'duplicate') return result
  if (result.failureCode === 'MCP_IDEMPOTENCY_KEY_REUSED')
    throw new McpContentError(
      'WRITE_REJECTED',
      'This idempotency key was already used for different arguments. Use a new key.'
    )
  if (result.disposition === 'conflict')
    throw new McpContentError(
      'VERSION_CONFLICT',
      'The event or idea changed since it was read. Read it again and retry with the current version and a new idempotency key.'
    )
  throw new McpContentError(
    'WRITE_REJECTED',
    'The change was rejected by event access or planning rules.'
  )
}

export function createMcpContentService(port: McpContentPort) {
  async function events(userId: string) {
    const data = await port.bootstrap(userId)
    return data.snapshots.flatMap((snapshot) => {
      const item = decodeEvent(snapshot)
      return item ? [item] : []
    })
  }

  return {
    async call(
      name: McpContentToolName,
      rawInput: unknown,
      actor: McpContentActor
    ): Promise<unknown> {
      if (!actor.userId)
        throw new McpContentError('WRITE_REJECTED', 'An authenticated account is required.')
      switch (name) {
        case 'list_events': {
          const input = McpListEventsInputSchema.parse(rawInput)
          const items = await events(actor.userId)
          return page(
            items.sort(
              (a, b) =>
                (a.startsAt ?? '').localeCompare(b.startsAt ?? '') || a.id.localeCompare(b.id)
            ),
            input.limit,
            input.cursor
          )
        }
        case 'get_event': {
          const input = McpGetEventInputSchema.parse(rawInput)
          await port.authorize(actor.userId, input.eventId.toLowerCase(), { event: ['read'] })
          const item = (await events(actor.userId)).find(
            (event) => event.id === input.eventId.toLowerCase()
          )
          if (!item) throw new McpContentError('NOT_FOUND', 'Event not found.')
          return item
        }
        case 'list_ideas': {
          const input = McpListIdeasInputSchema.parse(rawInput)
          await port.authorize(actor.userId, input.eventId.toLowerCase(), { idea: ['read'] })
          const data = await port.bootstrap(actor.userId)
          const items = data.entities
            .flatMap((entity) => {
              const item = decodeIdea(entity)
              return item && item.eventId === input.eventId.toLowerCase() ? [item] : []
            })
            .sort((a, b) => a.id.localeCompare(b.id))
          return page(items, input.limit, input.cursor)
        }
        case 'create_event': {
          const input = McpCreateEventInputSchema.parse(rawInput)
          const scopeId = uuidFrom(`mcp-event:${actor.userId}`, input.idempotencyKey)
          const personId = uuidFrom(`mcp-event-person:${actor.userId}`, input.idempotencyKey)
          const participationId = uuidFrom(
            `mcp-event-participant:${actor.userId}`,
            input.idempotencyKey
          )
          const payload = {
            mainEventID: scopeId,
            title: input.title,
            eventMessage: input.description ?? '',
            mainEventStartsAt: nativeDate(input.startsAt),
            mainEventEndsAt: input.endsAt ? nativeDate(input.endsAt) : null,
            mainEventIsAllDay: input.isAllDay,
            mainEventTimeZoneIdentifier: input.timeZone,
            mainEventLocation: {
              locationName: input.locationName ?? '',
              address: input.locationAddress ?? '',
              shortAddress: '',
              placeName: '',
              addressLine2: '',
              latitude: null,
              longitude: null,
              mapItemIdentifier: null,
            },
            mainEventStatus: 'draft',
            mainEventResponse: 'going',
            venueName: '',
            location: '',
            dressCode: '',
            planningMode: 'openToIdeas',
            members: [
              {
                id: personId,
                userID: actor.userId,
                name: 'Host',
                participantRole: 'host',
                initials: 'H',
                attendance: 'going',
                planningPermission: 'manage',
                invitationStatus: 'active',
              },
            ],
            eventParticipations: [
              {
                id: participationId,
                eventID: scopeId,
                memberID: personId,
                role: 'host',
                planningPermission: 'manage',
                attendance: 'going',
                invitationStatus: 'active',
                createdAt: nativeDate(new Date().toISOString()),
                updatedAt: nativeDate(new Date().toISOString()),
              },
            ],
            mainEventParticipantIDs: [personId],
            ideas: [],
            timeline: [],
            eventExpenses: [],
            workspaceBudgetCap: null,
            currencyCode: 'USD',
            mainEventBudgetCap: null,
            notes: [],
            todos: [],
            ideaResponses: [],
            eventMoments: [],
            guides: [],
            isMainEventDeleted: false,
            registry: [],
            isRegistryShared: false,
            isCollaboratorLinkEnabled: true,
            requiresCollaboratorApproval: true,
            defaultCollaboratorPermission: 'contribute',
            isScopedEvent: false,
          }
          const mutation = nativeMutation({
            userId: actor.userId,
            requestKey: input.idempotencyKey,
            toolName: name,
            operation: 'create',
            entityType: 'workspace',
            scopeId,
            entityId: scopeId,
            baseVersion: 0,
            payload,
          })
          const result = assertMutationApplied(
            await port.push({
              userId: actor.userId,
              mutation,
              fingerprint: requestFingerprint(actor.userId, name, {
                title: input.title,
                description: input.description ?? null,
                startsAt: input.startsAt,
                endsAt: input.endsAt ?? null,
                isAllDay: input.isAllDay,
                timeZone: input.timeZone,
                locationName: input.locationName ?? null,
                locationAddress: input.locationAddress ?? null,
              }),
            })
          )
          return { id: scopeId, title: input.title, version: result.serverVersion ?? 1 }
        }
        case 'update_event': {
          const input = McpUpdateEventInputSchema.parse(rawInput)
          await port.authorize(actor.userId, input.eventId.toLowerCase(), { event: ['update'] })
          if (!(await port.isRootEvent(actor.userId, input.eventId.toLowerCase())))
            throw new McpContentError(
              'WRITE_REJECTED',
              'Only main events can be updated through this tool.'
            )
          const data = await port.bootstrap(actor.userId)
          const snapshot = data.snapshots.find(
            (item) => item.scopeID === input.eventId.toLowerCase()
          )
          if (!snapshot) throw new McpContentError('NOT_FOUND', 'Event not found.')
          const current = decodePayload(snapshot.payload)
          if (isClosed(current))
            throw new McpContentError('WRITE_REJECTED', 'This event is closed to planning changes.')
          const nextStart = input.changes.startsAt ?? appleDate(current.mainEventStartsAt)
          const nextEnd = Object.hasOwn(input.changes, 'endsAt')
            ? input.changes.endsAt
            : appleDate(current.mainEventEndsAt)
          if (nextEnd && nextStart && Date.parse(nextEnd) < Date.parse(nextStart))
            throw new McpContentError('INVALID_INPUT', 'The event end must be after its start.')
          const payload = eventChangesToNative(input.changes, current)
          const mutation = nativeMutation({
            userId: actor.userId,
            requestKey: input.idempotencyKey,
            toolName: name,
            operation: 'update',
            entityType: 'workspace',
            scopeId: input.eventId.toLowerCase(),
            entityId: input.eventId.toLowerCase(),
            baseVersion: input.expectedVersion,
            payload,
          })
          const result = assertMutationApplied(
            await port.push({
              userId: actor.userId,
              mutation,
              fingerprint: requestFingerprint(actor.userId, name, {
                eventId: input.eventId.toLowerCase(),
                expectedVersion: input.expectedVersion,
                changes: input.changes,
              }),
            })
          )
          return { id: input.eventId.toLowerCase(), version: result.serverVersion }
        }
        case 'create_idea': {
          const input = McpCreateIdeaInputSchema.parse(rawInput)
          const eventId = input.eventId.toLowerCase()
          await port.authorize(actor.userId, eventId, { idea: ['create'] })
          const data = await port.bootstrap(actor.userId)
          const eventSnapshot = data.snapshots.find((item) => item.scopeID === eventId)
          if (!eventSnapshot) throw new McpContentError('NOT_FOUND', 'Event not found.')
          const eventPayload = decodePayload(eventSnapshot.payload)
          if (isClosed(eventPayload))
            throw new McpContentError('WRITE_REJECTED', 'This event is closed to planning changes.')
          const ideaId = uuidFrom(`mcp-idea:${actor.userId}`, input.idempotencyKey)
          const payload = {
            id: ideaId,
            eventID: eventId,
            title: input.title,
            submittedBy: 'Planner',
            submittedByUserID: actor.userId,
            submittedAt: nativeDate(new Date().toISOString()),
            category: input.category,
            note: input.note ?? '',
            status: 'new',
            configuration: { standard: {} },
          }
          const mutation = nativeMutation({
            userId: actor.userId,
            requestKey: input.idempotencyKey,
            toolName: name,
            operation: 'create',
            entityType: 'idea',
            scopeId: eventId,
            entityId: ideaId,
            baseVersion: 0,
            payload,
          })
          const result = assertMutationApplied(
            await port.push({
              userId: actor.userId,
              mutation,
              fingerprint: requestFingerprint(actor.userId, name, {
                eventId,
                title: input.title,
                category: input.category,
                note: input.note ?? null,
              }),
            })
          )
          return {
            id: ideaId,
            eventId,
            title: input.title,
            category: input.category,
            note: input.note ?? null,
            version: result.serverVersion ?? 1,
          }
        }
        case 'update_idea': {
          const input = McpUpdateIdeaInputSchema.parse(rawInput)
          const eventId = input.eventId.toLowerCase()
          await port.authorize(actor.userId, eventId, { idea: ['update'] })
          const data = await port.bootstrap(actor.userId)
          const eventSnapshot = data.snapshots.find((item) => item.scopeID === eventId)
          if (!eventSnapshot) throw new McpContentError('NOT_FOUND', 'Event not found.')
          if (isClosed(decodePayload(eventSnapshot.payload)))
            throw new McpContentError('WRITE_REJECTED', 'This event is closed to planning changes.')
          const entity = data.entities.find(
            (item) => item.entityType === 'idea' && item.entityID === input.ideaId.toLowerCase()
          )
          const current = entity && decodeIdea(entity)
          if (!current || current.eventId !== eventId)
            throw new McpContentError('NOT_FOUND', 'Idea not found.')
          const normalizedChanges = {
            ...input.changes,
            ...(Object.hasOwn(input.changes, 'note') ? { note: input.changes.note ?? '' } : {}),
          }
          const payload = {
            ...decodePayload(entity!.payload),
            ...normalizedChanges,
            id: current.id,
            eventID: eventId,
          }
          const mutation = nativeMutation({
            userId: actor.userId,
            requestKey: input.idempotencyKey,
            toolName: name,
            operation: 'update',
            entityType: 'idea',
            scopeId: eventId,
            entityId: current.id,
            baseVersion: input.expectedVersion,
            payload,
          })
          const result = assertMutationApplied(
            await port.push({
              userId: actor.userId,
              mutation,
              fingerprint: requestFingerprint(actor.userId, name, {
                eventId,
                ideaId: current.id,
                expectedVersion: input.expectedVersion,
                changes: input.changes,
              }),
            })
          )
          return { ...current, ...input.changes, version: result.serverVersion }
        }
      }
    },
  }
}

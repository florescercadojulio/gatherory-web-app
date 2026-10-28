import type { EventPermissions } from '@/lib/permissions'
import type {
  NativeMutation,
  NativePushResult,
  NativeWorkspaceSnapshots,
} from '@/server/sync/contracts/native-sync.contracts'
import {
  CreateChildEventInputSchema,
  ListChildEventsInputSchema,
  UpdateChildEventInputSchema,
} from './contracts'
import {
  assertMcpApplied,
  decodeMcpPayload,
  fromNativeDate,
  makeMcpMutation,
  mcpEntityId,
  mcpPage,
  McpMutationError,
  toNativeDate,
} from '../mutations'
import { assertConfirmedSchedule } from '@/server/blueprints/planning/confirmed-schedule.server'

export type McpChildEventsPort = {
  bootstrap(userId: string): Promise<NativeWorkspaceSnapshots>
  push(input: {
    userId: string
    mutation: NativeMutation
    fingerprint: string
  }): Promise<NativePushResult>
  authorize(userId: string, eventId: string, permissions: EventPermissions): Promise<void>
  isRootEvent(userId: string, eventId: string): Promise<boolean>
}

export const MCP_CHILD_EVENT_TOOLS = [
  {
    name: 'list_child_events',
    description:
      'List scheduled child events directly under a main event. Follow nextCursor until it is null.',
    inputSchema: ListChildEventsInputSchema,
    readOnly: true,
  },
  {
    name: 'create_child_event',
    description:
      'Schedule a confirmed selected session or activity under a main event. Use purpose=eventExperience for selected timed sessions; keep alternatives, optional items, and unscheduled choices as ideas. Provide a confirmed timestamp and its IANA time zone; do not invent missing schedule or location details.',
    inputSchema: CreateChildEventInputSchema,
    readOnly: false,
  },
  {
    name: 'update_child_event',
    description:
      'Update a scheduled child event under a main event. Read it first and pass its latest version as expectedVersion.',
    inputSchema: UpdateChildEventInputSchema,
    readOnly: false,
  },
] as const

type NativeEntity = NativeWorkspaceSnapshots['entities'][number]
type ChildView = {
  id: string
  parentEventId: string
  title: string
  category: string
  purpose: string
  description: string | null
  startsAt: string | null
  endsAt: string | null
  isAllDay: boolean
  timeZone: string
  locationName: string | null
  locationAddress: string | null
  version: number
}

const decode = (entity: NativeEntity) => decodeMcpPayload(entity.payload)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function childView(entity: NativeEntity): ChildView | null {
  if (entity.entityType !== 'event') return null
  const payload = decode(entity)
  const id = typeof payload.id === 'string' ? payload.id.toLowerCase() : ''
  const parentEventId =
    typeof payload.parentEventID === 'string' ? payload.parentEventID.toLowerCase() : ''
  if (!id || id !== entity.entityID.toLowerCase() || !parentEventId) return null
  const location = isRecord(payload.eventLocation) ? payload.eventLocation : {}
  const scheduledAt =
    typeof payload.scheduledAt === 'number'
      ? fromNativeDate(payload.scheduledAt)
      : payload.schedulingState === 'unscheduled'
        ? null
        : null
  return {
    id,
    parentEventId,
    title: typeof payload.title === 'string' ? payload.title : '',
    category: typeof payload.category === 'string' ? payload.category : 'other',
    purpose: typeof payload.purpose === 'string' ? payload.purpose : 'planning',
    description: textOrNull(payload.eventDescription),
    startsAt: scheduledAt,
    endsAt: typeof payload.endsAt === 'number' ? fromNativeDate(payload.endsAt) : null,
    isAllDay: payload.isAllDay === true,
    timeZone: typeof payload.timeZoneIdentifier === 'string' ? payload.timeZoneIdentifier : 'UTC',
    locationName: textOrNull(location.locationName),
    locationAddress: textOrNull(location.address),
    version: entity.serverVersion,
  }
}

function isClosed(payload: Record<string, unknown>) {
  return (
    ['finished', 'cancelled'].includes(String(payload.mainEventStatus ?? '')) ||
    payload.isMainEventDeleted === true
  )
}

function assertValidInterval(startsAt: string | undefined, endsAt: string | null | undefined) {
  if (startsAt && endsAt && Date.parse(endsAt) < Date.parse(startsAt))
    throw new McpMutationError('INVALID_INPUT', 'The event end must be after its start.')
}

function assertSchedule(
  startsAt: string | undefined,
  endsAt: string | null | undefined,
  timeZone: string
) {
  try {
    if (startsAt) assertConfirmedSchedule(startsAt, timeZone)
    if (endsAt) assertConfirmedSchedule(endsAt, timeZone)
  } catch (error) {
    throw new McpMutationError(
      'INVALID_INPUT',
      error instanceof Error
        ? error.message
        : 'The confirmed time must agree with the event time zone.'
    )
  }
}

function nativeLocation(current: unknown, changes: Record<string, unknown>) {
  const previous = isRecord(current) ? current : {}
  return {
    locationName: Object.hasOwn(changes, 'locationName')
      ? (changes.locationName ?? '')
      : (previous.locationName ?? ''),
    placeName: previous.placeName ?? '',
    shortAddress: previous.shortAddress ?? '',
    address: Object.hasOwn(changes, 'locationAddress')
      ? (changes.locationAddress ?? '')
      : (previous.address ?? ''),
    addressLine2: previous.addressLine2 ?? '',
    latitude: previous.latitude ?? null,
    longitude: previous.longitude ?? null,
    mapItemIdentifier: previous.mapItemIdentifier ?? null,
  }
}

function applyChanges(current: Record<string, unknown>, changes: Record<string, unknown>) {
  const next = { ...current }
  if (Object.hasOwn(changes, 'title')) next.title = changes.title
  if (Object.hasOwn(changes, 'category')) next.category = changes.category
  if (Object.hasOwn(changes, 'purpose')) next.purpose = changes.purpose
  if (Object.hasOwn(changes, 'description')) next.eventDescription = changes.description ?? ''
  if (Object.hasOwn(changes, 'startsAt'))
    next.scheduledAt = toNativeDate(changes.startsAt as string)
  if (Object.hasOwn(changes, 'endsAt'))
    next.endsAt = changes.endsAt ? toNativeDate(changes.endsAt as string) : null
  if (Object.hasOwn(changes, 'timeZone')) next.timeZoneIdentifier = changes.timeZone
  if (Object.hasOwn(changes, 'isAllDay')) next.isAllDay = changes.isAllDay
  if (Object.hasOwn(changes, 'locationName') || Object.hasOwn(changes, 'locationAddress'))
    next.eventLocation = nativeLocation(next.eventLocation, changes)
  return next
}

export function createMcpChildEventsService(port: McpChildEventsPort) {
  return {
    async call(
      name: keyof typeof import('./contracts').MCP_CHILD_EVENT_SCHEMAS,
      rawInput: unknown,
      actor: { userId: string }
    ) {
      switch (name) {
        case 'list_child_events': {
          const input = ListChildEventsInputSchema.parse(rawInput)
          const parentEventId = input.parentEventId.toLowerCase()
          await port.authorize(actor.userId, parentEventId, { event: ['read'] })
          if (!(await port.isRootEvent(actor.userId, parentEventId)))
            throw new McpMutationError('NOT_FOUND', 'Main event not found.')
          const data = await port.bootstrap(actor.userId)
          const items = data.entities
            .flatMap((entity) => {
              const item = childView(entity)
              return item?.parentEventId === parentEventId ? [item] : []
            })
            .sort(
              (a, b) =>
                (a.startsAt ?? '').localeCompare(b.startsAt ?? '') || a.id.localeCompare(b.id)
            )
          return mcpPage(items, input.limit, input.cursor)
        }
        case 'create_child_event': {
          const input = CreateChildEventInputSchema.parse(rawInput)
          const parentEventId = input.parentEventId.toLowerCase()
          await port.authorize(actor.userId, parentEventId, { event: ['create_child'] })
          if (!(await port.isRootEvent(actor.userId, parentEventId)))
            throw new McpMutationError(
              'WRITE_REJECTED',
              'Child events require a main event parent.'
            )
          assertValidInterval(input.startsAt, input.endsAt)
          assertSchedule(input.startsAt, input.endsAt, input.timeZone)
          const data = await port.bootstrap(actor.userId)
          const parent = data.snapshots.find(
            (snapshot) => snapshot.scopeID.toLowerCase() === parentEventId
          )
          if (!parent) throw new McpMutationError('NOT_FOUND', 'Main event not found.')
          const parentPayload = decodeMcpPayload(parent.payload)
          if (isClosed(parentPayload))
            throw new McpMutationError(
              'WRITE_REJECTED',
              'This event is closed to planning changes.'
            )

          const childEventId = mcpEntityId(actor.userId, name, input.idempotencyKey, 'child-event')
          const payload = {
            id: childEventId,
            title: input.title,
            category: input.category,
            purpose: input.purpose,
            scheduledAt: toNativeDate(input.startsAt),
            schedulingState: 'scheduled',
            endsAt: input.endsAt ? toNativeDate(input.endsAt) : null,
            isAllDay: input.isAllDay,
            timeZoneIdentifier: input.timeZone,
            eventLocation: {
              locationName: input.locationName ?? '',
              placeName: '',
              shortAddress: '',
              address: input.locationAddress ?? '',
              addressLine2: '',
              latitude: null,
              longitude: null,
              mapItemIdentifier: null,
            },
            participantIDs: [],
            parentEventID: parentEventId,
            status: 'approved',
            completionStatus: 'upcoming',
            response: null,
            linkedIdeaID: null,
            imageData: null,
            mediaAssetID: null,
            eventDescription: input.description ?? '',
            dressCode: '',
            budgetCap: null,
          }
          const { mutation, fingerprint } = makeMcpMutation({
            userId: actor.userId,
            toolName: name,
            idempotencyKey: input.idempotencyKey,
            scopeId: parentEventId,
            entityId: childEventId,
            entityType: 'event',
            operation: 'create',
            expectedVersion: 0,
            payload,
            requestInput: { ...input, parentEventId },
          })
          const result = assertMcpApplied(
            await port.push({ userId: actor.userId, mutation, fingerprint })
          )
          return {
            id: childEventId,
            parentEventId,
            title: input.title,
            startsAt: input.startsAt,
            endsAt: input.endsAt ?? null,
            version: result.serverVersion ?? 1,
          }
        }
        case 'update_child_event': {
          const input = UpdateChildEventInputSchema.parse(rawInput)
          const parentEventId = input.parentEventId.toLowerCase()
          const childEventId = input.childEventId.toLowerCase()
          if (!(await port.isRootEvent(actor.userId, parentEventId)))
            throw new McpMutationError('NOT_FOUND', 'Main event not found.')
          const data = await port.bootstrap(actor.userId)
          const entity = data.entities.find(
            (item) =>
              item.entityType === 'event' &&
              item.entityID.toLowerCase() === childEventId &&
              item.scopeID.toLowerCase() === parentEventId
          )
          const currentView = entity && childView(entity)
          if (!entity || !currentView || currentView.parentEventId !== parentEventId)
            throw new McpMutationError('NOT_FOUND', 'Child event not found.')
          await port.authorize(
            actor.userId,
            entity.scopeID.toLowerCase() === parentEventId ? parentEventId : childEventId,
            { event: ['update'] }
          )
          const parent = data.snapshots.find(
            (snapshot) => snapshot.scopeID.toLowerCase() === parentEventId
          )
          if (!parent) throw new McpMutationError('NOT_FOUND', 'Main event not found.')
          if (isClosed(decodeMcpPayload(parent.payload)))
            throw new McpMutationError(
              'WRITE_REJECTED',
              'This event is closed to planning changes.'
            )
          const current = decode(entity)
          const changes = input.changes as Record<string, unknown>
          const nextStartsAt =
            typeof changes.startsAt === 'string'
              ? changes.startsAt
              : (currentView.startsAt ?? undefined)
          const nextEndsAt = Object.hasOwn(changes, 'endsAt')
            ? (changes.endsAt as string | null | undefined)
            : currentView.endsAt
          assertValidInterval(nextStartsAt, nextEndsAt)
          const nextTimeZone =
            typeof changes.timeZone === 'string' ? changes.timeZone : currentView.timeZone
          assertSchedule(nextStartsAt, nextEndsAt, nextTimeZone)
          const payload = applyChanges(current, changes)
          const { mutation, fingerprint } = makeMcpMutation({
            userId: actor.userId,
            toolName: name,
            idempotencyKey: input.idempotencyKey,
            scopeId: parentEventId,
            entityId: childEventId,
            entityType: 'event',
            operation: 'update',
            expectedVersion: input.expectedVersion,
            payload,
            requestInput: {
              parentEventId,
              childEventId,
              expectedVersion: input.expectedVersion,
              changes: input.changes,
            },
          })
          const result = assertMcpApplied(
            await port.push({ userId: actor.userId, mutation, fingerprint })
          )
          return { ...currentView, ...input.changes, version: result.serverVersion }
        }
      }
    },
  }
}

import { createHash } from 'node:crypto'
import type {
  NativeMutation,
  NativePushResult,
} from '@/server/sync/contracts/native-sync.contracts'
import type { NativeWorkspaceSnapshots } from '@/server/sync/contracts/native-sync.contracts'

export class McpMutationError extends Error {
  constructor(
    readonly code:
      'NOT_FOUND' | 'INVALID_INPUT' | 'VERSION_CONFLICT' | 'WRITE_REJECTED' | 'INVALID_CURSOR',
    message: string
  ) {
    super(message)
    this.name = 'McpMutationError'
  }
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stableValue(item)])
    )
  return value
}

const stableJSON = (value: unknown) => JSON.stringify(stableValue(value))

export function mcpEntityId(
  userId: string,
  toolName: string,
  idempotencyKey: string,
  kind = 'entity'
) {
  const bytes = createHash('sha256')
    .update(stableJSON([userId, toolName, idempotencyKey, kind]))
    .digest()
    .subarray(0, 16)
  bytes[6] = (bytes[6]! & 0x0f) | 0x50
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function makeMcpMutation(input: {
  userId: string
  toolName: string
  idempotencyKey: string
  scopeId: string
  entityId: string
  entityType: NativeMutation['entityType']
  operation: 'create' | 'update'
  expectedVersion?: number
  payload: Record<string, unknown>
  requestInput: unknown
}) {
  const mutation: NativeMutation = {
    id: mcpEntityId(input.userId, input.toolName, input.idempotencyKey, 'mutation'),
    scopeID: input.scopeId,
    entityID: input.entityId,
    entityType: input.entityType,
    operation: input.operation,
    baseVersion: input.operation === 'create' ? 0 : (input.expectedVersion ?? null),
    payloadSchemaVersion: 1,
    payload: Buffer.from(JSON.stringify(input.payload)).toString('base64'),
    createdAt: new Date().toISOString(),
    attemptCount: 0,
  }
  const fingerprint = createHash('sha256')
    .update(stableJSON([input.userId, input.toolName, input.requestInput]))
    .digest('hex')
  return { mutation, fingerprint }
}

export function assertMcpApplied(result: NativePushResult) {
  if (result.disposition === 'applied' || result.disposition === 'duplicate') return result
  if (result.disposition === 'conflict')
    throw new McpMutationError(
      'VERSION_CONFLICT',
      'Read the latest version before retrying with a new idempotency key.'
    )
  throw new McpMutationError(
    'WRITE_REJECTED',
    'The operation was rejected by event permissions, lifecycle, or idempotency rules.'
  )
}

export function decodeMcpPayload(payload: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

const nativeEpoch = Date.UTC(2001, 0, 1) / 1000
export const toNativeDate = (iso: string) => Date.parse(iso) / 1000 - nativeEpoch
export function fromNativeDate(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const date = new Date((value + nativeEpoch) * 1000)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function mcpPage<T>(items: T[], limit: number, cursor?: string) {
  const decoded = cursor ? Buffer.from(cursor, 'base64url').toString() : '0'
  const offset = Number(decoded)
  if (!/^\d+$/.test(decoded) || !Number.isSafeInteger(offset) || offset < 0)
    throw new McpMutationError('INVALID_CURSOR', 'Invalid page cursor.')
  const values = items.slice(offset, offset + Math.min(limit, 50))
  const next = offset + values.length
  return {
    items: values,
    nextCursor: next < items.length ? Buffer.from(String(next)).toString('base64url') : null,
  }
}

/** Resolve only relationships already disclosed by the actor's authorized bootstrap. */
export function resolveMcpEventScope(data: NativeWorkspaceSnapshots, eventId: string) {
  const id = eventId.toLowerCase()
  const direct = data.snapshots.find((snapshot) => snapshot.scopeID.toLowerCase() === id)
  if (direct)
    return { scopeId: id, snapshot: direct, eventPayload: decodeMcpPayload(direct.payload) }
  const entity = data.entities.find(
    (item) => item.entityType === 'event' && item.entityID.toLowerCase() === id
  )
  if (entity) {
    const payload = decodeMcpPayload(entity.payload)
    const snapshot = data.snapshots.find(
      (item) => item.scopeID.toLowerCase() === entity.scopeID.toLowerCase()
    )
    if (
      snapshot &&
      typeof payload.parentEventID === 'string' &&
      payload.parentEventID.toLowerCase() === snapshot.scopeID.toLowerCase()
    ) {
      return { scopeId: snapshot.scopeID.toLowerCase(), snapshot, eventPayload: payload }
    }
  }
  throw new McpMutationError('NOT_FOUND', 'Event not found.')
}

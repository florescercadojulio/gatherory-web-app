import { z } from 'zod'

// Foundation encodes UUID values in uppercase while Postgres and payload
// materialization use canonical lowercase UUID strings. Normalize at the HTTP
// boundary so IDs from the envelope and IDs embedded in its payload compare
// identically.
const nativeUUIDSchema = z.uuid().transform((value) => value.toLowerCase())
export const nativeMutationOperationSchema = z.enum(['create', 'update', 'delete'])
export const nativeEntityTypeSchema = z.enum([
  'workspace',
  'event',
  'idea',
  'idea_response',
  'participant',
  'event_participation',
  'attendance',
  'expense',
  'registry_item',
  'note',
  'todo',
  'moment',
])

// Normalize only the known bad development value; unknown operations must fail
// at the server boundary rather than returning an undecodable successful page.
export function nativePullOperation(value: string) {
  return nativeMutationOperationSchema.parse(value === 'upsert' ? 'update' : value)
}

const mutationSchema = z.object({
  id: nativeUUIDSchema,
  scopeID: nativeUUIDSchema,
  payloadSchemaVersion: z.literal(1).default(1),
  entityType: nativeEntityTypeSchema,
  entityID: nativeUUIDSchema,
  operation: nativeMutationOperationSchema,
  payload: z.string().max(3_000_000),
  baseVersion: z.number().int().nonnegative().nullable().optional(),
  createdAt: z.iso.datetime(),
  attemptCount: z.number().int().nonnegative(),
})

export const pushRequestSchema = z.object({
  mutations: z.array(mutationSchema).min(1).max(50),
})

export type NativeMutation = z.infer<typeof mutationSchema>

export type NativePushResult = {
  mutationID: string
  disposition: 'applied' | 'duplicate' | 'conflict' | 'rejected'
  serverVersion: number | null
  failureCode: string | null
}

export type NativePullPage = {
  changes: Array<{
    id: string
    scopeID: string
    payloadSchemaVersion: 1
    entityType: string
    entityID: string
    operation: NativeMutation['operation']
    payload: string
    serverVersion: number
    occurredAt: string
  }>
  nextCursor: string
  hasMore: boolean
}

export type NativeWorkspaceSnapshots = {
  account: { hasCompletedOnboarding: boolean }
  snapshots: Array<{
    scopeID: string
    payloadSchemaVersion: 1
    payload: string
    serverVersion: number
    updatedAt: string
  }>
  entities: Array<{
    scopeID: string
    payloadSchemaVersion: 1
    entityType: string
    entityID: string
    payload: string
    serverVersion: number
    updatedAt: string
  }>
}

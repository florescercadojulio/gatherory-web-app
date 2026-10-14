import { expect, test } from 'vitest'

import { nativePullOperation, pushRequestSchema } from '@/server/sync/native-sync-contracts'

test('pull operations match iOS and repair existing invitation changes', () => {
  for (const operation of ['create', 'update', 'delete'])
    expect(nativePullOperation(operation)).toBe(operation)
  expect(nativePullOperation('upsert')).toBe('update')
  expect(() => nativePullOperation('unexpected')).toThrow()
})

test('native sync canonicalizes uppercase UUIDs sent by Foundation', () => {
  const workspaceID = '5CF54762-4A9A-49C3-B1E8-DF26D184AFBA'
  const result = pushRequestSchema.parse({
    mutations: [
      {
        id: 'B2A7345B-C4D4-42B6-BA01-913C31597E35',
        scopeID: workspaceID,
        entityType: 'workspace',
        entityID: workspaceID,
        operation: 'create',
        payload: 'e30=',
        createdAt: '2026-10-12T12:00:00Z',
        attemptCount: 0,
      },
    ],
  })

  const mutation = result.mutations[0]
  expect(mutation.id).toBe('b2a7345b-c4d4-42b6-ba01-913c31597e35')
  expect(mutation.scopeID).toBe('5cf54762-4a9a-49c3-b1e8-df26d184afba')
  expect(mutation.entityID).toBe('5cf54762-4a9a-49c3-b1e8-df26d184afba')
  expect(mutation.payloadSchemaVersion).toBe(1)
})

test('native sync rejects unsupported payload schema versions', () => {
  const workspaceID = '5CF54762-4A9A-49C3-B1E8-DF26D184AFBA'
  const result = pushRequestSchema.safeParse({
    mutations: [
      {
        id: 'B2A7345B-C4D4-42B6-BA01-913C31597E35',
        scopeID: workspaceID,
        payloadSchemaVersion: 2,
        entityType: 'workspace',
        entityID: workspaceID,
        operation: 'create',
        payload: 'e30=',
        createdAt: '2026-10-12T12:00:00Z',
        attemptCount: 0,
      },
    ],
  })

  expect(result.success).toBe(false)
})

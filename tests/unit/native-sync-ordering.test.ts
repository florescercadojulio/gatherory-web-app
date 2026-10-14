import { expect, test } from 'vitest'

import {
  compareNativeMutationOrder,
  type NativeSyncEntityType,
} from '@/server/sync/native-sync-ordering'

type NativeMutation = {
  id: string
  scopeID: string
  entityType: NativeSyncEntityType
  entityID: string
  operation: 'create' | 'update' | 'delete'
  payload: string
  createdAt: string
  attemptCount: number
}

function mutation(entityType: NativeSyncEntityType): NativeMutation {
  const scopeID = '0b6f5d9a-e25f-4c6f-98cf-21727f04e9b3'
  return {
    id: crypto.randomUUID(),
    scopeID,
    entityType,
    entityID: entityType === 'workspace' ? scopeID : crypto.randomUUID(),
    operation: 'create',
    payload: 'e30=',
    createdAt: '2026-10-12T12:00:00Z',
    attemptCount: 0,
  }
}

test('native sync establishes a workspace before dependent batch records', () => {
  const ordered = [
    mutation('idea'),
    mutation('event_participation'),
    mutation('event'),
    mutation('participant'),
    mutation('workspace'),
  ].sort(compareNativeMutationOrder)

  expect(ordered.map((entry) => entry.entityType)).toEqual([
    'workspace',
    'participant',
    'event',
    'idea',
    'event_participation',
  ])
})

test('native sync reverses dependency order when deleting a workspace', () => {
  const ordered = ['workspace', 'participant', 'event', 'idea', 'event_participation']
    .map((entityType) => ({
      ...mutation(entityType as NativeSyncEntityType),
      operation: 'delete' as const,
      payload: '',
    }))
    .sort(compareNativeMutationOrder)

  expect(ordered.map((entry) => entry.entityType)).toEqual([
    'event_participation',
    'idea',
    'event',
    'participant',
    'workspace',
  ])
})

import assert from 'node:assert/strict'
import { test } from 'vitest'
import { nativeIdentityWriteAllowed } from '@/server/sync/native-identity-access'

test('a contributor can RSVP without promoting themselves or other participants', () => {
  const personId = crypto.randomUUID(),
    eventId = crypto.randomUUID(),
    id = crypto.randomUUID()
  const actor = { personId, role: 'collaborator', planningPermission: 'contribute' }
  const participation = { ...actor, id, eventId }
  const body = {
    id,
    memberID: personId.toUpperCase(),
    eventID: eventId.toUpperCase(),
    role: 'collaborator',
    planningPermission: 'contribute',
    attendance: 'going',
  }
  const mutation = {
    id: crypto.randomUUID(),
    scopeID: eventId,
    entityID: id,
    entityType: 'event_participation' as const,
    operation: 'update' as const,
    payloadSchemaVersion: 1 as const,
    attemptCount: 0,
    createdAt: new Date().toISOString(),
    payload: Buffer.from(JSON.stringify(body)).toString('base64'),
  }
  assert.equal(nativeIdentityWriteAllowed({ actor, participation, mutation }), true)
  for (const patch of [
    { role: 'host' },
    { planningPermission: 'manage' },
    { memberID: crypto.randomUUID() },
    { invitationStatus: 'invited' },
  ]) {
    assert.equal(
      nativeIdentityWriteAllowed({
        actor,
        participation,
        mutation: {
          ...mutation,
          payload: Buffer.from(JSON.stringify({ ...body, ...patch })).toString('base64'),
        },
      }),
      false
    )
  }
  assert.equal(
    nativeIdentityWriteAllowed({
      actor,
      participation,
      mutation: { ...mutation, operation: 'delete' },
    }),
    false
  )
  assert.equal(
    nativeIdentityWriteAllowed({
      actor,
      participation,
      mutation: { ...mutation, entityType: 'participant', entityID: personId },
    }),
    true
  )
  assert.equal(
    nativeIdentityWriteAllowed({
      actor,
      participation,
      mutation: { ...mutation, entityType: 'participant', entityID: crypto.randomUUID() },
    }),
    false
  )
  assert.equal(
    nativeIdentityWriteAllowed({
      actor: { ...actor, planningPermission: 'manage' },
      participation,
      mutation,
    }),
    true
  )
})

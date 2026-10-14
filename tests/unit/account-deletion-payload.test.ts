import { expect, test } from 'vitest'
import {
  redactAccountPayload,
  type DeletionPayloadContext,
} from '@/server/auth/account-deletion-payload'

const context: DeletionPayloadContext = {
  userId: 'departing',
  personIds: new Set(['person-a']),
  mediaIds: new Set(['image-a']),
  scopeId: 'scope',
  successorPersonId: 'person-b',
}
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')
const redact = (value: unknown) =>
  JSON.parse(Buffer.from(redactAccountPayload(encode(value), context), 'base64').toString())

test('deletion payload removes identity and participant references, promotes the successor, and preserves shared plans', () => {
  const result = redact({
    members: [
      { id: 'PERSON-A', userID: 'departing', email: 'private@example.com' },
      {
        id: 'person-b',
        userID: 'remaining',
        participantRole: 'collaborator',
        planningPermission: 'contribute',
      },
    ],
    mainEventParticipantIDs: ['PERSON-A', 'person-b'],
    eventParticipations: [
      { memberID: 'PERSON-A', eventID: 'scope' },
      { memberID: 'person-b', eventID: 'scope', role: 'collaborator' },
    ],
    timeline: [{ id: 'child', participantIDs: ['PERSON-A', 'person-b'], title: 'Keep this event' }],
    ideas: [
      { submittedByUserID: 'departing', submittedBy: 'Private name', title: 'Keep this idea' },
    ],
    notes: [{ authorUserID: 'departing', body: 'Keep this note' }],
    futureModule: { enabled: true },
  })
  expect(result.members.length).toBe(1)
  expect(result.members[0].participantRole).toBe('host')
  expect(result.mainEventParticipantIDs).toEqual(['person-b'])
  expect(result.eventParticipations.length).toBe(1)
  expect(result.eventParticipations[0].role).toBe('host')
  expect(result.timeline[0].participantIDs).toEqual(['person-b'])
  expect(result.ideas[0]).toEqual({ submittedBy: '', title: 'Keep this idea' })
  expect(result.notes[0]).toEqual({ body: 'Keep this note' })
  expect(result.futureModule).toEqual({ enabled: true })
})

test("deleted media references and cached bytes are removed without affecting someone else's media", () => {
  const result = redact({
    mainEventMediaAssetID: 'IMAGE-A',
    mainEventImageData: 'private-bytes',
    ideas: [
      { mediaAssetID: 'IMAGE-A', imageData: 'private-bytes' },
      { mediaAssetID: 'image-b', imageData: 'keep' },
    ],
    eventMoments: [{ mediaAssetID: 'image-a', imageData: 'private-bytes', addedAt: 42 }],
  })
  expect(result.mainEventMediaAssetID).toBe(undefined)
  expect(result.mainEventImageData).toBe(undefined)
  expect(result.ideas).toEqual([{}, { mediaAssetID: 'image-b', imageData: 'keep' }])
  expect(result.eventMoments).toEqual([{ imageData: '', addedAt: 42 }])
})

test('unchanged payloads/tombstones keep their bytes and invalid JSON produces a tagged error', () => {
  const payload = encode({ title: 'Keep', cost: 40 })
  expect(redactAccountPayload(payload, context)).toBe(payload)
  expect(redactAccountPayload('', context)).toBe('')
  let thrown: unknown
  try {
    redactAccountPayload('invalid', context)
  } catch (error) {
    thrown = error
  }
  expect(thrown).toMatchObject({
    _tag: 'PersistenceError',
    code: 'ACCOUNT_DELETION_INVALID_SYNC_PAYLOAD',
  })
})

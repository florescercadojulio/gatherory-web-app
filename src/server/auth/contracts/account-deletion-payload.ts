import { PersistenceError } from '@/lib/domain-errors'

export type DeletionPayloadContext = {
  userId: string
  personIds: Set<string>
  mediaIds: Set<string>
  scopeId: string
  successorPersonId?: string
}

const matches = (ids: Set<string>, value: unknown) =>
  typeof value === 'string' && ids.has(value.toLowerCase())

/** Scrub structured identity/media references, not arbitrary user-written text.
 * Keep unknown fields and shared plans intact so the native archive stays decodable.
 */
export function redactAccountPayload(payload: string, context: DeletionPayloadContext): string {
  if (!payload) return payload // existing tombstones contain no personal data
  let decoded: unknown
  try {
    decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
  } catch (cause) {
    throw new PersistenceError({
      category: 'system',
      code: 'ACCOUNT_DELETION_INVALID_SYNC_PAYLOAD',
      userMessageKey: 'serverErrors.SYSTEM',
      cause,
    })
  }
  function visit(value: unknown, key = ''): unknown {
    if (Array.isArray(value)) {
      return value
        .filter((item) => {
          if (['mainEventParticipantIDs', 'participantIDs'].includes(key))
            return !matches(context.personIds, item)
          if (!item || typeof item !== 'object') return true
          const record = item as Record<string, unknown>
          if (key === 'members')
            return record.userID !== context.userId && !matches(context.personIds, record.id)
          if (key === 'eventParticipations') return !matches(context.personIds, record.memberID)
          return true
        })
        .map((item) => visit(item, key))
    }
    if (!value || typeof value !== 'object') return value
    const record = value as Record<string, unknown>
    const result = Object.fromEntries(
      Object.entries(record).map(([field, item]) => [field, visit(item, field)])
    )
    for (const [identity, label] of [
      ['submittedByUserID', 'submittedBy'],
      ['addedByUserID', 'addedBy'],
      ['authorUserID', ''],
    ]) {
      if (record[identity] === context.userId) {
        delete result[identity]
        if (label in result) result[label] = ''
      }
    }
    for (const field of ['mediaAssetID', 'mainEventMediaAssetID']) {
      if (matches(context.mediaIds, record[field])) {
        delete result[field]
        delete result[field === 'mainEventMediaAssetID' ? 'mainEventImageData' : 'imageData']
        // EventMoment.imageData is non-optional in the native model.
        if ('addedAt' in record) result.imageData = ''
      }
    }
    if (
      context.successorPersonId &&
      matches(new Set([context.successorPersonId]), record.id) &&
      'participantRole' in record
    ) {
      result.participantRole = 'host'
      result.planningPermission = 'manage'
    }
    if (
      context.successorPersonId &&
      record.eventID?.toString().toLowerCase() === context.scopeId &&
      matches(new Set([context.successorPersonId]), record.memberID)
    ) {
      result.role = 'host'
      result.planningPermission = 'manage'
    }
    return result
  }
  const redacted = JSON.stringify(visit(decoded))
  // Preserve bytes if unchanged; avoids generating unnecessary entity versions.
  return redacted === JSON.stringify(decoded) ? payload : Buffer.from(redacted).toString('base64')
}

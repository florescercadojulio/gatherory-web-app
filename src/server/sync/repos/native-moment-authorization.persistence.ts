import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import { eventMedia, mediaAsset } from '@/db/schema/media.schema'
import { nativeSyncChange } from '@/db/schema/sync.schema'
import { retainedEventAccess } from '@/server/events/repos/event-departure.repo'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const uuid = (value: unknown) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value.toLowerCase()
    : null

function decode(payload: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/** Canonical placements win; the first accepted native mutation covers uploads still in flight. */
export async function canDeleteNativeMoment(
  tx: Transaction,
  input: {
    rootEventId: string
    targetScopeId: string
    allowRootChildren: boolean
    entityId: string
    organizationId: string
    userId: string
  }
) {
  const [placement] = await tx
    .select({
      eventId: eventMedia.eventId,
      parentEventId: event.parentEventId,
      role: eventMedia.role,
      uploadedByUserId: mediaAsset.uploadedByUserId,
    })
    .from(eventMedia)
    .innerJoin(mediaAsset, eq(mediaAsset.id, eventMedia.mediaAssetId))
    .innerJoin(event, eq(event.id, eventMedia.eventId))
    .where(
      and(
        eq(eventMedia.id, input.entityId),
        eq(eventMedia.organizationId, input.organizationId),
        eq(mediaAsset.organizationId, input.organizationId),
        eq(event.organizationId, input.organizationId)
      )
    )
    .limit(1)

  let targetEventId: string
  let uploaderUserId: string | null
  if (placement) {
    if (placement.role !== 'gallery') return false
    targetEventId = placement.eventId
    uploaderUserId = placement.uploadedByUserId
    if (input.allowRootChildren) {
      if (targetEventId !== input.rootEventId && placement.parentEventId !== input.rootEventId)
        return false
    } else if (
      targetEventId !== input.targetScopeId ||
      placement.parentEventId !== input.rootEventId
    ) {
      return false
    }
  } else {
    const [creation] = await tx
      .select({ ownerUserId: nativeSyncChange.ownerUserId, payload: nativeSyncChange.payload })
      .from(nativeSyncChange)
      .where(
        and(
          eq(nativeSyncChange.scopeId, input.rootEventId),
          eq(nativeSyncChange.entityType, 'moment'),
          eq(nativeSyncChange.entityId, input.entityId),
          eq(nativeSyncChange.serverVersion, 1),
          eq(nativeSyncChange.operation, 'create')
        )
      )
      .limit(1)
    const originalPayload = creation ? decode(creation.payload) : null
    const eventId = originalPayload?.eventID
    targetEventId =
      eventId == null ? (input.allowRootChildren ? input.rootEventId : '') : (uuid(eventId) ?? '')
    const mediaAssetId = uuid(originalPayload?.mediaAssetID)
    if (!creation || !targetEventId) return false

    const [targetEvent] = await tx
      .select({ parentEventId: event.parentEventId })
      .from(event)
      .where(and(eq(event.id, targetEventId), eq(event.organizationId, input.organizationId)))
      .limit(1)
    if (!targetEvent) return false
    if (input.allowRootChildren) {
      if (targetEventId !== input.rootEventId && targetEvent.parentEventId !== input.rootEventId)
        return false
    } else if (
      targetEventId !== input.targetScopeId ||
      targetEvent.parentEventId !== input.rootEventId
    ) {
      return false
    }

    const [asset] = mediaAssetId
      ? await tx
          .select({ uploadedByUserId: mediaAsset.uploadedByUserId })
          .from(mediaAsset)
          .where(
            and(
              eq(mediaAsset.id, mediaAssetId),
              eq(mediaAsset.organizationId, input.organizationId)
            )
          )
          .limit(1)
      : []
    // A registered asset is authoritative, including a null uploader. While
    // registration is pending, the first accepted create actor is the owner.
    uploaderUserId = asset ? asset.uploadedByUserId : creation.ownerUserId
  }

  const [actor] = await tx
    .select({ role: eventParticipant.role, permission: eventParticipant.planningPermission })
    .from(eventParticipant)
    .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
    .where(
      and(
        eq(eventParticipant.eventId, targetEventId),
        eq(workspacePerson.organizationId, input.organizationId),
        eq(workspacePerson.userId, input.userId),
        retainedEventAccess(input.userId, eventParticipant.eventId)
      )
    )
    .limit(1)
  if (!actor || actor.role === 'guest' || actor.permission === 'view_only') return false

  const manager = actor.role === 'host' || actor.permission === 'manage'
  return uploaderUserId === input.userId || manager
}

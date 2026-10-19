import { createHash } from 'node:crypto'
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import { idea, eventExpense, eventNote, registryItem } from '@/db/schema/planning.schema'
import { eventMedia, mediaAsset } from '@/db/schema/media.schema'
import { eventExperienceConfiguration, eventGuideSection } from '@/db/schema/blueprint.schema'
import {
  nativeSyncChange,
  nativeSyncEntity,
  nativeSyncMutationReceipt,
  nativeWorkspaceSnapshot,
} from '@/db/schema/sync.schema'
import { retainedEventAccess } from '@/server/events/repos/event-departure.repo'
import type {
  NativeMutation,
  NativePullPage,
  NativePushResult,
} from '../contracts/native-sync.contracts'
import {
  materializeNativeMutation,
  NativeMaterializationError,
} from './native-materializer.persistence'
import { buildScopedEventArchive } from '../services/scoped-event-projection'
import { nativeIdentityWriteAllowed } from '../services/native-identity-access'
import { deletedAccountTombstone } from '../contracts/native-tombstones'
import { canDeleteNativeMoment } from './native-moment-authorization.persistence'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')
const decode = (payload: string): Record<string, any> => {
  const value = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
  if (!value || typeof value !== 'object' || Array.isArray(value))
    forbidden('INVALID_NATIVE_PAYLOAD')
  return value
}
const uuid = (value: unknown) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value.toLowerCase()
    : null
const iso = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z')

function forbidden(code = 'EVENT_SCOPE_FORBIDDEN'): never {
  throw new NativeMaterializationError({
    category: 'authorization',
    code,
    userMessageKey: 'serverErrors.AUTHORIZATION',
  })
}

/** A child scope is a view over the root log, never an organization membership. */
export async function scopedEventActor(tx: Transaction, eventId: string, userId: string) {
  const [actor] = await tx
    .select({
      event: event,
      personId: workspacePerson.id,
      role: eventParticipant.role,
      planningPermission: eventParticipant.planningPermission,
    })
    .from(event)
    .innerJoin(eventParticipant, eq(eventParticipant.eventId, event.id))
    .innerJoin(
      workspacePerson,
      and(
        eq(workspacePerson.id, eventParticipant.personId),
        eq(workspacePerson.organizationId, event.organizationId)
      )
    )
    .where(
      and(
        eq(event.id, eventId),
        eq(workspacePerson.userId, userId),
        isNotNull(event.parentEventId),
        inArray(eventParticipant.role, ['host', 'collaborator']),
        retainedEventAccess(userId, event.id)
      )
    )
    .limit(1)
  return actor ?? null
}

/** Canonical ownership checks run before materialization, including ID reuse. */
async function authorizeMutation(
  tx: Transaction,
  actor: NonNullable<Awaited<ReturnType<typeof scopedEventActor>>>,
  mutation: NativeMutation,
  userId: string
) {
  const scopeId = actor.event.id
  if (actor.planningPermission === 'view_only') forbidden('SCOPE_READ_ONLY')
  if (
    ['archived', 'cancelled'].includes(actor.event.planningStatus ?? '') ||
    actor.event.completionStatus === 'complete'
  )
    forbidden('EVENT_CLOSED')
  if (['workspace', 'attendance'].includes(mutation.entityType)) forbidden()
  const payload = mutation.operation === 'delete' ? {} : decode(mutation.payload)
  if (mutation.operation !== 'delete' && uuid(payload.id) !== mutation.entityID) forbidden()
  const manager = actor.role === 'host' || actor.planningPermission === 'manage'
  if (mutation.entityType === 'registry_item' && !manager) forbidden('EVENT_PERMISSION_REQUIRED')

  if (mutation.entityType === 'event') {
    if (
      !manager ||
      mutation.entityID !== scopeId ||
      mutation.operation === 'delete' ||
      payload.parentEventID != null ||
      payload.linkedIdeaID != null
    )
      forbidden()
  } else if (mutation.entityType === 'participant') {
    // People are organization-wide identities. Event management does not grant
    // permission to rewrite another account's shared profile.
    const [person] = await tx
      .select()
      .from(workspacePerson)
      .where(eq(workspacePerson.id, mutation.entityID))
      .limit(1)
    if (
      mutation.operation === 'delete' ||
      (person && person.id !== actor.personId) ||
      (!person && !manager)
    )
      forbidden()
    if (payload.userID != null && payload.userID !== userId) forbidden()
  } else if (mutation.entityType === 'event_participation') {
    const [existing] = await tx
      .select()
      .from(eventParticipant)
      .where(eq(eventParticipant.id, mutation.entityID))
      .limit(1)
    if (existing && existing.eventId !== scopeId) forbidden()
    if (mutation.operation !== 'delete') {
      if (uuid(payload.eventID) !== scopeId || payload.role === 'host') forbidden()
      const personId = uuid(payload.memberID)
      if (!personId) forbidden()
      const relationships = await tx
        .select({ eventId: eventParticipant.eventId })
        .from(eventParticipant)
        .where(eq(eventParticipant.personId, personId))
      if (relationships.length && !relationships.some((row) => row.eventId === scopeId)) forbidden()
      if (existing && existing.personId !== personId) forbidden()
    }
    if (!nativeIdentityWriteAllowed({ mutation, actor, participation: existing }))
      forbidden('EVENT_PERMISSION_REQUIRED')
  } else if (mutation.entityType === 'idea_response') {
    const [target] = await tx
      .select({ eventId: idea.eventId })
      .from(idea)
      .where(eq(idea.id, uuid(payload.ideaID) ?? mutation.entityID))
      .limit(1)
    if (!target || target.eventId !== scopeId) forbidden()
  } else {
    const table =
      mutation.entityType === 'idea'
        ? idea
        : mutation.entityType === 'expense'
          ? eventExpense
          : mutation.entityType === 'registry_item'
            ? registryItem
            : mutation.entityType === 'note'
              ? eventNote
              : eventMedia
    const [existing] = await tx
      .select({ eventId: table.eventId })
      .from(table)
      .where(eq(table.id, mutation.entityID))
      .limit(1)
    if (existing && existing.eventId !== scopeId) forbidden()
    if (mutation.operation === 'delete' && !existing && mutation.entityType !== 'moment')
      forbidden()
    if (mutation.operation === 'delete' && mutation.entityType === 'moment') {
      const authorized = await canDeleteNativeMoment(tx, {
        rootEventId: actor.event.parentEventId!,
        targetScopeId: scopeId,
        allowRootChildren: false,
        entityId: mutation.entityID,
        organizationId: actor.event.organizationId,
        userId,
      })
      if (!authorized) forbidden('EVENT_PERMISSION_REQUIRED')
    } else if (mutation.operation === 'delete' && !manager) {
      forbidden()
    }
    if (mutation.operation !== 'delete') {
      if (payload.eventID != null && uuid(payload.eventID) !== scopeId) forbidden()
      payload.eventID = scopeId
      if (payload.sourceIdeaID != null) {
        const sourceId = uuid(payload.sourceIdeaID)
        if (!sourceId) forbidden()
        const [source] = await tx
          .select({ eventId: idea.eventId })
          .from(idea)
          .where(eq(idea.id, sourceId))
          .limit(1)
        if (!source || source.eventId !== scopeId) forbidden()
      }
      if (mutation.entityType === 'note' && existing) {
        const [note] = await tx
          .select({ author: eventNote.authorUserId })
          .from(eventNote)
          .where(eq(eventNote.id, mutation.entityID))
          .limit(1)
        if (note?.author !== userId) forbidden()
      }
    }
  }
  // Registered assets must belong to this scoped upload or already be placed
  // in this exact event. Unregistered moment assets stay deferred until upload
  // registration; the first accepted native create records their trusted owner.
  if (payload.mediaAssetID != null) {
    const assetId = uuid(payload.mediaAssetID)
    if (!assetId) forbidden()
    const allowed = await tx.execute(
      sql`select 1 from media_asset a
        where a.id = ${assetId}::uuid and a.organization_id = ${actor.event.organizationId}
        and (
          (a.uploaded_by_user_id = ${userId} and starts_with(a.storage_key,
            ${`workspaces/${actor.event.organizationId}/events/${scopeId}/media/${assetId}/original.`}))
          or exists (select 1 from event_media m where m.media_asset_id = a.id and m.event_id = ${scopeId}::uuid)
          or exists (select 1 from idea_media m join idea i on i.id = m.idea_id where m.media_asset_id = a.id and i.event_id = ${scopeId}::uuid)
          or exists (select 1 from registry_item_media m join registry_item r on r.id = m.registry_item_id where m.media_asset_id = a.id and r.event_id = ${scopeId}::uuid)
        )`
    )
    if (!allowed.rows.length) {
      const [asset] = await tx
        .select({ id: mediaAsset.id })
        .from(mediaAsset)
        .where(eq(mediaAsset.id, assetId))
        .limit(1)
      const deferredMoment =
        mutation.entityType === 'moment' &&
        mutation.operation !== 'delete' &&
        !asset &&
        uuid(payload.eventID) === scopeId
      if (!deferredMoment) forbidden()
    }
  }
  return payload
}

/** Called under the same root lock and one-mutation transaction as root writes. */
export async function applyScopedEventMutation(
  locked: Transaction,
  input: { userId: string; mutation: NativeMutation; rootId: string }
): Promise<NativePushResult> {
  const { mutation, userId } = input
  const result = (
    disposition: NativePushResult['disposition'],
    serverVersion: number | null,
    failureCode: string | null
  ): NativePushResult => ({ mutationID: mutation.id, disposition, serverVersion, failureCode })
  try {
    return await locked.transaction(async (tx) => {
      const actor = await scopedEventActor(tx, mutation.scopeID, userId)
      if (!actor || actor.event.parentEventId !== input.rootId) forbidden('SCOPE_WRITE_FORBIDDEN')
      if (actor.planningPermission === 'view_only') forbidden('SCOPE_READ_ONLY')
      const [receipt] = await tx
        .select()
        .from(nativeSyncMutationReceipt)
        .where(eq(nativeSyncMutationReceipt.mutationId, mutation.id))
        .limit(1)
      if (receipt) {
        if (receipt.ownerUserId !== userId || receipt.scopeId !== mutation.scopeID)
          return result('rejected', null, 'MUTATION_ID_OWNERSHIP_MISMATCH')
        return result(
          receipt.disposition === 'applied'
            ? 'duplicate'
            : receipt.disposition === 'conflict'
              ? 'conflict'
              : 'rejected',
          receipt.serverVersion,
          receipt.failureCode
        )
      }
      const payload = await authorizeMutation(tx, actor, mutation, userId)
      const [snapshot] = await tx
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, input.rootId))
        .limit(1)
        .for('update')
      if (!snapshot || snapshot.isDeleted) forbidden('SYNC_SCOPE_NOT_FOUND')
      const [existing] = await tx
        .select()
        .from(nativeSyncEntity)
        .where(
          and(
            eq(nativeSyncEntity.scopeId, input.rootId),
            eq(nativeSyncEntity.entityType, mutation.entityType),
            eq(nativeSyncEntity.entityId, mutation.entityID)
          )
        )
        .limit(1)
      if (existing?.isDeleted && existing.payload === deletedAccountTombstone)
        forbidden('PARTICIPANT_ACCOUNT_DELETED')
      // Deleted canonical rows no longer prove which event owned the ID.
      // Scoped writers cannot resurrect tombstoned IDs into a different event.
      if (existing?.isDeleted && mutation.operation !== 'delete') forbidden('ENTITY_DELETED')
      if (
        existing &&
        mutation.baseVersion != null &&
        existing.serverVersion !== mutation.baseVersion
      ) {
        await tx.insert(nativeSyncMutationReceipt).values({
          mutationId: mutation.id,
          ownerUserId: userId,
          scopeId: mutation.scopeID,
          disposition: 'conflict',
          serverVersion: existing.serverVersion,
          failureCode: 'SERVER_VERSION_CONFLICT',
        })
        return result('conflict', existing.serverVersion, 'SERVER_VERSION_CONFLICT')
      }
      if (mutation.entityType === 'event') {
        // Keep the stored hierarchy and source-idea relationship private and
        // unchanged while editing the child as the native planning root.
        const previous =
          existing && !existing.isDeleted
            ? decode(existing.payload)
            : ((decode(snapshot.payload).timeline as Record<string, unknown>[] | undefined)?.find(
                (item) => uuid(item.id) === mutation.scopeID
              ) ?? {})
        const roster = await tx
          .select({ personId: eventParticipant.personId })
          .from(eventParticipant)
          .where(eq(eventParticipant.eventId, mutation.scopeID))
        Object.assign(payload, {
          parentEventID: input.rootId,
          linkedIdeaID: previous.linkedIdeaID,
          participantIDs: roster.map((item) => item.personId),
        })
      }
      if (mutation.entityType === 'note') payload.authorUserID = userId
      const storedPayload = mutation.operation === 'delete' ? '' : encode(payload)
      const storedMutation = { ...mutation, scopeID: input.rootId, payload: storedPayload }
      await materializeNativeMutation(tx, {
        userId,
        organizationId: snapshot.organizationId,
        mutation: storedMutation,
      })
      const serverVersion = (existing?.serverVersion ?? 0) + 1
      await tx
        .insert(nativeSyncEntity)
        .values({
          scopeId: input.rootId,
          entityType: mutation.entityType,
          entityId: mutation.entityID,
          ownerUserId: userId,
          payload: storedPayload,
          serverVersion,
          isDeleted: mutation.operation === 'delete',
        })
        .onConflictDoUpdate({
          target: [
            nativeSyncEntity.scopeId,
            nativeSyncEntity.entityType,
            nativeSyncEntity.entityId,
          ],
          set: {
            payload: storedPayload,
            serverVersion,
            isDeleted: mutation.operation === 'delete',
            updatedAt: new Date(),
          },
        })
      await tx.insert(nativeSyncChange).values({
        scopeId: input.rootId,
        ownerUserId: userId,
        entityType: mutation.entityType,
        entityId: mutation.entityID,
        operation: mutation.operation,
        payload: storedPayload,
        serverVersion,
      })
      await tx.insert(nativeSyncMutationReceipt).values({
        mutationId: mutation.id,
        ownerUserId: userId,
        scopeId: mutation.scopeID,
        disposition: 'applied',
        serverVersion,
      })
      return result('applied', serverVersion, null)
    })
  } catch (error) {
    if (!(error instanceof NativeMaterializationError) && !(error instanceof SyntaxError))
      throw error
    const failureCode =
      error instanceof NativeMaterializationError ? error.code : 'INVALID_NATIVE_PAYLOAD'
    await locked
      .insert(nativeSyncMutationReceipt)
      .values({
        mutationId: mutation.id,
        ownerUserId: userId,
        scopeId: mutation.scopeID,
        disposition: 'rejected',
        failureCode,
      })
      .onConflictDoNothing()
    return result('rejected', null, failureCode)
  }
}

function envelopeID(scopeId: string, cursor: string, kind: string) {
  const bytes = createHash('sha256')
    .update(`scoped-event:${scopeId}:${cursor}:${kind}`)
    .digest()
    .subarray(0, 16)
  bytes[6] = (bytes[6] & 15) | 80
  bytes[8] = (bytes[8] & 63) | 128
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function scopedEventSnapshot(tx: Transaction, scopeId: string, userId: string) {
  const actor = await scopedEventActor(tx, scopeId, userId)
  if (!actor) return null
  const rootId = actor.event.parentEventId!
  const [root] = await tx
    .select()
    .from(nativeWorkspaceSnapshot)
    .where(
      and(eq(nativeWorkspaceSnapshot.scopeId, rootId), eq(nativeWorkspaceSnapshot.isDeleted, false))
    )
    .limit(1)
  if (!root) return null
  const entities = await tx
    .select()
    .from(nativeSyncEntity)
    .where(eq(nativeSyncEntity.scopeId, rootId))
  const participants = await tx
    .select({ person: workspacePerson, participation: eventParticipant })
    .from(eventParticipant)
    .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
    .where(eq(eventParticipant.eventId, scopeId))
  const attendance = (value: string) =>
    value === 'pending'
      ? 'invited'
      : value === 'not_going'
        ? 'declined'
        : value === 'not_sure'
          ? 'maybe'
          : value
  const members = participants.map(({ person, participation }) => ({
    id: person.id,
    userID: person.userId,
    name: person.displayName,
    initials: person.displayName
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join(''),
    email: person.email,
    profileImageURL: person.avatarUrl,
    participantRole: participation.role,
    planningPermission:
      participation.planningPermission === 'view_only'
        ? 'viewOnly'
        : participation.planningPermission,
    attendance: attendance(participation.attendanceStatus),
    invitationStatus: 'active',
  }))
  const eventParticipations = participants.map(({ person, participation }) => ({
    id: participation.id,
    eventID: scopeId,
    memberID: person.id,
    role: participation.role,
    planningPermission:
      participation.planningPermission === 'view_only'
        ? 'viewOnly'
        : participation.planningPermission,
    attendance: attendance(participation.attendanceStatus),
    invitationStatus: 'active',
    createdAt: participation.createdAt.getTime() / 1000 - 978307200,
    updatedAt: participation.updatedAt.getTime() / 1000 - 978307200,
  }))
  const child = actor.event
  const [cover] = await tx
    .select({ mediaAssetId: eventMedia.mediaAssetId })
    .from(eventMedia)
    .where(and(eq(eventMedia.eventId, scopeId), eq(eventMedia.role, 'cover')))
    .limit(1)
  const childEvent = {
    id: child.id,
    parentEventID: rootId,
    title: child.title,
    category:
      (
        {
          food_tasting: 'foodTasting',
          attire_fitting: 'attireFitting',
          wedding_shower: 'weddingShower',
          bachelor_bachelorette: 'bachelorBachelorette',
        } as Record<string, string>
      )[child.category ?? 'other'] ??
      child.category ??
      'other',
    purpose: child.purpose === 'part_of_event' ? 'eventExperience' : 'planning',
    scheduledAt: child.startsAt ? child.startsAt.getTime() / 1000 - 978307200 : 0,
    endsAt: child.endsAt ? child.endsAt.getTime() / 1000 - 978307200 : null,
    isAllDay: child.isAllDay,
    timeZoneIdentifier: child.timeZone,
    eventDescription: child.description,
    dressCode: child.dressCode,
    budgetCap: child.budgetCap == null ? null : Number(child.budgetCap),
    schedulingState: child.schedulingState,
    completionStatus: child.completionStatus,
    status: child.planningStatus === 'not_sure' ? 'notSure' : child.planningStatus,
    mediaAssetID: cover?.mediaAssetId ?? null,
    eventLocation:
      child.locationName || child.locationAddress
        ? {
            locationName: child.locationName ?? '',
            placeName: '',
            shortAddress: '',
            address: child.locationAddress ?? '',
            addressLine2: child.locationAddressLine2 ?? '',
            latitude: child.locationLatitude,
            longitude: child.locationLongitude,
            mapItemIdentifier: child.mapItemIdentifier,
          }
        : null,
  }
  const guides = await tx
    .select({
      id: eventGuideSection.id,
      eventID: eventGuideSection.eventId,
      key: eventGuideSection.key,
      title: eventGuideSection.title,
      body: eventGuideSection.body,
      sortOrder: eventGuideSection.sortOrder,
      visibility: eventGuideSection.visibility,
    })
    .from(eventGuideSection)
    .where(eq(eventGuideSection.eventId, scopeId))
    .orderBy(eventGuideSection.sortOrder, eventGuideSection.id)
  const experienceConfigurations = await tx
    .select({
      eventID: eventExperienceConfiguration.eventId,
      experienceType: eventExperienceConfiguration.experienceType,
      categoryOrder: eventExperienceConfiguration.categoryOrder,
    })
    .from(eventExperienceConfiguration)
    .where(inArray(eventExperienceConfiguration.eventId, [scopeId, rootId]))
  const experienceConfiguration =
    experienceConfigurations.find((configuration) => configuration.eventID === scopeId) ??
    experienceConfigurations.find((configuration) => configuration.eventID === rootId)
  const payload = buildScopedEventArchive({
    snapshotPayload: root.payload,
    entities,
    eventId: scopeId,
    members,
    eventParticipations,
    childEvent,
    guides,
    experienceConfiguration: experienceConfiguration ?? null,
  })
  if (!payload) return null
  const [latest] = await tx
    .select({ cursor: sql<number>`coalesce(max(${nativeSyncChange.cursor}), 0)` })
    .from(nativeSyncChange)
    .where(eq(nativeSyncChange.scopeId, rootId))
  return {
    scopeID: scopeId,
    payloadSchemaVersion: 1 as const,
    payload,
    serverVersion: root.serverVersion,
    updatedAt: iso(new Date()),
    cursor: Number(latest.cursor),
  }
}

/** A complete authorized projection uses a root-log high-water mark. This
 * avoids leaking even IDs from filtered changes and handles moves/deletions. */
export async function pullScopedEventChanges(input: {
  userId: string
  scopeId: string
  rootId: string
  after: number
}): Promise<NativePullPage> {
  return db.transaction(async (tx) => {
    await tx.select({ id: event.id }).from(event).where(eq(event.id, input.rootId)).for('share')
    await tx.select({ id: event.id }).from(event).where(eq(event.id, input.scopeId)).for('share')
    const snapshot = await scopedEventSnapshot(tx, input.scopeId, input.userId)
    if (!snapshot)
      return {
        changes: [
          {
            id: envelopeID(input.scopeId, String(input.after), 'revoked'),
            scopeID: input.scopeId,
            payloadSchemaVersion: 1,
            entityType: 'workspace',
            entityID: input.scopeId,
            operation: 'delete',
            payload: '',
            serverVersion: 0,
            occurredAt: iso(new Date()),
          },
        ],
        nextCursor: String(input.after),
        hasMore: false,
      }
    // Canonical permission/RSVP changes need not have written a native log row.
    // Include the projection digest in its identity so those updates arrive
    // without inventing a cursor or reapplying an unchanged archive.
    const cursor = String(Math.max(snapshot.cursor, input.after))
    const digest = createHash('sha256').update(snapshot.payload).digest('hex')
    return {
      changes: [
        {
          id: envelopeID(input.scopeId, cursor, digest),
          scopeID: input.scopeId,
          payloadSchemaVersion: 1,
          entityType: 'workspace',
          entityID: input.scopeId,
          operation: 'update',
          payload: snapshot.payload,
          serverVersion: snapshot.serverVersion,
          occurredAt: snapshot.updatedAt,
        },
      ],
      nextCursor: cursor,
      hasMore: false,
    }
  })
}

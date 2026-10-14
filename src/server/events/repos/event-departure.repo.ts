import { PgClient } from '@effect/sql-pg/PgClient'
import { and, eq, sql, type SQLWrapper } from 'drizzle-orm'
import { Effect } from 'effect'
import { DB } from '@/db'
import {
  event,
  eventDeparture,
  eventInvitation,
  eventParticipant,
  workspacePerson,
  nativeWorkspaceSnapshot,
  nativeSyncEntity,
  nativeSyncChange,
} from '@/db/schema'
import { ForbiddenError } from '@/server/effect'

export function retainedEventAccess(userId: string, eventId: SQLWrapper) {
  return sql`not exists (select 1 from ${eventDeparture} where ${eventDeparture.userId} = ${userId} and ${eventDeparture.eventId} = ${eventId})`
}

/** Leave exactly this invitation. Other events and organization access are unchanged. */
export function leaveGuestEvent(userId: string, eventId: string) {
  return Effect.gen(function* () {
    const pg = yield* PgClient
    return yield* pg.withTransaction(
      Effect.gen(function* () {
        const db = yield* DB
        const [target] = yield* db
          .select({ parentId: event.parentEventId })
          .from(event)
          .where(eq(event.id, eventId))
          .limit(1)
        if (!target) return yield* leaveForbidden()
        // Serialize admission/departure against the same event lifecycle locks.
        yield* db
          .select({ id: event.id })
          .from(event)
          .where(eq(event.id, target.parentId ?? eventId))
          .for('update')
        if (target.parentId)
          yield* db.select({ id: event.id }).from(event).where(eq(event.id, eventId)).for('update')
        const [participation] = yield* db
          .select({
            id: eventParticipant.id,
            personId: eventParticipant.personId,
            role: eventParticipant.role,
          })
          .from(eventParticipant)
          .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
          .where(and(eq(eventParticipant.eventId, eventId), eq(workspacePerson.userId, userId)))
          .limit(1)
          .for('update', { of: eventParticipant })
        const [departed] = yield* db
          .select({ id: eventDeparture.eventId })
          .from(eventDeparture)
          .where(and(eq(eventDeparture.eventId, eventId), eq(eventDeparture.userId, userId)))
          .limit(1)
        if (!participation && departed) return { eventId }
        if (!participation || participation.role !== 'guest') return yield* leaveForbidden()
        yield* db.insert(eventDeparture).values({ eventId, userId }).onConflictDoNothing()
        yield* db.delete(eventParticipant).where(eq(eventParticipant.id, participation.id))
        // An old accepted token is no longer an idempotent admission. A new public
        // link acceptance or newly issued email invitation can explicitly rejoin.
        yield* db
          .update(eventInvitation)
          .set({ status: 'revoked', updatedAt: new Date() })
          .where(
            and(eq(eventInvitation.eventId, eventId), eq(eventInvitation.acceptedByUserId, userId))
          )
        const scopeId = target.parentId ?? eventId
        const [snapshot] = yield* db
          .select()
          .from(nativeWorkspaceSnapshot)
          .where(eq(nativeWorkspaceSnapshot.scopeId, scopeId))
          .limit(1)
          .for('update')
        if (snapshot) {
          const [entity] = yield* db
            .insert(nativeSyncEntity)
            .values({
              scopeId,
              ownerUserId: snapshot.ownerUserId,
              entityType: 'event_participation',
              entityId: participation.id,
              payload: '',
              isDeleted: true,
            })
            .onConflictDoUpdate({
              target: [
                nativeSyncEntity.scopeId,
                nativeSyncEntity.entityType,
                nativeSyncEntity.entityId,
              ],
              set: {
                payload: '',
                isDeleted: true,
                serverVersion: sql`${nativeSyncEntity.serverVersion} + 1`,
                updatedAt: new Date(),
              },
            })
            .returning({ version: nativeSyncEntity.serverVersion })
          yield* db
            .insert(nativeSyncChange)
            .values({
              scopeId,
              ownerUserId: snapshot.ownerUserId,
              entityType: 'event_participation',
              entityId: participation.id,
              operation: 'delete',
              payload: '',
              serverVersion: entity.version,
            })
          const archive = JSON.parse(Buffer.from(snapshot.payload, 'base64').toString('utf8'))
          archive.eventParticipations = (archive.eventParticipations ?? []).filter(
            (item: { id: string }) => item.id.toLowerCase() !== participation.id
          )
          if (scopeId === eventId)
            archive.mainEventParticipantIDs = (archive.mainEventParticipantIDs ?? []).filter(
              (id: string) => id.toLowerCase() !== participation.personId
            )
          archive.timeline = (archive.timeline ?? []).map(
            (item: { id: string; participantIDs?: string[] }) =>
              item.id.toLowerCase() === eventId
                ? {
                    ...item,
                    participantIDs: (item.participantIDs ?? []).filter(
                      (id) => id.toLowerCase() !== participation.personId
                    ),
                  }
                : item
          )
          const payload = Buffer.from(JSON.stringify(archive)).toString('base64')
          const [updated] = yield* db
            .update(nativeWorkspaceSnapshot)
            .set({
              payload,
              serverVersion: sql`${nativeWorkspaceSnapshot.serverVersion} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(nativeWorkspaceSnapshot.scopeId, scopeId))
            .returning({ version: nativeWorkspaceSnapshot.serverVersion })
          yield* db
            .insert(nativeSyncChange)
            .values({
              scopeId,
              ownerUserId: snapshot.ownerUserId,
              entityType: 'workspace',
              entityId: scopeId,
              operation: 'update',
              payload,
              serverVersion: updated.version,
            })
        }
        return { eventId }
      })
    )
  })
}

function leaveForbidden() {
  return Effect.fail(
    new ForbiddenError({
      category: 'authorization',
      code: 'EVENT_LEAVE_FORBIDDEN',
      userMessageKey: 'serverErrors.EVENT_LEAVE_FORBIDDEN',
    })
  )
}

import { createHash, timingSafeEqual } from 'node:crypto'
import { PgClient } from '@effect/sql-pg/PgClient'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { Effect } from 'effect'
import { DB } from '@/db'
import {
  event,
  eventDeparture,
  eventGuestClaim,
  eventGuestProfile,
  eventParticipant,
  eventShareLink,
  eventInvitation,
  workspacePerson,
} from '@/db/schema/event.schema'
import {
  nativeSyncChange,
  nativeSyncEntity,
  nativeWorkspaceSnapshot,
} from '@/db/schema/sync.schema'
import { ConflictError, EntityNotFoundError, ForbiddenError } from '@/server/effect'
import { requireJoinableEvent } from './event-lifecycle.repo'

const hashCredential = (id: string, credential: string) =>
  createHash('sha256').update(id).update(':').update(credential).digest('hex')

function sameHash(left: string, right: string) {
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'))
}

function invalidGuestSession() {
  return new ForbiddenError({
    category: 'authorization',
    code: 'GUEST_SESSION_INVALID',
    userMessageKey: 'serverErrors.AUTHORIZATION',
  })
}

function unavailableGuestLink() {
  return new EntityNotFoundError({
    category: 'not_found',
    code: 'GUEST_LINK_UNAVAILABLE',
    userMessageKey: 'serverErrors.NOT_FOUND',
  })
}

function claimedByAnotherAccount() {
  return new ForbiddenError({
    category: 'authorization',
    code: 'GUEST_SESSION_ALREADY_CLAIMED',
    userMessageKey: 'serverErrors.AUTHORIZATION',
  })
}

function nativeFoundationDate(date: Date) {
  return (date.getTime() - Date.UTC(2001, 0, 1)) / 1000
}

function nativeAttendance(status: 'pending' | 'going' | 'not_sure' | 'not_going') {
  return (
    { pending: 'invited', going: 'going', not_sure: 'maybe', not_going: 'declined' } as const
  )[status]
}

function publishGuestParticipant(
  db: Effect.Success<typeof DB>,
  input: {
    scopeId: string
    participationId: string
    eventId: string
    personId: string
    name: string
    attendance: 'pending' | 'going' | 'not_sure' | 'not_going'
    createdAt?: Date
    operation?: 'update' | 'delete'
    removePerson?: boolean
    preserveExistingPerson?: boolean
    userID?: string
  }
) {
  return Effect.gen(function* () {
    const [snapshot] = yield* db
      .select({
        ownerUserId: nativeWorkspaceSnapshot.ownerUserId,
        payload: nativeWorkspaceSnapshot.payload,
      })
      .from(nativeWorkspaceSnapshot)
      .where(eq(nativeWorkspaceSnapshot.scopeId, input.scopeId))
      .limit(1)
      .for('update')
    if (!snapshot) return

    const archive = JSON.parse(Buffer.from(snapshot.payload, 'base64').toString('utf8'))
    const previousPerson = (archive.members ?? []).find(
      (item: { id: string }) => item.id.toLowerCase() === input.personId.toLowerCase()
    )
    const initials = input.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
    const personPayload =
      input.preserveExistingPerson && previousPerson
        ? {
            ...previousPerson,
            id: input.personId,
            ...(input.userID ? { userID: input.userID } : {}),
            name: input.name,
            initials,
          }
        : {
            id: input.personId,
            ...(input.userID ? { userID: input.userID } : {}),
            name: input.name,
            initials,
            participantRole: 'guest',
            planningPermission: 'viewOnly',
            attendance: nativeAttendance(input.attendance),
            invitationStatus: 'active',
          }
    const participationPayload = {
      id: input.participationId,
      eventID: input.eventId,
      memberID: input.personId,
      role: 'guest',
      planningPermission: 'viewOnly',
      attendance: nativeAttendance(input.attendance),
      invitationStatus: 'active',
      createdAt: nativeFoundationDate(input.createdAt ?? new Date()),
      updatedAt: nativeFoundationDate(new Date()),
    }
    const records =
      input.operation === 'delete'
        ? [
            ...(input.removePerson
              ? [{ type: 'participant', id: input.personId, value: personPayload }]
              : []),
            { type: 'event_participation', id: input.participationId, value: participationPayload },
          ]
        : [
            { type: 'participant', id: input.personId, value: personPayload },
            { type: 'event_participation', id: input.participationId, value: participationPayload },
          ]
    for (const record of records) {
      const payload = Buffer.from(JSON.stringify(record.value), 'utf8').toString('base64')
      const [entity] = yield* db
        .insert(nativeSyncEntity)
        .values({
          scopeId: input.scopeId,
          entityType: record.type,
          entityId: record.id,
          ownerUserId: snapshot.ownerUserId,
          payload: input.operation === 'delete' ? '' : payload,
          isDeleted: input.operation === 'delete',
        })
        .onConflictDoUpdate({
          target: [
            nativeSyncEntity.scopeId,
            nativeSyncEntity.entityType,
            nativeSyncEntity.entityId,
          ],
          set: {
            payload: input.operation === 'delete' ? '' : payload,
            isDeleted: input.operation === 'delete',
            serverVersion: sql`${nativeSyncEntity.serverVersion} + 1`,
            updatedAt: new Date(),
          },
        })
        .returning({ version: nativeSyncEntity.serverVersion })
      yield* db.insert(nativeSyncChange).values({
        scopeId: input.scopeId,
        ownerUserId: snapshot.ownerUserId,
        entityType: record.type,
        entityId: record.id,
        operation: input.operation ?? 'update',
        payload: input.operation === 'delete' ? '' : payload,
        serverVersion: entity.version,
      })
    }

    const merge = (items: Array<{ id: string }> | undefined, value: { id: string }) => [
      ...(items ?? []).filter((item) => item.id.toLowerCase() !== value.id.toLowerCase()),
      value,
    ]
    if (input.operation === 'delete') {
      if (input.removePerson)
        archive.members = (archive.members ?? []).filter(
          (item: { id: string }) => item.id.toLowerCase() !== input.personId.toLowerCase()
        )
      archive.eventParticipations = (archive.eventParticipations ?? []).filter(
        (item: { id: string }) => item.id.toLowerCase() !== input.participationId.toLowerCase()
      )
      if (input.scopeId === input.eventId)
        archive.mainEventParticipantIDs = (archive.mainEventParticipantIDs ?? []).filter(
          (id: string) => id.toLowerCase() !== input.personId.toLowerCase()
        )
      archive.timeline = (archive.timeline ?? []).map(
        (item: { id: string; participantIDs?: string[] }) =>
          item.id.toLowerCase() === input.eventId.toLowerCase()
            ? {
                ...item,
                participantIDs: (item.participantIDs ?? []).filter(
                  (id) => id.toLowerCase() !== input.personId.toLowerCase()
                ),
              }
            : item
      )
    } else {
      archive.members = merge(archive.members, personPayload)
      archive.eventParticipations = merge(archive.eventParticipations, participationPayload)
    }
    yield* db
      .update(nativeWorkspaceSnapshot)
      .set({
        payload: Buffer.from(JSON.stringify(archive), 'utf8').toString('base64'),
        updatedAt: new Date(),
      })
      .where(eq(nativeWorkspaceSnapshot.scopeId, input.scopeId))
  })
}

export function registerDeviceGuestProfile(input: {
  id: string
  name: string
  credential: string
}) {
  return Effect.gen(function* () {
    const pg = yield* PgClient
    return yield* pg.withTransaction(
      Effect.gen(function* () {
        const db = yield* DB
        const credentialHash = hashCredential(input.id, input.credential)
        yield* db
          .insert(eventGuestProfile)
          .values({ id: input.id, displayName: input.name, credentialHash })
          .onConflictDoNothing()
        const [profile] = yield* db
          .select()
          .from(eventGuestProfile)
          .where(eq(eventGuestProfile.id, input.id))
          .limit(1)
          .for('update')
        if (!profile)
          return yield* Effect.fail(
            new ConflictError({
              category: 'conflict',
              code: 'GUEST_PROFILE_ID_UNAVAILABLE',
              userMessageKey: 'serverErrors.CONFLICT',
            })
          )
        if (!sameHash(profile.credentialHash, credentialHash))
          return yield* Effect.fail(invalidGuestSession())
        if (!profile.claimedAt && profile.displayName !== input.name) {
          yield* db
            .update(eventGuestProfile)
            .set({ displayName: input.name, updatedAt: new Date() })
            .where(and(eq(eventGuestProfile.id, input.id), isNull(eventGuestProfile.claimedAt)))
        }
        return { id: input.id, name: profile.claimedAt ? profile.displayName : input.name }
      })
    )
  })
}

function lockAuthenticatedGuestProfile(
  db: Effect.Success<typeof DB>,
  id: string,
  credential: string
) {
  return Effect.gen(function* () {
    const [profile] = yield* db
      .select()
      .from(eventGuestProfile)
      .where(eq(eventGuestProfile.id, id))
      .limit(1)
      .for('update')
    if (!profile || !sameHash(profile.credentialHash, hashCredential(id, credential)))
      return yield* Effect.fail(invalidGuestSession())
    return profile
  })
}

export function verifyDeviceGuestProfile(input: { guestId: string; credential: string }) {
  return Effect.gen(function* () {
    const db = yield* DB
    const profile = yield* lockAuthenticatedGuestProfile(db, input.guestId, input.credential)
    if (profile.claimedAt || profile.claimedByUserId)
      return yield* Effect.fail(invalidGuestSession())
    return { id: profile.id, name: profile.displayName }
  })
}

export function joinDeviceGuestEvent(input: {
  guestId: string
  credential: string
  token: string
}) {
  return Effect.gen(function* () {
    const pg = yield* PgClient
    return yield* pg.withTransaction(
      Effect.gen(function* () {
        const db = yield* DB
        const profile = yield* lockAuthenticatedGuestProfile(db, input.guestId, input.credential)
        if (profile.claimedAt || profile.claimedByUserId)
          return yield* Effect.fail(invalidGuestSession())
        const [link] = yield* db
          .select({
            eventId: eventShareLink.eventId,
            role: eventShareLink.role,
            expiresAt: eventShareLink.expiresAt,
            revokedAt: eventShareLink.revokedAt,
          })
          .from(eventShareLink)
          .where(eq(eventShareLink.token, input.token))
          .limit(1)
        if (!link || link.role !== 'guest' || link.revokedAt || link.expiresAt <= new Date())
          return yield* Effect.fail(unavailableGuestLink())
        yield* requireJoinableEvent(link.eventId)
        const [lockedLink] = yield* db
          .select({
            eventId: eventShareLink.eventId,
            role: eventShareLink.role,
            expiresAt: eventShareLink.expiresAt,
            revokedAt: eventShareLink.revokedAt,
          })
          .from(eventShareLink)
          .where(
            and(eq(eventShareLink.token, input.token), eq(eventShareLink.eventId, link.eventId))
          )
          .limit(1)
          .for('update')
        if (
          !lockedLink ||
          lockedLink.role !== 'guest' ||
          lockedLink.revokedAt ||
          lockedLink.expiresAt <= new Date()
        )
          return yield* Effect.fail(unavailableGuestLink())
        const [target] = yield* db
          .select({ organizationId: event.organizationId, parentId: event.parentEventId })
          .from(event)
          .where(eq(event.id, link.eventId))
          .limit(1)
        if (!target) return yield* Effect.fail(unavailableGuestLink())

        let [person] = yield* db
          .select({ id: workspacePerson.id })
          .from(workspacePerson)
          .where(
            and(
              eq(workspacePerson.organizationId, target.organizationId),
              eq(workspacePerson.guestProfileId, profile.id)
            )
          )
          .limit(1)
          .for('update')
        if (!person) {
          const [created] = yield* db
            .insert(workspacePerson)
            .values({
              organizationId: target.organizationId,
              guestProfileId: profile.id,
              displayName: profile.displayName,
            })
            .returning({ id: workspacePerson.id })
          person = created
        }
        const [existing] = yield* db
          .select({ id: eventParticipant.id, attendance: eventParticipant.attendanceStatus })
          .from(eventParticipant)
          .where(
            and(
              eq(eventParticipant.eventId, link.eventId),
              eq(eventParticipant.personId, person.id)
            )
          )
          .limit(1)
          .for('update')
        if (!existing) {
          const [participation] = yield* db
            .insert(eventParticipant)
            .values({
              eventId: link.eventId,
              personId: person.id,
              role: 'guest',
              planningPermission: 'view_only',
              attendanceStatus: 'pending',
            })
            .returning({ id: eventParticipant.id, attendance: eventParticipant.attendanceStatus })
          yield* publishGuestParticipant(db, {
            scopeId: target.parentId ?? link.eventId,
            participationId: participation.id,
            eventId: link.eventId,
            personId: person.id,
            name: profile.displayName,
            attendance: participation.attendance,
          })
          return { eventId: link.eventId, role: 'guest' as const, status: 'accepted' as const }
        }
        return { eventId: link.eventId, role: 'guest' as const, status: 'accepted' as const }
      })
    )
  })
}

export function respondToDeviceGuestEvent(input: {
  guestId: string
  credential: string
  eventId: string
  attendance: 'going' | 'not_sure' | 'not_going'
}) {
  return Effect.gen(function* () {
    const pg = yield* PgClient
    return yield* pg.withTransaction(
      Effect.gen(function* () {
        const db = yield* DB
        const profile = yield* lockAuthenticatedGuestProfile(db, input.guestId, input.credential)
        if (profile.claimedAt || profile.claimedByUserId)
          return yield* Effect.fail(invalidGuestSession())
        const [scope] = yield* db
          .select({ parentId: event.parentEventId })
          .from(event)
          .where(eq(event.id, input.eventId))
          .limit(1)
        if (!scope) return yield* Effect.fail(unavailableGuestLink())
        yield* requireJoinableEvent(input.eventId)
        const [participation] = yield* db
          .select({
            id: eventParticipant.id,
            personId: workspacePerson.id,
            name: workspacePerson.displayName,
          })
          .from(eventParticipant)
          .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
          .where(
            and(
              eq(eventParticipant.eventId, input.eventId),
              eq(workspacePerson.guestProfileId, profile.id),
              eq(eventParticipant.role, 'guest')
            )
          )
          .limit(1)
          .for('update', { of: eventParticipant })
        if (!participation)
          return yield* Effect.fail(
            new ForbiddenError({
              category: 'authorization',
              code: 'GUEST_EVENT_ACCESS_REQUIRED',
              userMessageKey: 'serverErrors.AUTHORIZATION',
            })
          )
        yield* db
          .update(eventParticipant)
          .set({ attendanceStatus: input.attendance, updatedAt: new Date() })
          .where(eq(eventParticipant.id, participation.id))
        yield* publishGuestParticipant(db, {
          scopeId: scope.parentId ?? input.eventId,
          participationId: participation.id,
          eventId: input.eventId,
          personId: participation.personId,
          name: participation.name,
          attendance: input.attendance,
        })
        return { eventId: input.eventId, attendance: input.attendance }
      })
    )
  })
}

export function leaveDeviceGuestEvent(input: {
  guestId: string
  credential: string
  eventId: string
}) {
  return Effect.gen(function* () {
    const pg = yield* PgClient
    return yield* pg.withTransaction(
      Effect.gen(function* () {
        const db = yield* DB
        const profile = yield* lockAuthenticatedGuestProfile(db, input.guestId, input.credential)
        if (profile.claimedAt || profile.claimedByUserId)
          return yield* Effect.fail(invalidGuestSession())
        const [scope] = yield* db
          .select({ parentId: event.parentEventId })
          .from(event)
          .where(eq(event.id, input.eventId))
          .limit(1)
        if (!scope) return { eventId: input.eventId }
        // Match admission/departure lock order so a roster refresh cannot race a
        // new participation in this event.
        yield* db
          .select({ id: event.id })
          .from(event)
          .where(eq(event.id, scope.parentId ?? input.eventId))
          .for('update')
        if (scope.parentId)
          yield* db
            .select({ id: event.id })
            .from(event)
            .where(eq(event.id, input.eventId))
            .for('update')
        const [participation] = yield* db
          .select({
            id: eventParticipant.id,
            personId: workspacePerson.id,
            name: workspacePerson.displayName,
            attendance: eventParticipant.attendanceStatus,
          })
          .from(eventParticipant)
          .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
          .where(
            and(
              eq(eventParticipant.eventId, input.eventId),
              eq(workspacePerson.guestProfileId, profile.id),
              eq(eventParticipant.role, 'guest')
            )
          )
          .limit(1)
          .for('update', { of: eventParticipant })
        if (!participation) return { eventId: input.eventId }
        yield* db.delete(eventParticipant).where(eq(eventParticipant.id, participation.id))
        yield* publishGuestParticipant(db, {
          scopeId: scope.parentId ?? input.eventId,
          participationId: participation.id,
          eventId: input.eventId,
          personId: participation.personId,
          name: participation.name,
          attendance: participation.attendance,
          operation: 'delete',
        })
        return { eventId: input.eventId }
      })
    )
  })
}

export function claimDeviceGuestProfile(input: {
  guestId: string
  credential: string
  userId: string
  account: { name: string; email: string; image: string | null }
}) {
  return Effect.gen(function* () {
    const pg = yield* PgClient
    return yield* pg.withTransaction(
      Effect.gen(function* () {
        const db = yield* DB
        const profile = yield* lockAuthenticatedGuestProfile(db, input.guestId, input.credential)
        if (profile.claimedAt && profile.claimedByUserId !== input.userId)
          return yield* Effect.fail(claimedByAnotherAccount())
        if (profile.claimedByUserId === input.userId) {
          const receipts = yield* db
            .select({ eventId: eventGuestClaim.eventId })
            .from(eventGuestClaim)
            .where(
              and(
                eq(eventGuestClaim.guestProfileId, profile.id),
                eq(eventGuestClaim.claimedByUserId, input.userId)
              )
            )
          return { claimedEventIds: receipts.map((receipt) => receipt.eventId) }
        }

        // The native sync writer serializes root -> child -> snapshot -> entity.
        // Discover this profile's roots, then take the same locks before locking
        // participation rows so a claim cannot invert the host mutation order.
        const initialEvents = yield* db
          .select({ eventId: eventParticipant.eventId, parentId: event.parentEventId })
          .from(workspacePerson)
          .innerJoin(eventParticipant, eq(eventParticipant.personId, workspacePerson.id))
          .innerJoin(event, eq(event.id, eventParticipant.eventId))
          .where(eq(workspacePerson.guestProfileId, profile.id))
        const rootIds = [...new Set(initialEvents.map((row) => row.parentId ?? row.eventId))].sort()
        const childIds = [
          ...new Set(initialEvents.flatMap((row) => (row.parentId ? [row.eventId] : []))),
        ].sort()
        for (const rootId of rootIds)
          yield* db.select({ id: event.id }).from(event).where(eq(event.id, rootId)).for('update')
        for (const childId of childIds)
          yield* db.select({ id: event.id }).from(event).where(eq(event.id, childId)).for('update')
        for (const rootId of rootIds)
          yield* db
            .select({ scopeId: nativeWorkspaceSnapshot.scopeId })
            .from(nativeWorkspaceSnapshot)
            .where(eq(nativeWorkspaceSnapshot.scopeId, rootId))
            .for('update')

        const guestPeople = yield* db
          .select({
            person: workspacePerson,
            eventId: eventParticipant.eventId,
            participation: eventParticipant,
          })
          .from(workspacePerson)
          .innerJoin(eventParticipant, eq(eventParticipant.personId, workspacePerson.id))
          .where(eq(workspacePerson.guestProfileId, profile.id))
          .for('update', { of: eventParticipant })
        const byPerson = new Map<string, typeof guestPeople>()
        for (const row of guestPeople) {
          const group = byPerson.get(row.person.id) ?? []
          group.push(row)
          byPerson.set(row.person.id, group)
        }

        const claimedEventIds = [...new Set(guestPeople.map((row) => row.eventId))]
        for (const rows of byPerson.values()) {
          const person = rows[0]!.person
          const [accountPerson] = yield* db
            .select({ id: workspacePerson.id })
            .from(workspacePerson)
            .where(
              and(
                eq(workspacePerson.organizationId, person.organizationId),
                eq(workspacePerson.userId, input.userId)
              )
            )
            .limit(1)
            .for('update')
          const destinationPersonId = accountPerson?.id ?? person.id

          for (const row of rows) {
            const [accountParticipation] = accountPerson
              ? yield* db
                  .select({ id: eventParticipant.id })
                  .from(eventParticipant)
                  .where(
                    and(
                      eq(eventParticipant.eventId, row.eventId),
                      eq(eventParticipant.personId, accountPerson.id)
                    )
                  )
                  .limit(1)
                  .for('update')
              : []
            const [departure] = yield* db
              .select({ eventId: eventDeparture.eventId })
              .from(eventDeparture)
              .where(
                and(
                  eq(eventDeparture.eventId, row.eventId),
                  eq(eventDeparture.userId, input.userId)
                )
              )
              .limit(1)
            if (accountParticipation || departure) {
              // The account's existing participation or explicit departure wins.
              yield* db
                .delete(eventParticipant)
                .where(eq(eventParticipant.id, row.participation.id))
              yield* publishGuestParticipant(db, {
                scopeId:
                  (yield* db
                    .select({ parentId: event.parentEventId })
                    .from(event)
                    .where(eq(event.id, row.eventId))
                    .limit(1))[0]?.parentId ?? row.eventId,
                participationId: row.participation.id,
                eventId: row.eventId,
                personId: person.id,
                name: person.displayName,
                attendance: row.participation.attendanceStatus,
                operation: 'delete',
                removePerson: Boolean(accountPerson),
              })
            } else if (accountPerson) {
              yield* db
                .update(eventParticipant)
                .set({ personId: destinationPersonId, updatedAt: new Date() })
                .where(eq(eventParticipant.id, row.participation.id))
              const [scope] = yield* db
                .select({ parentId: event.parentEventId })
                .from(event)
                .where(eq(event.id, row.eventId))
                .limit(1)
              yield* publishGuestParticipant(db, {
                scopeId: scope?.parentId ?? row.eventId,
                participationId: row.participation.id,
                eventId: row.eventId,
                personId: destinationPersonId,
                name: input.account.name,
                userID: input.userId,
                attendance: row.participation.attendanceStatus,
                preserveExistingPerson: true,
              })
            } else {
              // This is a verified identity link, not a role upgrade. Keep the guest role.
              yield* db
                .update(workspacePerson)
                .set({
                  userId: input.userId,
                  displayName: input.account.name,
                  email: input.account.email,
                  avatarUrl: input.account.image,
                  updatedAt: new Date(),
                })
                .where(eq(workspacePerson.id, person.id))
              const [scope] = yield* db
                .select({ parentId: event.parentEventId })
                .from(event)
                .where(eq(event.id, row.eventId))
                .limit(1)
              yield* publishGuestParticipant(db, {
                scopeId: scope?.parentId ?? row.eventId,
                participationId: row.participation.id,
                eventId: row.eventId,
                personId: person.id,
                name: input.account.name,
                userID: input.userId,
                attendance: row.participation.attendanceStatus,
              })
            }
            yield* db
              .update(eventInvitation)
              .set({ personId: destinationPersonId, updatedAt: new Date() })
              .where(eq(eventInvitation.personId, person.id))
            yield* db
              .insert(eventGuestClaim)
              .values({
                guestProfileId: profile.id,
                eventId: row.eventId,
                claimedByUserId: input.userId,
              })
              .onConflictDoNothing()
          }

          if (accountPerson) {
            yield* db.delete(workspacePerson).where(eq(workspacePerson.id, person.id))
          }
        }

        yield* db
          .update(eventGuestProfile)
          .set({ claimedByUserId: input.userId, claimedAt: new Date(), updatedAt: new Date() })
          .where(eq(eventGuestProfile.id, profile.id))
        return { claimedEventIds }
      })
    )
  })
}

import { PgClient } from "@effect/sql-pg/PgClient"
import { and, asc, eq, sql } from "drizzle-orm"
import { Effect } from "effect"
import { DB } from "@/db"
import { event, eventParticipant, workspacePerson, user, idea, eventMedia, ideaMedia, mediaAsset, nativeWorkspaceSnapshot, nativeSyncEntity, nativeSyncChange } from "@/db/schema"
import { guestIdeaContent } from "@/lib/guest-invitation-content"
import { ConflictError, ForbiddenError } from "@/server/effect"
import { visibleMediaPredicate } from "@/server/moderation/media-visibility"
import { blockedAuthorPredicate } from "@/server/moderation/user-block.repo"
import { retainedEventAccess } from "./event-departure.repo"

const iso = (date: Date | null) => date?.toISOString().replace(/\.\d{3}Z$/, "Z") ?? null

function mediaURL(asset: { bucket: string; storageKey: string } | undefined) {
  if (!asset) return Effect.succeed(null as string | null)
  return Effect.tryPromise(async () => {
    const { createMediaReadUrl } = await import("../../media/connectors/media-storage.con")
    return createMediaReadUrl({ bucket: asset.bucket, key: asset.storageKey })
  }).pipe(Effect.catch(() => Effect.logWarning("Invitation artwork could not be signed").pipe(Effect.as(null))))
}

/** Canonical, event-scoped projection. No replication table is read by this feed. */
export function guestEventInvitations(userId: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    const rows = yield* db.select({
      id: event.id, parentEventId: event.parentEventId, title: event.title,
      startsAt: event.startsAt, endsAt: event.endsAt, isAllDay: event.isAllDay, timeZone: event.timeZone,
      locationName: event.locationName, locationAddress: event.locationAddress,
      locationAddressLine2: event.locationAddressLine2, latitude: event.locationLatitude,
      longitude: event.locationLongitude, mapItemIdentifier: event.mapItemIdentifier,
      description: event.description, dressCode: event.dressCode,
      status: sql<string | null>`case when ${event.planningStatus}::text = 'cancelled' then 'cancelled' else coalesce(${event.status}::text, (select parent.status::text from event parent where parent.id = ${event.parentEventId})) end`,
      complete: event.completionStatus, viewerPersonId: workspacePerson.id,
      role: eventParticipant.role, attendance: eventParticipant.attendanceStatus,
    }).from(event).innerJoin(eventParticipant, eq(eventParticipant.eventId, event.id))
      .innerJoin(workspacePerson, and(eq(workspacePerson.id, eventParticipant.personId), eq(workspacePerson.organizationId, event.organizationId)))
      .where(and(eq(workspacePerson.userId, userId), retainedEventAccess(userId, event.id))).orderBy(asc(event.startsAt), asc(event.createdAt))
    const result = []
    for (const row of rows) {
      const people = yield* db.select({
        userId: workspacePerson.userId,
        id: workspacePerson.id, name: sql<string>`coalesce(${user.name}, ${workspacePerson.displayName})`,
        imageURL: sql<string | null>`coalesce(${user.image}, ${workspacePerson.avatarUrl})`,
        role: eventParticipant.role, attendance: eventParticipant.attendanceStatus,
      }).from(eventParticipant).innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
        .leftJoin(user, eq(user.id, workspacePerson.userId)).where(and(eq(eventParticipant.eventId, row.id), blockedAuthorPredicate(userId, workspacePerson.userId)))
      const published = yield* db.select({ id: idea.id, title: idea.title, note: idea.note,
        category: idea.category, configuration: idea.configuration, submittedByUserId: idea.submittedByUserId }).from(idea)
        .where(and(eq(idea.eventId, row.id), eq(idea.status, "approved"), eq(idea.guestVisibility, "shown_to_guests"), blockedAuthorPredicate(userId, idea.submittedByUserId)))
        .orderBy(asc(idea.createdAt))
      const covers = yield* db.select({ id: mediaAsset.id, bucket: mediaAsset.bucket, storageKey: mediaAsset.storageKey })
        .from(eventMedia).innerJoin(mediaAsset, eq(mediaAsset.id, eventMedia.mediaAssetId))
        .where(and(eq(eventMedia.eventId, row.id), eq(eventMedia.role, "cover"), visibleMediaPredicate(userId)))
        .orderBy(asc(eventMedia.sortOrder)).limit(1)
      const ideas = []
      for (const item of published) {
        const [cover] = yield* db.select({ id: mediaAsset.id, bucket: mediaAsset.bucket, storageKey: mediaAsset.storageKey })
          .from(ideaMedia).innerJoin(mediaAsset, eq(mediaAsset.id, ideaMedia.mediaAssetId))
          .where(and(eq(ideaMedia.ideaId, item.id), eq(ideaMedia.role, "cover"), visibleMediaPredicate(userId)))
          .orderBy(asc(ideaMedia.sortOrder)).limit(1)
        ideas.push({ id: item.id, category: item.category, title: item.title ?? "", note: item.note ?? "", submittedByUserId: item.submittedByUserId,
          ...guestIdeaContent(item.category, item.configuration), imageURL: yield* mediaURL(cover), imageId: cover?.id ?? null })
      }
      const gallery = yield* db.select({ id: mediaAsset.id, bucket: mediaAsset.bucket, storageKey: mediaAsset.storageKey,
        addedAt: eventMedia.createdAt, addedBy: user.name, addedByUserId: mediaAsset.uploadedByUserId })
        .from(eventMedia).innerJoin(mediaAsset, eq(mediaAsset.id, eventMedia.mediaAssetId))
        .leftJoin(user, eq(user.id, mediaAsset.uploadedByUserId))
        .where(and(eq(eventMedia.eventId, row.id), eq(eventMedia.role, "gallery"), visibleMediaPredicate(userId)))
        .orderBy(asc(eventMedia.sortOrder), asc(eventMedia.createdAt))
      const moments = []
      for (const photo of gallery) moments.push({ id: photo.id, imageURL: yield* mediaURL(photo), addedAt: iso(photo.addedAt), addedBy: photo.addedBy ?? "", addedByUserId: photo.addedByUserId })
      result.push({ ...row, startsAt: iso(row.startsAt), endsAt: iso(row.endsAt),
        coverURL: yield* mediaURL(covers[0]), coverId: covers[0]?.id ?? null, people, ideas, moments })
    }
    return result
  })
}

/** RSVP is a personal capability, never permission to edit the event or other people. */
export function respondToEvent(userId: string, eventId: string, attendance: "going" | "not_sure" | "not_going") {
  return Effect.gen(function* () {
    const pg = yield* PgClient
    return yield* pg.withTransaction(Effect.gen(function* () {
      const db = yield* DB
      const [scope] = yield* db.select({ parentId: event.parentEventId }).from(event).where(eq(event.id, eventId)).limit(1)
      if (!scope) return yield* Effect.fail(new ForbiddenError({ category: "authorization", code: "EVENT_RESPONSE_FORBIDDEN", userMessageKey: "serverErrors.EVENT_RESPONSE_FORBIDDEN" }))
      // Parent lifecycle is locked before a child. Cancellation cannot commit
      // between checking the parent status and accepting this RSVP.
      const [parent] = yield* db.select({ status: event.status }).from(event)
        .where(eq(event.id, scope.parentId ?? eventId)).limit(1).for("share")
      const [target] = yield* db.select({ id: event.id, parentId: event.parentEventId, status: event.status, planningStatus: event.planningStatus, complete: event.completionStatus })
        .from(event).where(eq(event.id, eventId)).limit(1).for("share")
      const [participation] = yield* db.select({ id: eventParticipant.id, personId: eventParticipant.personId,
        role: eventParticipant.role, permission: eventParticipant.planningPermission, createdAt: eventParticipant.createdAt })
        .from(eventParticipant).innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
        .where(and(eq(eventParticipant.eventId, eventId), eq(workspacePerson.userId, userId), retainedEventAccess(userId, eventParticipant.eventId))).limit(1)
      if (!target || !participation) return yield* Effect.fail(new ForbiddenError({
        category: "authorization", code: "EVENT_RESPONSE_FORBIDDEN", userMessageKey: "serverErrors.EVENT_RESPONSE_FORBIDDEN",
      }))
      if (target.status === "cancelled" || target.planningStatus === "cancelled" || parent?.status === "cancelled") return yield* Effect.fail(new ConflictError({
        category: "conflict", code: "EVENT_CANCELLED", userMessageKey: "serverErrors.EVENT_CANCELLED",
      }))
      if (target.status === "finished" || target.complete === "complete" || parent?.status === "finished") return yield* Effect.fail(new ConflictError({
        category: "conflict", code: "EVENT_COMPLETE", userMessageKey: "serverErrors.EVENT_COMPLETE",
      }))
      yield* db.update(eventParticipant).set({ attendanceStatus: attendance, updatedAt: new Date() }).where(eq(eventParticipant.id, participation.id))
      const scopeId = target.parentId ?? target.id
      const [snapshot] = yield* db.select().from(nativeWorkspaceSnapshot).where(eq(nativeWorkspaceSnapshot.scopeId, scopeId)).limit(1).for("update")
      if (snapshot) {
        const foundationDate = (date: Date) => (date.getTime() - Date.UTC(2001, 0, 1)) / 1000
        const value = { id: participation.id, eventID: eventId, memberID: participation.personId,
          role: participation.role, planningPermission: participation.permission === "view_only" ? "viewOnly" : participation.permission,
          attendance: ({ going: "going", not_sure: "maybe", not_going: "declined" } as const)[attendance],
          invitationStatus: "active", createdAt: foundationDate(participation.createdAt), updatedAt: foundationDate(new Date()) }
        const payload = Buffer.from(JSON.stringify(value)).toString("base64")
        const [entity] = yield* db.insert(nativeSyncEntity).values({ scopeId, entityType: "event_participation",
          entityId: participation.id, ownerUserId: snapshot.ownerUserId, payload }).onConflictDoUpdate({
          target: [nativeSyncEntity.scopeId, nativeSyncEntity.entityType, nativeSyncEntity.entityId],
          set: { payload, isDeleted: false, serverVersion: sql`${nativeSyncEntity.serverVersion} + 1`, updatedAt: new Date() },
        }).returning({ version: nativeSyncEntity.serverVersion })
        yield* db.insert(nativeSyncChange).values({ scopeId, ownerUserId: snapshot.ownerUserId, entityType: "event_participation",
          entityId: participation.id, operation: "upsert", payload, serverVersion: entity.version })
        const archive = JSON.parse(Buffer.from(snapshot.payload, "base64").toString("utf8"))
        archive.eventParticipations = [...(archive.eventParticipations ?? []).filter((item: { id: string }) => item.id.toLowerCase() !== value.id), value]
        if (scopeId === eventId) archive.members = (archive.members ?? []).map((person: { id: string }) =>
          person.id.toLowerCase() === value.memberID ? { ...person, attendance: value.attendance } : person)
        const archivePayload = Buffer.from(JSON.stringify(archive)).toString("base64")
        const [updated] = yield* db.update(nativeWorkspaceSnapshot).set({ payload: archivePayload,
          serverVersion: sql`${nativeWorkspaceSnapshot.serverVersion} + 1`, updatedAt: new Date() })
          .where(eq(nativeWorkspaceSnapshot.scopeId, scopeId)).returning({ version: nativeWorkspaceSnapshot.serverVersion })
        yield* db.insert(nativeSyncChange).values({ scopeId, ownerUserId: snapshot.ownerUserId, entityType: "workspace",
          entityId: scopeId, operation: "upsert", payload: archivePayload, serverVersion: updated.version })
      }
      return { eventId, attendance }
    }))
  })
}

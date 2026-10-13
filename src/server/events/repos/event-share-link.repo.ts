import { PgClient } from "@effect/sql-pg/PgClient"
import { eq } from "drizzle-orm"
import { Effect } from "effect"
import { z } from "zod"
import { DB } from "@/db"
import { event, eventShareLink, user } from "@/db/schema"
import { hasEventPermission, planningPermissionFromDatabase } from "@/lib/permissions"
import { EntityNotFoundError, ForbiddenError } from "@/server/effect"
import { acceptEventInvitation, createEventInvitation, getEventParticipant } from "./event.repo"
import { ShareLinkInput } from "../contracts/event.contracts"
import { requireJoinableEvent } from "./event-lifecycle.repo"
import { requireUnblockedInvitation } from "@/server/moderation/user-block.repo"

const unavailable = () => new EntityNotFoundError({
  category: "not_found", code: "SHARE_LINK_UNAVAILABLE",
  userMessageKey: "serverErrors.SHARE_LINK_UNAVAILABLE",
})

function requireManager(eventId: string, userId: string) {
  return Effect.gen(function* () {
    const participant = yield* getEventParticipant({ eventId, userId })
    if (!participant || !hasEventPermission({
      role: participant.role, planningPermission: planningPermissionFromDatabase(participant.planningPermission),
    }, { event: ["manage_participants"] })) {
      return yield* Effect.fail(new ForbiddenError({
        category: "authorization", code: "EVENT_PERMISSION_REQUIRED",
        userMessageKey: "serverErrors.EVENT_PERMISSION_REQUIRED",
      }))
    }
  })
}

export function createEventShareLink(actorUserId: string, input: z.infer<typeof ShareLinkInput>) {
  return Effect.gen(function* () {
    const sql = yield* PgClient
    return yield* sql.withTransaction(Effect.gen(function* () {
      const db = yield* DB
      yield* requireManager(input.eventId, actorUserId)
      yield* requireJoinableEvent(input.eventId)
      // Serialize create/revoke with the event row, including first-time creation.
      yield* db.select({ id: event.id }).from(event).where(eq(event.id, input.eventId)).for("update")
      const [existing] = yield* db.select().from(eventShareLink).where(eq(eventShareLink.eventId, input.eventId))
      if (existing && !existing.revokedAt && existing.expiresAt > new Date() && existing.role === input.role) return existing
      const [link] = yield* db.insert(eventShareLink).values({
        eventId: input.eventId, createdByUserId: actorUserId, role: input.role,
        expiresAt: new Date(Date.now() + 14 * 86400_000),
      }).onConflictDoUpdate({ target: eventShareLink.eventId, set: {
        token: crypto.randomUUID(), role: input.role, createdByUserId: actorUserId,
        expiresAt: new Date(Date.now() + 14 * 86400_000), revokedAt: null, updatedAt: new Date(),
      } }).returning()
      return link
    }))
  })
}

export function revokeEventShareLink(actorUserId: string, eventId: string) {
  return Effect.gen(function* () {
    const sql = yield* PgClient
    return yield* sql.withTransaction(Effect.gen(function* () {
      const db = yield* DB
      yield* requireManager(eventId, actorUserId)
      yield* db.select({ id: event.id }).from(event).where(eq(event.id, eventId)).for("update")
      yield* db.update(eventShareLink).set({ revokedAt: new Date(), updatedAt: new Date() }).where(eq(eventShareLink.eventId, eventId))
      // Revocation stops new joins; it does not remove people already admitted.
      return { eventId }
    }))
  })
}

/** Only deliberately public invitation content; never private planning payloads. */
export function previewEventShareLink(token: string, userId?: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [preview] = yield* db.select({
      title: event.title, startsAt: event.startsAt, locationName: event.locationName,
      role: eventShareLink.role, expiresAt: eventShareLink.expiresAt, revokedAt: eventShareLink.revokedAt,
      creatorId: eventShareLink.createdByUserId, eventId: eventShareLink.eventId,
    }).from(eventShareLink).innerJoin(event, eq(event.id, eventShareLink.eventId))
      .where(eq(eventShareLink.token, token)).limit(1)
    if (!preview) return null
    const joined = userId ? yield* getEventParticipant({ eventId: preview.eventId, userId }) : undefined
    if (joined) return { title: preview.title, startsAt: preview.startsAt?.toISOString() ?? null,
      locationName: preview.locationName, role: joined.role, status: "accepted" as const, expiresAt: preview.expiresAt.toISOString() }
    if (preview.revokedAt || preview.expiresAt <= new Date()) return null
    const creatorCanShare = yield* requireManager(preview.eventId, preview.creatorId).pipe(
      Effect.as(true), Effect.catchTag("ForbiddenError", () => Effect.succeed(false)),
    )
    if (!creatorCanShare) return null
    return { title: preview.title, startsAt: preview.startsAt?.toISOString() ?? null,
      locationName: preview.locationName, role: preview.role, status: "pending" as const,
      expiresAt: preview.expiresAt.toISOString() }
  })
}

export function acceptEventShareLink(userId: string, token: string) {
  return Effect.gen(function* () {
    const sql = yield* PgClient
    return yield* sql.withTransaction(Effect.gen(function* () {
      const db = yield* DB
      const [link] = yield* db.select().from(eventShareLink).where(eq(eventShareLink.token, token)).limit(1).for("update")
      if (!link) return yield* Effect.fail(unavailable())
      yield* requireUnblockedInvitation(userId, link.createdByUserId)
      const [account] = yield* db.select({ email: user.email, name: user.name, verified: user.emailVerified }).from(user).where(eq(user.id, userId)).limit(1)
      if (!account?.verified) return yield* Effect.fail(new ForbiddenError({
        category: "authorization", code: "INVITATION_EMAIL_UNVERIFIED",
        userMessageKey: "serverErrors.INVITATION_EMAIL_UNVERIFIED",
      }))
      // Joining is idempotent and never changes an existing participant's access.
      const existing = yield* getEventParticipant({ eventId: link.eventId, userId })
      if (existing) return { eventId: link.eventId, ...existing }
      yield* requireJoinableEvent(link.eventId)
      if (link.revokedAt || link.expiresAt <= new Date()) return yield* Effect.fail(unavailable())
      yield* requireManager(link.eventId, link.createdByUserId)
      // Reuse the canonical acceptance + native identity publication transaction.
      const invitation = yield* createEventInvitation({ actorUserId: link.createdByUserId,
        invitation: { eventId: link.eventId, email: account.email, name: account.name,
          role: link.role === "collaborator" ? "collaborator" : "guest",
          planningPermission: link.role === "collaborator" ? "manage" : "viewOnly" } })
      return yield* acceptEventInvitation({ userId, userEmail: account.email, invitation: { token: invitation.token } })
    }))
  })
}

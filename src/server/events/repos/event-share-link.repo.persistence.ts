import { PgClient } from '@effect/sql-pg/PgClient'
import { and, eq } from 'drizzle-orm'
import { Effect } from 'effect'
import { z } from 'zod'
import { DB } from '@/db'
import {
  event,
  eventShareLink,
  eventJoinRequest,
  workspacePlanningSettings,
  user,
} from '@/db/schema'
import { hasEventPermission, planningPermissionFromDatabase } from '@/lib/permissions'
import { EntityNotFoundError, ForbiddenError } from '@/server/effect'
import {
  acceptEventInvitation,
  createEventInvitation,
  getEventParticipant,
} from './event.repo.persistence'
import { ShareLinkInput } from '../contracts/event.contracts'
import { requireJoinableEvent } from './event-lifecycle.repo'
import { requireUnblockedInvitation } from '@/server/moderation/repos/user-block.repo.live'

const unavailable = () =>
  new EntityNotFoundError({
    category: 'not_found',
    code: 'SHARE_LINK_UNAVAILABLE',
    userMessageKey: 'serverErrors.SHARE_LINK_UNAVAILABLE',
  })

function requireManager(eventId: string, userId: string) {
  return Effect.gen(function* () {
    const participant = yield* getEventParticipant({ eventId, userId })
    if (
      !participant ||
      !hasEventPermission(
        {
          role: participant.role,
          planningPermission: planningPermissionFromDatabase(participant.planningPermission),
        },
        { event: ['manage_participants'] }
      )
    ) {
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'EVENT_PERMISSION_REQUIRED',
          userMessageKey: 'serverErrors.EVENT_PERMISSION_REQUIRED',
        })
      )
    }
  })
}

function sharingPolicy(eventId: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [row] = yield* db
      .select({ settings: workspacePlanningSettings })
      .from(event)
      .leftJoin(
        workspacePlanningSettings,
        eq(workspacePlanningSettings.organizationId, event.organizationId)
      )
      .where(eq(event.id, eventId))
      .limit(1)
    return {
      enabled: row?.settings?.collaboratorLinkEnabled ?? true,
      requiresApproval: row?.settings?.requiresCollaboratorApproval ?? true,
      permission: row?.settings?.defaultCollaboratorPermission ?? 'contribute',
    }
  })
}

// Use the same root -> event lock order as invitation acceptance and lifecycle changes.
function lockEvent(eventId: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [target] = yield* db
      .select({ parent: event.parentEventId })
      .from(event)
      .where(eq(event.id, eventId))
      .limit(1)
    if (!target) return yield* Effect.fail(unavailable())
    yield* db
      .select({ id: event.id })
      .from(event)
      .where(eq(event.id, target.parent ?? eventId))
      .for('update')
    if (target.parent)
      yield* db.select({ id: event.id }).from(event).where(eq(event.id, eventId)).for('update')
  })
}

export function createEventShareLink(actorUserId: string, input: z.infer<typeof ShareLinkInput>) {
  return Effect.gen(function* () {
    const sql = yield* PgClient
    return yield* sql.withTransaction(
      Effect.gen(function* () {
        const db = yield* DB
        yield* lockEvent(input.eventId)
        yield* requireManager(input.eventId, actorUserId)
        yield* requireJoinableEvent(input.eventId)
        if (input.role === 'collaborator' && !(yield* sharingPolicy(input.eventId)).enabled)
          return yield* Effect.fail(unavailable())
        // Serialize create/revoke with the event row, including first-time creation.
        yield* db
          .select({ id: event.id })
          .from(event)
          .where(eq(event.id, input.eventId))
          .for('update')
        const [existing] = yield* db
          .select()
          .from(eventShareLink)
          .where(eq(eventShareLink.eventId, input.eventId))
        if (
          existing &&
          !existing.revokedAt &&
          existing.expiresAt > new Date() &&
          existing.role === input.role
        )
          return existing
        const [link] = yield* db
          .insert(eventShareLink)
          .values({
            eventId: input.eventId,
            createdByUserId: actorUserId,
            role: input.role,
            expiresAt: new Date(Date.now() + 14 * 86400_000),
          })
          .onConflictDoUpdate({
            target: eventShareLink.eventId,
            set: {
              token: crypto.randomUUID(),
              role: input.role,
              createdByUserId: actorUserId,
              expiresAt: new Date(Date.now() + 14 * 86400_000),
              revokedAt: null,
              updatedAt: new Date(),
            },
          })
          .returning()
        return link
      })
    )
  })
}

export function revokeEventShareLink(actorUserId: string, eventId: string) {
  return Effect.gen(function* () {
    const sql = yield* PgClient
    return yield* sql.withTransaction(
      Effect.gen(function* () {
        const db = yield* DB
        yield* lockEvent(eventId)
        yield* requireManager(eventId, actorUserId)
        yield* db.select({ id: event.id }).from(event).where(eq(event.id, eventId)).for('update')
        yield* db
          .update(eventShareLink)
          .set({ revokedAt: new Date(), updatedAt: new Date() })
          .where(eq(eventShareLink.eventId, eventId))
        // Revocation stops new joins; it does not remove people already admitted.
        return { eventId }
      })
    )
  })
}

/** Only deliberately public invitation content; never private planning payloads. */
export function previewEventShareLink(token: string, userId?: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [preview] = yield* db
      .select({
        title: event.title,
        startsAt: event.startsAt,
        locationName: event.locationName,
        role: eventShareLink.role,
        expiresAt: eventShareLink.expiresAt,
        revokedAt: eventShareLink.revokedAt,
        creatorId: eventShareLink.createdByUserId,
        eventId: eventShareLink.eventId,
      })
      .from(eventShareLink)
      .innerJoin(event, eq(event.id, eventShareLink.eventId))
      .where(eq(eventShareLink.token, token))
      .limit(1)
    if (!preview) return null
    const joined = userId
      ? yield* getEventParticipant({ eventId: preview.eventId, userId })
      : undefined
    if (joined)
      return {
        title: preview.title,
        startsAt: preview.startsAt?.toISOString() ?? null,
        locationName: preview.locationName,
        role: joined.role,
        status: 'accepted' as const,
        expiresAt: preview.expiresAt.toISOString(),
      }
    if (preview.revokedAt || preview.expiresAt <= new Date()) return null
    const creatorCanShare = yield* requireManager(preview.eventId, preview.creatorId).pipe(
      Effect.as(true),
      Effect.catchTag('ForbiddenError', () => Effect.succeed(false))
    )
    if (!creatorCanShare) return null
    const policy = yield* sharingPolicy(preview.eventId)
    if (preview.role === 'collaborator' && !policy.enabled) return null
    const [request] = userId
      ? yield* db
          .select()
          .from(eventJoinRequest)
          .where(
            and(
              eq(eventJoinRequest.eventId, preview.eventId),
              eq(eventJoinRequest.userId, userId),
              eq(eventJoinRequest.shareLinkToken, token)
            )
          )
          .limit(1)
      : []
    return {
      title: preview.title,
      startsAt: preview.startsAt?.toISOString() ?? null,
      locationName: preview.locationName,
      role: preview.role,
      status:
        request?.status === 'declined'
          ? 'declined'
          : request?.status === 'pending'
            ? 'awaiting_approval'
            : 'pending',
      requiresApproval: preview.role === 'collaborator' && policy.requiresApproval,
      planningPermission: preview.role === 'collaborator' ? policy.permission : 'view_only',
      expiresAt: preview.expiresAt.toISOString(),
    }
  })
}

export function getEventIdForShareLink(token: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [link] = yield* db
      .select({ eventId: eventShareLink.eventId })
      .from(eventShareLink)
      .where(eq(eventShareLink.token, token))
      .limit(1)
    return link?.eventId ?? null
  })
}

export function acceptEventShareLink(userId: string, token: string) {
  return Effect.gen(function* () {
    const sql = yield* PgClient
    return yield* sql.withTransaction(
      Effect.gen(function* () {
        const db = yield* DB
        const [target] = yield* db
          .select()
          .from(eventShareLink)
          .where(eq(eventShareLink.token, token))
          .limit(1)
        if (!target) return yield* Effect.fail(unavailable())
        yield* lockEvent(target.eventId)
        const [link] = yield* db
          .select()
          .from(eventShareLink)
          .where(eq(eventShareLink.token, token))
          .limit(1)
          .for('update')
        if (!link) return yield* Effect.fail(unavailable())
        yield* requireUnblockedInvitation(userId, link.createdByUserId)
        const [account] = yield* db
          .select({
            email: user.email,
            name: user.name,
            verified: user.emailVerified,
          })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1)
        if (!account?.verified)
          return yield* Effect.fail(
            new ForbiddenError({
              category: 'authorization',
              code: 'INVITATION_EMAIL_UNVERIFIED',
              userMessageKey: 'serverErrors.INVITATION_EMAIL_UNVERIFIED',
            })
          )
        // Joining is idempotent and never changes an existing participant's access.
        const existing = yield* getEventParticipant({
          eventId: link.eventId,
          userId,
        })
        if (existing)
          return {
            eventId: link.eventId,
            ...existing,
            status: 'accepted' as const,
          }
        yield* requireJoinableEvent(link.eventId)
        if (link.revokedAt || link.expiresAt <= new Date()) return yield* Effect.fail(unavailable())
        yield* requireManager(link.eventId, link.createdByUserId)
        const policy = yield* sharingPolicy(link.eventId)
        if (link.role === 'collaborator') {
          if (!policy.enabled) return yield* Effect.fail(unavailable())
          const [request] = yield* db
            .select()
            .from(eventJoinRequest)
            .where(
              and(eq(eventJoinRequest.eventId, link.eventId), eq(eventJoinRequest.userId, userId))
            )
            .limit(1)
          if (request?.shareLinkToken === token && request.status === 'declined')
            return yield* Effect.fail(unavailable())
          // A queued request still needs an explicit review if the policy changes later.
          if (
            policy.requiresApproval ||
            (request?.shareLinkToken === token && request.status === 'pending')
          ) {
            yield* db
              .insert(eventJoinRequest)
              .values({ eventId: link.eventId, userId, shareLinkToken: token })
              .onConflictDoUpdate({
                target: [eventJoinRequest.eventId, eventJoinRequest.userId],
                set: {
                  shareLinkToken: token,
                  status: 'pending',
                  reviewedByUserId: null,
                  updatedAt: new Date(),
                },
              })
            return {
              eventId: link.eventId,
              role: 'collaborator' as const,
              status: 'awaiting_approval' as const,
            }
          }
        }
        // Reuse the canonical acceptance + native identity publication transaction.
        const invitation = yield* createEventInvitation({
          actorUserId: link.createdByUserId,
          invitation: {
            eventId: link.eventId,
            email: account.email,
            name: account.name,
            role: link.role === 'collaborator' ? 'collaborator' : 'guest',
            planningPermission:
              link.role === 'collaborator'
                ? planningPermissionFromDatabase(policy.permission)
                : 'viewOnly',
          },
        })
        return {
          ...(yield* acceptEventInvitation({
            userId,
            userEmail: account.email,
            invitation: { token: invitation.token },
          })),
          status: 'accepted' as const,
        }
      })
    )
  })
}

export function listEventJoinRequests(actorUserId: string, eventId: string) {
  return Effect.gen(function* () {
    yield* requireManager(eventId, actorUserId)
    const db = yield* DB
    const policy = yield* sharingPolicy(eventId)
    const [link] = yield* db
      .select()
      .from(eventShareLink)
      .where(eq(eventShareLink.eventId, eventId))
      .limit(1)
    if (
      !policy.enabled ||
      !link ||
      link.role !== 'collaborator' ||
      link.revokedAt ||
      link.expiresAt <= new Date()
    )
      return { requests: [] }
    const rows = yield* db
      .select({
        id: eventJoinRequest.id,
        name: user.name,
        email: user.email,
        createdAt: eventJoinRequest.createdAt,
      })
      .from(eventJoinRequest)
      .innerJoin(user, eq(user.id, eventJoinRequest.userId))
      .where(
        and(
          eq(eventJoinRequest.eventId, eventId),
          eq(eventJoinRequest.shareLinkToken, link.token),
          eq(eventJoinRequest.status, 'pending')
        )
      )
      .orderBy(eventJoinRequest.createdAt)
    return {
      requests: rows.map((row) => ({
        ...row,
        planningPermission: policy.permission,
      })),
    }
  })
}

export function reviewEventJoinRequest(
  actorUserId: string,
  eventId: string,
  requestId: string,
  action: 'approve' | 'decline'
) {
  return Effect.gen(function* () {
    const sql = yield* PgClient
    return yield* sql.withTransaction(
      Effect.gen(function* () {
        const db = yield* DB
        yield* lockEvent(eventId)
        yield* requireManager(eventId, actorUserId)
        const [request] = yield* db
          .select()
          .from(eventJoinRequest)
          .where(and(eq(eventJoinRequest.id, requestId), eq(eventJoinRequest.eventId, eventId)))
          .limit(1)
          .for('update')
        if (!request) return yield* Effect.fail(unavailable())
        const status = action === 'approve' ? 'approved' : 'declined'
        if (request.status === status) return { status }
        if (request.status !== 'pending') return yield* Effect.fail(unavailable())
        if (action === 'approve') {
          yield* requireJoinableEvent(eventId)
          const [link] = yield* db
            .select()
            .from(eventShareLink)
            .where(eq(eventShareLink.eventId, eventId))
            .limit(1)
          const policy = yield* sharingPolicy(eventId)
          if (
            !policy.enabled ||
            !link ||
            link.token !== request.shareLinkToken ||
            link.role !== 'collaborator' ||
            link.revokedAt ||
            link.expiresAt <= new Date()
          )
            return yield* Effect.fail(unavailable())
          yield* requireManager(eventId, link.createdByUserId)
          yield* requireUnblockedInvitation(request.userId, actorUserId)
          yield* requireUnblockedInvitation(request.userId, link.createdByUserId)
          const [account] = yield* db
            .select()
            .from(user)
            .where(eq(user.id, request.userId))
            .limit(1)
          if (!account?.emailVerified) return yield* Effect.fail(unavailable())
          const existing = yield* getEventParticipant({
            eventId,
            userId: request.userId,
          })
          if (!existing) {
            const invitation = yield* createEventInvitation({
              actorUserId,
              invitation: {
                eventId,
                email: account.email,
                name: account.name,
                role: 'collaborator',
                planningPermission: planningPermissionFromDatabase(policy.permission),
              },
            })
            yield* acceptEventInvitation({
              userId: request.userId,
              userEmail: account.email,
              invitation: { token: invitation.token },
            })
          }
        }
        yield* db
          .update(eventJoinRequest)
          .set({ status, reviewedByUserId: actorUserId, updatedAt: new Date() })
          .where(eq(eventJoinRequest.id, requestId))
        return { status }
      })
    )
  })
}

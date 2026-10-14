import { PgClient } from '@effect/sql-pg/PgClient'
import { and, asc, eq, isNull, isNotNull, or, sql } from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import type { z } from 'zod'
import { DB } from '@/db'
import {
  abuseReport,
  abuseReportReview,
  hiddenMedia,
  moderationStaff,
  mediaAsset,
  user,
  userBlock,
  workspacePerson,
  eventParticipant,
  event,
  eventMedia,
} from '@/db/schema'
import { ConflictError, EntityNotFoundError, ForbiddenError } from '@/server/effect'
import {
  getEventMediaAccessContext,
  getNativeMediaAccessContext,
} from '@/server/media/repos/media.repo.compat'
import { nextReportStatus } from '../contracts'
import { retainedEventAccess } from '@/server/events/repos/event-departure.repo'
import type { ReportImageInput, ReviewReportInput, reportStatuses } from '../contracts'
import { ModerationRepo } from './moderation.repo'

const unavailable = () =>
  new EntityNotFoundError({
    category: 'not_found',
    code: 'REPORT_IMAGE_UNAVAILABLE',
    userMessageKey: 'serverErrors.REPORT_IMAGE_UNAVAILABLE',
  })
export function requireModerator(userId: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [staff] = yield* db
      .select({ id: moderationStaff.userId })
      .from(moderationStaff)
      .innerJoin(user, eq(user.id, moderationStaff.userId))
      .where(
        and(
          eq(moderationStaff.userId, userId),
          isNull(moderationStaff.revokedAt),
          eq(user.emailVerified, true)
        )
      )
      .limit(1)
      .for('share')
    if (!staff)
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'MODERATOR_REQUIRED',
          userMessageKey: 'serverErrors.MODERATOR_REQUIRED',
        })
      )
  })
}

function requireImageAccess(userId: string, mediaAssetId: string) {
  return Effect.gen(function* () {
    // Resolve the actual asset's event/workspace, never activeOrganizationId.
    const access =
      (yield* getNativeMediaAccessContext({ userId, mediaAssetId })) ??
      (yield* getEventMediaAccessContext({ userId, mediaAssetId }))
    if (!access) return yield* Effect.fail(unavailable())
    const db = yield* DB
    const [asset] = yield* db
      .select()
      .from(mediaAsset)
      .where(eq(mediaAsset.id, mediaAssetId))
      .limit(1)
    if (!asset || asset.kind !== 'image' || asset.status !== 'ready')
      return yield* Effect.fail(unavailable())
    return asset
  })
}

export function hideImage(userId: string, mediaAssetId: string) {
  return Effect.gen(function* () {
    yield* requireImageAccess(userId, mediaAssetId)
    const db = yield* DB
    yield* db.insert(hiddenMedia).values({ userId, mediaAssetId }).onConflictDoNothing()
    return { mediaAssetId, hidden: true as const }
  })
}

/** Native clients also filter locally cached images; never expose global IDs
 * from workspaces the requesting account cannot read. */
export function hiddenImageIDs(userId: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    const personal = yield* db
      .select({ id: hiddenMedia.mediaAssetId })
      .from(hiddenMedia)
      .where(eq(hiddenMedia.userId, userId))
    const moderated = yield* db
      .select({ id: mediaAsset.id })
      .from(mediaAsset)
      .where(
        and(
          or(
            isNotNull(mediaAsset.moderationHiddenAt),
            sql`exists (select 1 from ${userBlock} where ${userBlock.userId} = ${userId} and ${userBlock.blockedUserId} = ${mediaAsset.uploadedByUserId})`
          ),
          sql`exists (select 1 from ${workspacePerson} inner join ${eventParticipant} on ${eventParticipant.personId} = ${workspacePerson.id}
        inner join ${event} on ${event.id} = ${eventParticipant.eventId}
        where ${workspacePerson.userId} = ${userId} and ${workspacePerson.organizationId} = ${mediaAsset.organizationId}
        and ${retainedEventAccess(userId, event.id)}
        and ${event.organizationId} = ${mediaAsset.organizationId} and (
          (${event.parentEventId} is null and ${eventParticipant.role} in ('host', 'collaborator')) or
          exists (select 1 from ${eventMedia} where ${eventMedia.mediaAssetId} = ${mediaAsset.id} and ${eventMedia.eventId} = ${event.id})))`
        )
      )
    return { mediaAssetIds: [...new Set([...personal, ...moderated].map((item) => item.id))] }
  })
}

export function reportImage(userId: string, input: z.infer<typeof ReportImageInput>) {
  return Effect.gen(function* () {
    const pg = yield* PgClient
    return yield* pg.withTransaction(
      Effect.gen(function* () {
        const asset = yield* requireImageAccess(userId, input.mediaAssetId)
        const db = yield* DB
        yield* db
          .insert(hiddenMedia)
          .values({ userId, mediaAssetId: asset.id })
          .onConflictDoNothing()
        const values = {
          reporterUserId: userId,
          mediaAssetId: asset.id,
          reportedUserId: asset.uploadedByUserId,
          reason: input.reason,
          detail: input.detail,
        }
        const [created] = yield* db
          .insert(abuseReport)
          .values(values)
          .onConflictDoNothing()
          .returning({ id: abuseReport.id, status: abuseReport.status })
        const [existing] = created
          ? []
          : yield* db
              .select({ id: abuseReport.id, status: abuseReport.status })
              .from(abuseReport)
              .where(
                and(eq(abuseReport.reporterUserId, userId), eq(abuseReport.mediaAssetId, asset.id))
              )
              .limit(1)
        return {
          reportId: (created ?? existing).id,
          status: (created ?? existing).status,
          mediaAssetId: asset.id,
          hidden: true as const,
        }
      })
    )
  })
}

export function listAbuseReports(actorUserId: string, status: (typeof reportStatuses)[number]) {
  return Effect.gen(function* () {
    yield* requireModerator(actorUserId)
    const db = yield* DB
    // Bounded queues; reviewer can move oldest reports out of the active queue.
    const reports = yield* db
      .select({
        id: abuseReport.id,
        mediaAssetId: abuseReport.mediaAssetId,
        reason: abuseReport.reason,
        detail: abuseReport.detail,
        status: abuseReport.status,
        resolution: abuseReport.resolution,
        createdAt: abuseReport.createdAt,
        updatedAt: abuseReport.updatedAt,
        imageHidden: mediaAsset.moderationHiddenAt,
      })
      .from(abuseReport)
      .leftJoin(mediaAsset, eq(mediaAsset.id, abuseReport.mediaAssetId))
      .where(eq(abuseReport.status, status))
      .orderBy(asc(abuseReport.createdAt))
      .limit(100)
    return reports
  })
}

export function reviewAbuseReport(actorUserId: string, input: z.infer<typeof ReviewReportInput>) {
  return Effect.gen(function* () {
    const pg = yield* PgClient
    return yield* pg.withTransaction(
      Effect.gen(function* () {
        yield* requireModerator(actorUserId)
        const db = yield* DB
        const [report] = yield* db
          .select()
          .from(abuseReport)
          .where(eq(abuseReport.id, input.reportId))
          .limit(1)
          .for('update')
        if (!report)
          return yield* Effect.fail(
            new EntityNotFoundError({
              category: 'not_found',
              code: 'REPORT_NOT_FOUND',
              userMessageKey: 'serverErrors.REPORT_NOT_FOUND',
            })
          )
        const status = nextReportStatus(report.status, input.action)
        if (report.status !== input.expectedStatus || !status)
          return yield* Effect.fail(
            new ConflictError({
              category: 'conflict',
              code: 'REPORT_REVIEW_CONFLICT',
              userMessageKey: 'serverErrors.REPORT_REVIEW_CONFLICT',
            })
          )
        if (input.action === 'hide_image' && report.mediaAssetId) {
          yield* db
            .update(mediaAsset)
            .set({ moderationHiddenAt: new Date(), updatedAt: new Date() })
            .where(eq(mediaAsset.id, report.mediaAssetId))
        }
        // Dismissing another report must never restore an already-hidden image.
        yield* db
          .update(abuseReport)
          .set({
            status,
            resolution: status === 'resolved' ? 'hidden' : status === 'dismissed' ? 'kept' : null,
            reviewedByUserId: actorUserId,
            updatedAt: new Date(),
          })
          .where(eq(abuseReport.id, report.id))
        yield* db.insert(abuseReportReview).values({
          reportId: report.id,
          actorUserId,
          previousStatus: report.status,
          status,
          action: input.action,
          note: input.note,
        })
        return { reportId: report.id, status }
      })
    )
  })
}

export function reportImagePreviewAsset(actorUserId: string, reportId: string) {
  return Effect.gen(function* () {
    yield* requireModerator(actorUserId)
    const db = yield* DB
    const [asset] = yield* db
      .select({ bucket: mediaAsset.bucket, key: mediaAsset.storageKey })
      .from(abuseReport)
      .innerJoin(mediaAsset, eq(mediaAsset.id, abuseReport.mediaAssetId))
      .where(and(eq(abuseReport.id, reportId), eq(mediaAsset.status, 'ready')))
      .limit(1)
    if (!asset) return yield* Effect.fail(unavailable())
    return asset
  })
}

/** Legacy direct repository export retained for existing internal callers. */
export function reportImagePreview(actorUserId: string, reportId: string) {
  return Effect.gen(function* () {
    const asset = yield* reportImagePreviewAsset(actorUserId, reportId)
    const { createMediaReadUrl } = yield* Effect.tryPromise(
      () => import('@/server/media/connectors/media-storage.con')
    )
    const url = yield* Effect.tryPromise(() =>
      createMediaReadUrl({ ...asset, expiresInSeconds: 60 })
    )
    return { url }
  })
}

export const ModerationRepoLive = Layer.effect(
  ModerationRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const bindPg = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
      effect.pipe(Effect.provideService(PgClient, pg))
    return {
      requireModerator: (userId) => bindPg(requireModerator(userId)),
      hideImage: (userId, mediaAssetId) => bindPg(hideImage(userId, mediaAssetId)),
      hiddenImageIDs: (userId) => bindPg(hiddenImageIDs(userId)),
      reportImage: (userId, input) => bindPg(reportImage(userId, input)),
      listAbuseReports: (userId, status) => bindPg(listAbuseReports(userId, status)),
      reviewAbuseReport: (userId, input) => bindPg(reviewAbuseReport(userId, input)),
      reportImagePreviewAsset: (userId, reportId) =>
        bindPg(reportImagePreviewAsset(userId, reportId)),
    }
  })
)

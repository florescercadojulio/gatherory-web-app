import { readFile } from 'node:fs/promises'
import { expect, it } from '@effect/vitest'
import { Cause, Data, Effect, Exit } from 'effect'
import { eq } from 'drizzle-orm'

it.effect(
  'local moderation authorization, atomic reviews, personal hiding, and read denial',
  () =>
    Effect.gen(function* () {
      const url = new URL(process.env.DATABASE_URL!)
      expect(
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
        'Only local PostgreSQL is allowed'
      ).toBeTruthy()
      const { DB, PgClientLive } = yield* Effect.promise(() => import('@/db'))
      const { PgClient } = yield* Effect.promise(() => import('@effect/sql-pg/PgClient'))
      const {
        user,
        organization,
        event,
        eventParticipant,
        workspacePerson,
        mediaAsset,
        eventMedia,
        abuseReport,
        abuseReportReview,
        hiddenMedia,
        moderationStaff,
        eventDeparture,
      } = yield* Effect.promise(() => import('@/db/schema'))
      const {
        reportImage,
        hideImage,
        hiddenImageIDs,
        listAbuseReports,
        reviewAbuseReport,
        requireModerator,
      } = yield* Effect.promise(() => import('@/server/moderation/moderation.repo'))
      const { canReadMedia } = yield* Effect.promise(
        () => import('@/server/moderation/media-visibility')
      )
      const {
        getNativeMediaUrlWorkflow,
        getEventMediaUrlWorkflow,
        finalizeNativeMediaUploadWorkflow,
      } = yield* Effect.promise(() => import('@/server/media/workflows/media.workflows'))
      const { blockPerson, unblockPerson, listBlockedPeople, requireUnblockedInvitation } =
        yield* Effect.promise(() => import('@/server/moderation/user-block.repo'))
      const { leaveGuestEvent } = yield* Effect.promise(
        () => import('@/server/events/repos/event-departure.repo')
      )
      const { guestEventInvitations, respondToEvent } = yield* Effect.promise(
        () => import('@/server/events/repos/guest-invitation.repo')
      )
      // Migration DDL is itself rolled back. Do not migrate or reset the user's DB.
      const migrations = ['20261013150431_useful_swordsman', '20261013150814_concerned_legion']
      class Rollback extends Data.TaggedError('ModerationVerificationRollback')<{}> {}
      const denied = (exit: Exit.Exit<unknown, unknown>, code: string) =>
        expect(
          Exit.isFailure(exit) &&
            exit.cause.reasons.some(
              (reason) =>
                Cause.isFailReason(reason) &&
                typeof reason.error === 'object' &&
                reason.error !== null &&
                'code' in reason.error &&
                reason.error.code === code
            ),
          Exit.isFailure(exit) ? Cause.pretty(exit.cause) : `Expected ${code}`
        ).toBeTruthy()
      const verification = Effect.gen(function* () {
        const pg = yield* PgClient
        yield* pg.withTransaction(
          Effect.gen(function* () {
            const [installed] = yield* pg<{
              name: string | null
            }>`select to_regclass('public.abuse_report')::text as name`
            if (!installed.name) {
              for (const migration of migrations) {
                const source = yield* Effect.tryPromise(() =>
                  readFile(
                    new URL(`../../drizzle/${migration}/migration.sql`, import.meta.url),
                    'utf8'
                  )
                )
                for (const statement of source
                  .split('--> statement-breakpoint')
                  .filter((value) => value.trim()))
                  yield* pg.unsafe(statement)
              }
            }
            const [blocksInstalled] = yield* pg<{
              name: string | null
            }>`select to_regclass('public.user_block')::text as name`
            if (!blocksInstalled.name) {
              const source = yield* Effect.tryPromise(() =>
                readFile(
                  new URL(
                    '../../drizzle/20261013155056_secret_whistler/migration.sql',
                    import.meta.url
                  ),
                  'utf8'
                )
              )
              for (const statement of source
                .split('--> statement-breakpoint')
                .filter((value) => value.trim()))
                yield* pg.unsafe(statement)
            }
            const db = yield* DB
            const [departureInstalled] = yield* pg<{
              name: string | null
            }>`select to_regclass('public.event_departure')::text as name`
            if (!departureInstalled.name) {
              const source = yield* Effect.tryPromise(() =>
                readFile(
                  new URL(
                    '../../drizzle/20261013161335_new_human_torch/migration.sql',
                    import.meta.url
                  ),
                  'utf8'
                )
              )
              for (const statement of source
                .split('--> statement-breakpoint')
                .filter((value) => value.trim()))
                yield* pg.unsafe(statement)
            }
            const suffix = crypto.randomUUID()
            const owner = `mod-owner-${suffix}`,
              guest = `mod-guest-${suffix}`,
              otherGuest = `mod-other-${suffix}`,
              stranger = `mod-stranger-${suffix}`,
              moderator = `mod-staff-${suffix}`
            const organizationId = `mod-org-${suffix}`,
              eventId = crypto.randomUUID(),
              mediaAssetId = crypto.randomUUID()
            yield* db.insert(user).values(
              [owner, guest, otherGuest, stranger, moderator].map((id) => ({
                id,
                name: 'Test',
                email: `${id}@example.com`,
                emailVerified: true,
              }))
            )
            yield* db.insert(organization).values({
              id: organizationId,
              name: 'Moderation verification',
              slug: organizationId,
              createdAt: new Date(),
            })
            yield* db.insert(event).values({
              id: eventId,
              organizationId,
              title: 'Moderation verification',
              status: 'draft',
              startsAt: new Date(),
              timeZone: 'America/Detroit',
            })
            for (const id of [owner, guest, otherGuest]) {
              const [person] = yield* db
                .insert(workspacePerson)
                .values({ organizationId, userId: id, displayName: 'Test' })
                .returning()
              yield* db.insert(eventParticipant).values({
                eventId,
                personId: person.id,
                role: id === owner ? 'host' : 'guest',
                planningPermission: id === owner ? 'manage' : 'view_only',
              })
            }
            yield* db.insert(mediaAsset).values({
              id: mediaAssetId,
              organizationId,
              uploadedByUserId: owner,
              kind: 'image',
              status: 'ready',
              bucket: 'verification-no-object',
              storageKey: `verification/${mediaAssetId}`,
              originalFilename: 'photo.png',
              contentType: 'image/png',
              byteSize: 100,
            })
            yield* db
              .insert(eventMedia)
              .values({ organizationId, eventId, mediaAssetId, role: 'gallery' })
            denied(yield* Effect.exit(blockPerson(guest, guest)), 'BLOCK_SELF_FORBIDDEN')
            denied(yield* Effect.exit(blockPerson(stranger, owner)), 'BLOCK_TARGET_UNAVAILABLE')
            yield* blockPerson(guest, owner)
            yield* blockPerson(guest, owner)
            expect(
              (yield* listBlockedPeople(guest)).blockedUsers.length,
              'Block retries are idempotent'
            ).toBe(1)
            expect(
              (yield* listBlockedPeople(otherGuest)).blockedUsers.length,
              'Blocks are personal'
            ).toBe(0)
            expect(
              yield* canReadMedia(guest, mediaAssetId),
              "A blocked author's photos are hidden"
            ).toBe(false)
            expect(yield* canReadMedia(otherGuest, mediaAssetId)).toBe(true)
            expect(
              (yield* hiddenImageIDs(guest)).mediaAssetIds.includes(mediaAssetId),
              'Cached photos receive the block policy'
            ).toBeTruthy()
            expect(
              (yield* db
                .select()
                .from(eventParticipant)
                .where(eq(eventParticipant.eventId, eventId))).length,
              'Blocking never removes shared access'
            ).toBe(3)
            denied(
              yield* Effect.exit(requireUnblockedInvitation(guest, owner)),
              'INVITATION_BLOCKED'
            )
            denied(
              yield* Effect.exit(requireUnblockedInvitation(owner, guest)),
              'INVITATION_BLOCKED'
            )
            yield* unblockPerson(otherGuest, owner)
            denied(
              yield* Effect.exit(requireUnblockedInvitation(guest, owner)),
              'INVITATION_BLOCKED'
            )
            yield* unblockPerson(guest, owner)
            yield* requireUnblockedInvitation(guest, owner)
            expect(
              yield* canReadMedia(guest, mediaAssetId),
              'Unblocking restores otherwise visible content'
            ).toBe(true)
            const input = {
              mediaAssetId,
              reason: 'privacy' as const,
              detail: 'Please remove this image',
            }
            denied(yield* Effect.exit(reportImage(stranger, input)), 'REPORT_IMAGE_UNAVAILABLE')
            denied(yield* Effect.exit(listAbuseReports(owner, 'open')), 'MODERATOR_REQUIRED')
            expect(
              (yield* db.select().from(abuseReport)).filter(
                (row) => row.mediaAssetId === mediaAssetId
              ).length
            ).toBe(0)
            const report = yield* reportImage(guest, input)
            expect((yield* reportImage(guest, input)).reportId, 'A retry is idempotent').toBe(
              report.reportId
            )
            expect(yield* canReadMedia(guest, mediaAssetId)).toBe(false)
            expect(
              yield* canReadMedia(otherGuest, mediaAssetId),
              'Reporting does not censor content for others before moderation'
            ).toBe(true)
            denied(
              yield* Effect.exit(getEventMediaUrlWorkflow({ userId: guest, mediaAssetId })),
              'MEDIA_NOT_FOUND'
            )
            const other = yield* reportImage(otherGuest, input)
            yield* db.insert(moderationStaff).values({ userId: moderator }) // Fixture only; always rolled back.
            expect(
              (yield* listAbuseReports(moderator, 'open')).some((row) => row.id === report.reportId)
            ).toBeTruthy()
            const review = {
              reportId: report.reportId,
              expectedStatus: 'open' as const,
              action: 'hide_image' as const,
              note: 'Violates image policy',
            }
            denied(yield* Effect.exit(reviewAbuseReport(owner, review)), 'MODERATOR_REQUIRED')
            expect((yield* reviewAbuseReport(moderator, review)).status).toBe('resolved')
            denied(
              yield* Effect.exit(reviewAbuseReport(moderator, review)),
              'REPORT_REVIEW_CONFLICT'
            )
            expect(
              (yield* db
                .select()
                .from(abuseReportReview)
                .where(eq(abuseReportReview.reportId, report.reportId))).length,
              'Stale review does not produce a second audit record'
            ).toBe(1)
            expect(yield* canReadMedia(owner, mediaAssetId)).toBe(false)
            expect(
              (yield* hiddenImageIDs(owner)).mediaAssetIds.includes(mediaAssetId),
              'Native cached images receive the moderation policy'
            ).toBeTruthy()
            expect(
              !(yield* hiddenImageIDs(stranger)).mediaAssetIds.includes(mediaAssetId),
              "Visibility policy does not disclose another workspace's images"
            ).toBeTruthy()
            denied(
              yield* Effect.exit(getNativeMediaUrlWorkflow({ userId: owner, mediaAssetId })),
              'MEDIA_NOT_FOUND'
            )
            denied(
              yield* Effect.exit(
                finalizeNativeMediaUploadWorkflow({ userId: owner, media: { mediaAssetId } })
              ),
              'MEDIA_NOT_FOUND'
            )
            yield* reviewAbuseReport(moderator, {
              ...review,
              reportId: other.reportId,
              action: 'dismiss',
            })
            expect(
              yield* canReadMedia(owner, mediaAssetId),
              'Dismissing a duplicate never unhides an image'
            ).toBe(false)
            yield* db
              .update(moderationStaff)
              .set({ revokedAt: new Date() })
              .where(eq(moderationStaff.userId, moderator))
            denied(yield* Effect.exit(requireModerator(moderator)), 'MODERATOR_REQUIRED')
            const privateId = crypto.randomUUID()
            yield* db.insert(mediaAsset).values({
              id: privateId,
              organizationId,
              uploadedByUserId: owner,
              kind: 'image',
              status: 'ready',
              bucket: 'verification-no-object',
              storageKey: `verification/${privateId}`,
              originalFilename: 'private.png',
              contentType: 'image/png',
              byteSize: 100,
            })
            denied(yield* Effect.exit(hideImage(guest, privateId)), 'REPORT_IMAGE_UNAVAILABLE')
            expect(
              (yield* db.select().from(hiddenMedia).where(eq(hiddenMedia.mediaAssetId, privateId)))
                .length,
              'Guest cannot hide an unshared planning image'
            ).toBe(0)
            denied(yield* Effect.exit(leaveGuestEvent(stranger, eventId)), 'EVENT_LEAVE_FORBIDDEN')
            denied(yield* Effect.exit(leaveGuestEvent(owner, eventId)), 'EVENT_LEAVE_FORBIDDEN')
            yield* leaveGuestEvent(guest, eventId)
            yield* leaveGuestEvent(guest, eventId)
            expect(
              (yield* db
                .select()
                .from(eventParticipant)
                .where(eq(eventParticipant.eventId, eventId))).length,
              'Leaving removes only the guest, not the shared event'
            ).toBe(2)
            expect(
              (yield* db.select().from(event).where(eq(event.id, eventId))).length
            ).toBeTruthy()
            expect((yield* guestEventInvitations(guest)).length).toBe(0)
            denied(
              yield* Effect.exit(respondToEvent(guest, eventId, 'going')),
              'EVENT_RESPONSE_FORBIDDEN'
            )
            // Even a stale canonical participation cannot bypass the departure policy.
            const [guestPerson] = yield* db
              .select()
              .from(workspacePerson)
              .where(eq(workspacePerson.userId, guest))
            yield* db.insert(eventParticipant).values({
              eventId,
              personId: guestPerson.id,
              role: 'guest',
              planningPermission: 'view_only',
            })
            expect((yield* guestEventInvitations(guest)).length).toBe(0)
            denied(yield* Effect.exit(hideImage(guest, mediaAssetId)), 'REPORT_IMAGE_UNAVAILABLE')
            expect(
              (yield* db.select().from(eventDeparture).where(eq(eventDeparture.userId, guest)))
                .length
            ).toBe(1)
            return yield* Effect.fail(new Rollback())
          })
        )
      }).pipe(Effect.provide(PgClientLive))
      const result = yield* Effect.exit(verification)
      expect(
        Exit.isFailure(result) &&
          result.cause.reasons.some(
            (reason) => Cause.isFailReason(reason) && reason.error instanceof Rollback
          ),
        Exit.isFailure(result) ? Cause.pretty(result.cause) : 'Expected rollback'
      ).toBeTruthy()
    }),
  { skip: process.env.RUN_MODERATION_DB_TESTS !== '1' }
)

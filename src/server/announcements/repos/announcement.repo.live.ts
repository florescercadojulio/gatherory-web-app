import { createHash } from 'node:crypto'
import { PgClient } from '@effect/sql-pg/PgClient'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { eventAnnouncement } from '@/db/schema/announcement.schema'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import { nativeNotificationOutbox } from '@/db/schema/notification.schema'
import { ConflictError, ForbiddenError } from '@/server/effect-utils'
import type { Announcement } from '../contracts/announcement.contracts'
import { announcementAccess } from './announcement-access.persistence'
import { announcementNotificationAllowed } from '../services/announcement-policy'
import {
  AnnouncementRepository,
  type AnnouncementRepositoryShape,
} from './announcement.repo.contract'

const forbidden = () =>
  new ForbiddenError({
    category: 'authorization',
    code: 'EVENT_ANNOUNCEMENT_FORBIDDEN',
    userMessageKey: 'serverErrors.AUTHORIZATION',
  })
const present = (row: typeof eventAnnouncement.$inferSelect): Announcement => ({
  id: row.id,
  eventId: row.eventId,
  message: row.message,
  audience: row.audience,
  authorId: row.authorUserId,
  authorName: row.authorLabel === 'Planning Team' ? 'Planning Team' : 'Host',
  createdAt: row.createdAt.toISOString(),
})

export const announcementRepo = {
  list: (input: Parameters<AnnouncementRepositoryShape['list']>[0]) =>
    Effect.gen(function* () {
      const database = yield* DB
      return yield* database.transaction((tx) =>
        Effect.gen(function* () {
          const access = yield* announcementAccess(tx, input.eventId, input.actor)
          if (!access) return yield* Effect.fail(forbidden())
          const rows = yield* tx
            .select()
            .from(eventAnnouncement)
            .where(
              and(
                eq(eventAnnouncement.eventId, input.eventId),
                inArray(eventAnnouncement.audience, access.readAudiences)
              )
            )
            .orderBy(desc(eventAnnouncement.createdAt), desc(eventAnnouncement.id))
            .limit(50)
          return {
            announcements: rows.map(present),
            canSend: access.canSend,
            allowedAudiences: access.allowedAudiences,
          }
        })
      )
    }),
  send: (input: Parameters<AnnouncementRepositoryShape['send']>[0]) =>
    Effect.gen(function* () {
      const database = yield* DB
      return yield* database.transaction((tx) =>
        Effect.gen(function* () {
          // Serialize retries before checking the unique receipt and exact-event authorization.
          yield* tx.execute(
            sql`select pg_advisory_xact_lock(hashtext(${`announcement:${input.eventId}:${input.userId}:${input.requestId}`}))`
          )
          // Preserve event lifecycle lock order (root before child), without granting root access.
          const [target] = yield* tx
            .select({ parentId: event.parentEventId, organizationId: event.organizationId })
            .from(event)
            .where(eq(event.id, input.eventId))
            .limit(1)
          if (!target) return yield* Effect.fail(forbidden())
          yield* tx
            .select({ id: event.id })
            .from(event)
            .where(eq(event.id, target.parentId ?? input.eventId))
            .for('update')
          if (target.parentId)
            yield* tx
              .select({ id: event.id })
              .from(event)
              .where(eq(event.id, input.eventId))
              .for('update')
          const access = yield* announcementAccess(tx, input.eventId, {
            kind: 'user',
            id: input.userId,
          })
          const audience = input.audience ?? 'all'
          if (!access?.allowedAudiences.includes(audience)) return yield* Effect.fail(forbidden())
          const [existing] = yield* tx
            .select()
            .from(eventAnnouncement)
            .where(
              and(
                eq(eventAnnouncement.eventId, input.eventId),
                eq(eventAnnouncement.authorUserId, input.userId),
                eq(eventAnnouncement.requestId, input.requestId)
              )
            )
            .limit(1)
          if (existing) {
            if (existing.message !== input.message || existing.audience !== audience)
              return yield* Effect.fail(
                new ConflictError({
                  category: 'conflict',
                  code: 'ANNOUNCEMENT_REQUEST_CONFLICT',
                  userMessageKey: 'serverErrors.CONFLICT',
                })
              )
            return present(existing)
          }
          const [row] = yield* tx
            .insert(eventAnnouncement)
            .values({
              eventId: input.eventId,
              authorUserId: input.userId,
              requestId: input.requestId,
              message: input.message,
              audience,
              authorLabel: access.role === 'host' ? 'Host' : 'Planning Team',
            })
            .returning()
          const participants = yield* tx
            .select({ userId: workspacePerson.userId, guestId: workspacePerson.guestProfileId })
            .from(eventParticipant)
            .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
            .where(
              and(
                eq(eventParticipant.eventId, input.eventId),
                eq(workspacePerson.organizationId, target.organizationId)
              )
            )
          for (const participant of participants) {
            const recipient = participant.userId
              ? { kind: 'user' as const, id: participant.userId }
              : participant.guestId
                ? { kind: 'device_guest' as const, id: participant.guestId }
                : undefined
            if (!recipient || (recipient.kind === 'user' && recipient.id === input.userId)) continue
            const recipientAccess = yield* announcementAccess(tx, input.eventId, recipient)
            if (!recipientAccess || !announcementNotificationAllowed(recipientAccess, audience))
              continue
            const dedupeKey = createHash('sha256')
              .update(`announcement:${row!.id}:${recipient.kind}:${recipient.id}`)
              .digest('hex')
            yield* tx
              .insert(nativeNotificationOutbox)
              .values({
                dedupeKey,
                mutationId: input.requestId,
                eventId: input.eventId,
                entityId: row!.id,
                recipientKind: recipient.kind,
                recipientId: recipient.id,
                type: 'event_announcement',
              })
              .onConflictDoNothing({ target: nativeNotificationOutbox.dedupeKey })
          }
          return present(row!)
        })
      )
    }),
}

export const AnnouncementRepositoryLive = Layer.effect(
  AnnouncementRepository,
  Effect.gen(function* () {
    const pg = yield* PgClient
    return {
      list: (input) => announcementRepo.list(input).pipe(Effect.provideService(PgClient, pg)),
      send: (input) => announcementRepo.send(input).pipe(Effect.provideService(PgClient, pg)),
    }
  })
)

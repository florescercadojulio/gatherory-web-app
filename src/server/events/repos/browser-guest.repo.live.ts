import { PgClient } from '@effect/sql-pg/PgClient'
import { and, eq, isNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { PersistenceError } from '@/lib/domain-errors'
import { event, eventGuestProfile, eventParticipant, workspacePerson } from '@/db/schema'
import { BrowserGuestRepo } from './browser-guest.repo'
import {
  joinDeviceGuestEvent,
  registerDeviceGuestProfile,
  respondToDeviceGuestEvent,
  verifyDeviceGuestProfile,
} from './device-guest.repo.persistence'
import { getEventIdForShareLink, previewEventShareLink } from './event-share-link.repo.persistence'

export const BrowserGuestRepoLive = Layer.effect(
  BrowserGuestRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const bindPg = <A, E, R>(program: Effect.Effect<A, E, R>) =>
      program.pipe(Effect.provideService(PgClient, pg))
    return {
      register: (input: { id: string; name: string; credential: string }) =>
        bindPg(registerDeviceGuestProfile(input)),
      verify: (input: { guestId: string; credential: string }) =>
        bindPg(verifyDeviceGuestProfile(input)),
      join: (input: { guestId: string; credential: string; token: string }) =>
        bindPg(joinDeviceGuestEvent(input)),
      respond: (input: {
        guestId: string
        credential: string
        eventId: string
        attendance: 'going' | 'not_sure' | 'not_going'
      }) => bindPg(respondToDeviceGuestEvent(input)),
      getEvent: (guestProfileId: string, eventId: string) =>
        bindPg(
          Effect.gen(function* () {
            const db = yield* DB
            const parentEvent = alias(event, 'browser_guest_parent_event')
            const [projection] = yield* db
              .select({
                id: event.id,
                title: event.title,
                startsAt: event.startsAt,
                endsAt: event.endsAt,
                isAllDay: event.isAllDay,
                timeZone: event.timeZone,
                locationName: event.locationName,
                attendance: eventParticipant.attendanceStatus,
                name: eventGuestProfile.displayName,
                eventStatus: event.status,
                planningStatus: event.planningStatus,
                completionStatus: event.completionStatus,
                parentStatus: parentEvent.status,
                parentPlanningStatus: parentEvent.planningStatus,
                parentCompletionStatus: parentEvent.completionStatus,
              })
              .from(eventParticipant)
              .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
              .innerJoin(event, eq(event.id, eventParticipant.eventId))
              .innerJoin(
                eventGuestProfile,
                eq(eventGuestProfile.id, workspacePerson.guestProfileId)
              )
              .leftJoin(parentEvent, eq(parentEvent.id, event.parentEventId))
              .where(
                and(
                  eq(event.id, eventId),
                  eq(workspacePerson.guestProfileId, guestProfileId),
                  eq(eventParticipant.role, 'guest'),
                  isNull(workspacePerson.userId),
                  isNull(eventGuestProfile.claimedAt),
                  isNull(eventGuestProfile.claimedByUserId)
                )
              )
              .limit(1)
            if (!projection) return null
            return {
              id: projection.id,
              title: projection.title,
              startsAt: projection.startsAt?.toISOString() ?? null,
              endsAt: projection.endsAt?.toISOString() ?? null,
              isAllDay: projection.isAllDay,
              timeZone: projection.timeZone,
              locationName: projection.locationName,
              attendance: projection.attendance,
              name: projection.name,
              canRespond:
                projection.eventStatus !== 'finished' &&
                projection.eventStatus !== 'cancelled' &&
                projection.planningStatus !== 'cancelled' &&
                projection.planningStatus !== 'archived' &&
                projection.completionStatus !== 'complete' &&
                projection.parentStatus !== 'finished' &&
                projection.parentStatus !== 'cancelled' &&
                projection.parentPlanningStatus !== 'cancelled' &&
                projection.parentPlanningStatus !== 'archived' &&
                projection.parentCompletionStatus !== 'complete',
            }
          }).pipe(
            Effect.mapError(
              (cause) =>
                new PersistenceError({
                  category: 'system',
                  code: 'BROWSER_GUEST_EVENT_READ_FAILED',
                  userMessageKey: 'serverErrors.SYSTEM',
                  cause,
                })
            )
          )
        ),
      preview: (token: string) => bindPg(previewEventShareLink(token)),
      getShareLinkEventId: (token: string) => bindPg(getEventIdForShareLink(token)),
    }
  })
)

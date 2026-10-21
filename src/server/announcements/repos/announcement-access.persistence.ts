import { and, eq, isNull } from 'drizzle-orm'
import { Effect } from 'effect'
import type { DB } from '@/db'
import {
  event,
  eventGuestProfile,
  eventParticipant,
  workspacePerson,
} from '@/db/schema/event.schema'
import { retainedEventAccess } from '@/server/events/repos/event-departure.repo'
import type { AnnouncementIdentity } from '../contracts/announcement.contracts'
import { announcementPolicy } from '../services/announcement-policy'

type Database = Effect.Success<typeof DB>
export type AnnouncementExecutor = Database | Parameters<Parameters<Database['transaction']>[0]>[0]

/** The linked account/profile and exact participation are the admission authority. */
export function announcementAccess(
  executor: AnnouncementExecutor,
  eventId: string,
  actor: AnnouncementIdentity
) {
  return Effect.gen(function* () {
    const [participation] = yield* executor
      .select({
        role: eventParticipant.role,
        permission: eventParticipant.planningPermission,
        completionStatus: event.completionStatus,
        status: event.status,
        planningStatus: event.planningStatus,
      })
      .from(eventParticipant)
      .innerJoin(event, eq(event.id, eventParticipant.eventId))
      .innerJoin(
        workspacePerson,
        and(
          eq(workspacePerson.id, eventParticipant.personId),
          eq(workspacePerson.organizationId, event.organizationId)
        )
      )
      .where(
        and(
          eq(eventParticipant.eventId, eventId),
          actor.kind === 'user'
            ? and(eq(workspacePerson.userId, actor.id), retainedEventAccess(actor.id, event.id))
            : eq(workspacePerson.guestProfileId, actor.id)
        )
      )
      .limit(1)
    if (!participation) return undefined
    if (actor.kind === 'device_guest') {
      const [profile] = yield* executor
        .select({ id: eventGuestProfile.id })
        .from(eventGuestProfile)
        .where(
          and(
            eq(eventGuestProfile.id, actor.id),
            isNull(eventGuestProfile.claimedAt),
            isNull(eventGuestProfile.claimedByUserId)
          )
        )
        .limit(1)
      if (!profile || participation.role !== 'guest') return undefined
    }
    return announcementPolicy({
      ...participation,
      kind: actor.kind,
      active:
        participation.completionStatus !== 'complete' &&
        participation.status !== 'finished' &&
        participation.status !== 'cancelled' &&
        participation.planningStatus !== 'archived' &&
        participation.planningStatus !== 'cancelled',
    })
  })
}

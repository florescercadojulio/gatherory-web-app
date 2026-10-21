import { Context, type Effect } from 'effect'
import type { EffectDrizzleQueryError } from 'drizzle-orm/effect-core'
import type { SqlError } from 'effect/unstable/sql/SqlError'
import type { DomainError } from '@/lib/domain-errors'
import type {
  Announcement,
  AnnouncementHistory,
  AnnouncementIdentity,
  SendAnnouncement,
} from '../contracts/announcement.contracts'

export type AnnouncementRepositoryFailure = DomainError | EffectDrizzleQueryError | SqlError
export type AnnouncementRepositoryShape = {
  list: (input: {
    eventId: string
    actor: AnnouncementIdentity
  }) => Effect.Effect<AnnouncementHistory, AnnouncementRepositoryFailure>
  send: (
    input: SendAnnouncement & { eventId: string; userId: string }
  ) => Effect.Effect<Announcement, AnnouncementRepositoryFailure>
}
export class AnnouncementRepository extends Context.Service<
  AnnouncementRepository,
  AnnouncementRepositoryShape
>()('AnnouncementRepository') {}

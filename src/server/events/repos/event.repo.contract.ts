import { Context, Effect } from 'effect'
import type { ConflictError, EntityNotFoundError, ForbiddenError } from '@/server/effect'
import type {
  acceptEventInvitation,
  createEventInvitation,
  createEventWithParticipants,
  EventRepoError,
  getEventParticipant,
  getInvitationDetails,
  getInvitationPreviewDetails,
  getEventParentId,
  hasWorkspaceMembership,
  listVisibleMainEvents,
} from './event.repo.persistence'

type RepoMethod<T> = T extends (
  ...args: infer Args
) => Effect.Effect<infer Value, infer Error, infer _Requirements>
  ? (...args: Args) => Effect.Effect<Value, Error | EventPersistenceError>
  : never
type EventPersistenceError = EventRepoError | ConflictError | EntityNotFoundError | ForbiddenError

export type EventRepoShape = {
  readonly hasWorkspaceMembership: RepoMethod<typeof hasWorkspaceMembership>
  readonly getEventParticipant: RepoMethod<typeof getEventParticipant>
  readonly getInvitationDetails: RepoMethod<typeof getInvitationDetails>
  readonly getInvitationPreviewDetails: RepoMethod<typeof getInvitationPreviewDetails>
  readonly getEventParentId: RepoMethod<typeof getEventParentId>
  readonly createEventWithParticipants: RepoMethod<typeof createEventWithParticipants>
  readonly listVisibleMainEvents: RepoMethod<typeof listVisibleMainEvents>
  readonly createEventInvitation: RepoMethod<typeof createEventInvitation>
  readonly acceptEventInvitation: RepoMethod<typeof acceptEventInvitation>
}

/** Persistence contract consumed by domain services. */
export class EventRepo extends Context.Service<EventRepo, EventRepoShape>()('EventRepo') {}

export type { EventRepoError } from './event.repo.persistence'

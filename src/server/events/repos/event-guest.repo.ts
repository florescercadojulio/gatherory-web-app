import { Context, Effect } from 'effect'
import type {
  guestEventInvitations,
  invitationCoverURL,
  respondToEvent,
} from './guest-invitation.repo'
import type { leaveGuestEvent } from './event-departure.repo'

type NeedsPg<T> = T extends (
  ...args: infer Args
) => Effect.Effect<infer Value, infer Error, unknown>
  ? (...args: Args) => Effect.Effect<Value, Error>
  : never

export type EventGuestRepoShape = {
  readonly listInvitations: NeedsPg<typeof guestEventInvitations>
  readonly invitationCoverURL: NeedsPg<typeof invitationCoverURL>
  readonly respondToEvent: NeedsPg<typeof respondToEvent>
  readonly leaveGuestEvent: NeedsPg<typeof leaveGuestEvent>
}

export class EventGuestRepo extends Context.Service<EventGuestRepo, EventGuestRepoShape>()(
  'EventGuestRepo'
) {}

import { Context, Effect } from 'effect'
import type {
  getInvitationCoverAsset,
  listDeviceGuestEventInvitationProjections,
  listGuestEventInvitationProjections,
  respondToEvent,
} from './guest-invitation.repo.persistence'
import type { leaveGuestEvent } from './event-departure.repo'

type NeedsPg<T> = T extends (
  ...args: infer Args
) => Effect.Effect<infer Value, infer Error, unknown>
  ? (...args: Args) => Effect.Effect<Value, Error>
  : never

export type EventGuestRepoShape = {
  readonly listInvitationProjections: NeedsPg<typeof listGuestEventInvitationProjections>
  readonly listDeviceGuestInvitationProjections: NeedsPg<
    typeof listDeviceGuestEventInvitationProjections
  >
  readonly getInvitationCoverAsset: NeedsPg<typeof getInvitationCoverAsset>
  readonly respondToEvent: NeedsPg<typeof respondToEvent>
  readonly leaveGuestEvent: NeedsPg<typeof leaveGuestEvent>
}

export class EventGuestRepo extends Context.Service<EventGuestRepo, EventGuestRepoShape>()(
  'EventGuestRepo'
) {}

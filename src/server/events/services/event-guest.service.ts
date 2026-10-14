import { Context, Effect } from 'effect'
import type { EventGuestRepoShape } from '../repos/event-guest.repo'
import type { listGuestEventInvitationProjections } from '../repos/guest-invitation.repo.persistence'

type InvitationProjections = Effect.Success<ReturnType<typeof listGuestEventInvitationProjections>>
type InvitationProjection = InvitationProjections[number]
type SignedIdea = Omit<InvitationProjection['ideas'][number], 'imageAsset'> & {
  imageURL: string | null
  imageId: string | null
}
type SignedMoment = Omit<InvitationProjection['moments'][number], 'imageAsset'> & {
  imageURL: string | null
}
type GuestInvitation = Omit<
  InvitationProjection,
  'coverAsset' | 'coverId' | 'ideas' | 'moments'
> & {
  coverURL: string | null
  coverId: string | null
  ideas: SignedIdea[]
  moments: SignedMoment[]
}
type InvitationProjectionError = Effect.Error<
  ReturnType<EventGuestRepoShape['listInvitationProjections']>
>
type CoverProjectionError = Effect.Error<ReturnType<EventGuestRepoShape['getInvitationCoverAsset']>>

export type EventGuestServiceShape = Pick<
  EventGuestRepoShape,
  'respondToEvent' | 'leaveGuestEvent'
> & {
  readonly listInvitations: (
    userId: string
  ) => Effect.Effect<GuestInvitation[], InvitationProjectionError>
  readonly invitationCoverURL: (
    eventId: string,
    userId?: string
  ) => Effect.Effect<string | null, CoverProjectionError>
}

export class EventGuestService extends Context.Service<EventGuestService, EventGuestServiceShape>()(
  'EventGuestService'
) {}

export type { GuestInvitation }

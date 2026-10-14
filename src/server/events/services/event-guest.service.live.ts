import { Effect, Layer } from 'effect'
import { EventGuestRepo } from '../repos/event-guest.repo'
import { EventGuestService } from './event-guest.service'

export const EventGuestServiceLive = Layer.effect(
  EventGuestService,
  Effect.gen(function* () {
    const repo = yield* EventGuestRepo
    return {
      listInvitations: repo.listInvitations,
      invitationCoverURL: repo.invitationCoverURL,
      respondToEvent: repo.respondToEvent,
      leaveGuestEvent: repo.leaveGuestEvent,
    }
  })
)

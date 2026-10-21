import { Effect } from 'effect'
import { EventGuestService } from '../services/event-guest.service'

export const listGuestEventInvitationsWorkflow = (userId: string) =>
  Effect.gen(function* () {
    const guests = yield* EventGuestService
    return yield* guests.listInvitations(userId)
  })

export const listDeviceGuestEventInvitationsWorkflow = (profileId: string) =>
  Effect.gen(function* () {
    const guests = yield* EventGuestService
    return yield* guests.listDeviceGuestInvitations(profileId)
  })

import { Effect } from 'effect'
import type { AcceptEventInvitationInput } from '../contracts/event.contracts'
import { EventService } from '../services/event.service'

export const acceptEventInvitationWorkflow = (input: {
  userId: string
  userEmail: string
  invitation: AcceptEventInvitationInput
}) =>
  Effect.gen(function* () {
    const events = yield* EventService
    return yield* events.acceptInvitation(input)
  })

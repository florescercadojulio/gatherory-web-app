import { Effect } from 'effect'
import { EventService } from '../services/event.service'

export const getEventInvitationWorkflow = (input: { token: string; email: string }) =>
  Effect.gen(function* () {
    const events = yield* EventService
    return yield* events.getInvitationDetails(input)
  })

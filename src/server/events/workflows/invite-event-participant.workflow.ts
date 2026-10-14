import { Effect } from 'effect'
import type { InviteEventParticipantInput } from '../contracts/event.contracts'
import { EventService } from '../services/event.service'

export const inviteEventParticipantWorkflow = (input: {
  userId: string
  invitation: InviteEventParticipantInput
}) =>
  Effect.gen(function* () {
    const events = yield* EventService
    return yield* events.inviteParticipant(input.userId, input.invitation)
  })

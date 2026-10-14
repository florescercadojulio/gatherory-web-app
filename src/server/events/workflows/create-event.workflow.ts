import { Effect } from 'effect'
import type { CreateEventInput } from '../contracts/event.contracts'
import { EventService } from '../services/event.service'

export const createEventWorkflow = (input: {
  organizationId: string
  userId: string
  event: CreateEventInput
}) =>
  Effect.gen(function* () {
    const events = yield* EventService
    return yield* events.create(
      { organizationId: input.organizationId, userId: input.userId },
      input.event
    )
  })

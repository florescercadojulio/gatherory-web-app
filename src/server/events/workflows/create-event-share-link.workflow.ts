import { Effect } from 'effect'
import type { z } from 'zod'
import type { ShareLinkInput } from '../contracts/event.contracts'
import { EventSharingService } from '../services/event-sharing.service'

export const createEventShareLinkWorkflow = (
  userId: string,
  input: z.infer<typeof ShareLinkInput>
) =>
  Effect.gen(function* () {
    const sharing = yield* EventSharingService
    return yield* sharing.create(userId, input)
  })

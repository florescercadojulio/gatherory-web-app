import { Effect } from 'effect'
import { EventSharingService } from '../services/event-sharing.service'

export const getShareLinkEventIdWorkflow = (token: string) =>
  Effect.gen(function* () {
    const sharing = yield* EventSharingService
    return yield* sharing.getEventIdForShareLink(token)
  })

import { Effect } from 'effect'
import { EventSharingService } from '../services/event-sharing.service'

export const previewEventShareLinkWorkflow = (token: string, userId?: string) =>
  Effect.gen(function* () {
    const sharing = yield* EventSharingService
    return yield* sharing.preview(token, userId)
  })

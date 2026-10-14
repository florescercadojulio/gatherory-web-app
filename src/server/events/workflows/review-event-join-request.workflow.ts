import { Effect } from 'effect'
import { EventSharingService } from '../services/event-sharing.service'

export const reviewEventJoinRequestWorkflow = (
  userId: string,
  eventId: string,
  requestId: string,
  action: 'approve' | 'decline'
) =>
  Effect.gen(function* () {
    const sharing = yield* EventSharingService
    return yield* sharing.reviewJoinRequest(userId, eventId, requestId, action)
  })

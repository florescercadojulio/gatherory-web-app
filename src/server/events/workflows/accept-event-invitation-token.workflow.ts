import { Effect } from 'effect'
import { EventService } from '../services/event.service'
import { acceptEventShareLinkWorkflow } from './accept-event-share-link.workflow'
import { getShareLinkEventIdWorkflow } from './get-share-link-event-id.workflow'

export const acceptEventInvitationTokenWorkflow = (input: {
  userId: string
  userEmail: string
  token: string
}) =>
  Effect.gen(function* () {
    const sharedEventId = yield* getShareLinkEventIdWorkflow(input.token)
    const accepted = sharedEventId
      ? yield* acceptEventShareLinkWorkflow(input.userId, input.token)
      : yield* (yield* EventService).acceptInvitation({
          userId: input.userId,
          userEmail: input.userEmail,
          invitation: { token: input.token },
        })
    const event = yield* (yield* EventService).getParentEventId(accepted.eventId)
    const awaitingApproval = 'status' in accepted && accepted.status === 'awaiting_approval'
    return {
      ...accepted,
      planningScopeId:
        !awaitingApproval && event?.parentEventId === null && accepted.role !== 'guest'
          ? accepted.eventId
          : null,
    }
  })

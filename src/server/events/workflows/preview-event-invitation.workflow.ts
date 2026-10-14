import { Effect } from 'effect'
import { EntityNotFoundError } from '@/server/effect'
import { EventService } from '../services/event.service'
import { getInvitationCoverWorkflow } from './get-invitation-cover.workflow'
import { getShareLinkEventIdWorkflow } from './get-share-link-event-id.workflow'
import { previewEventShareLinkWorkflow } from './preview-event-share-link.workflow'

export const previewEventInvitationWorkflow = (input: {
  token: string
  user?: { id: string; email: string }
}) =>
  Effect.gen(function* () {
    const sharedEventId = yield* getShareLinkEventIdWorkflow(input.token)
    if (sharedEventId) {
      const preview = yield* previewEventShareLinkWorkflow(input.token, input.user?.id)
      if (!preview)
        return yield* Effect.fail(
          new EntityNotFoundError({
            category: 'not_found',
            code: 'INVITATION_UNAVAILABLE',
            userMessageKey: 'serverErrors.INVITATION_UNAVAILABLE',
          })
        )
      return {
        ...preview,
        coverURL: yield* getInvitationCoverWorkflow(sharedEventId, input.user?.id),
        requiresSignIn: false,
      }
    }
    if (!input.user) return { requiresSignIn: true }

    const events = yield* EventService
    const invitation = yield* events.previewEmailInvitation({
      token: input.token,
      email: input.user.email,
    })
    const { eventId, ...details } = invitation
    return {
      ...details,
      coverURL: yield* getInvitationCoverWorkflow(eventId, input.user.id),
      requiresSignIn: false,
    }
  })

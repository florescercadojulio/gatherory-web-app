import { transportInput } from '@/lib/input-validation'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { validateInput } from '@/server/validation'
import { ForbiddenError, runServerEffect } from '@/server/effect'
import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { AcceptEventInvitationInputSchema } from '../contracts/event.contracts'
import { acceptEventInvitationWorkflow } from '../workflows/accept-event-invitation.workflow'
import { provideEventLayers } from './event-handler.layers'

export const acceptEventInvitation = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(AcceptEventInvitationInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(
      validateInput(AcceptEventInvitationInputSchema, data).pipe(
        Effect.flatMap((invitation) =>
          !context.user.emailVerified
            ? Effect.fail(
                new ForbiddenError({
                  category: 'authorization',
                  code: 'INVITATION_EMAIL_UNVERIFIED',
                  userMessageKey: 'serverErrors.INVITATION_EMAIL_UNVERIFIED',
                })
              )
            : provideEventLayers(
                acceptEventInvitationWorkflow({
                  userId: context.user.id,
                  userEmail: context.user.email,
                  invitation,
                })
              )
        )
      )
    )
  )

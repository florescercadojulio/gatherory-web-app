import { transportInput } from '@/lib/input-validation'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { validateInput } from '@/server/validation'
import { runServerEffect } from '@/server/effect'
import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { AcceptEventInvitationInputSchema } from '../contracts/event.contracts'
import { getEventInvitationWorkflow } from '../workflows/get-event-invitation.workflow'
import { provideEventLayers } from './event-handler.layers'

export const getEventInvitation = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(AcceptEventInvitationInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(
      validateInput(AcceptEventInvitationInputSchema, data).pipe(
        Effect.flatMap((input) =>
          provideEventLayers(
            getEventInvitationWorkflow({ token: input.token, email: context.user.email })
          )
        )
      )
    )
  )

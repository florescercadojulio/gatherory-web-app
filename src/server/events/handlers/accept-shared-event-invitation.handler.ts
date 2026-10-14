import { transportInput } from '@/lib/input-validation'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { validateInput } from '@/server/validation'
import { runServerEffect } from '@/server/effect'
import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { AcceptEventInvitationInputSchema } from '../contracts/event.contracts'
import { acceptEventShareLinkWorkflow } from '../workflows/accept-event-share-link.workflow'
import { provideEventSharingLayers } from './event-handler.layers'

export const acceptSharedEventInvitation = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(AcceptEventInvitationInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(
      validateInput(AcceptEventInvitationInputSchema, data).pipe(
        Effect.flatMap((input) =>
          provideEventSharingLayers(acceptEventShareLinkWorkflow(context.user.id, input.token))
        )
      )
    )
  )

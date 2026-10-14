import { transportInput } from '@/lib/input-validation'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { validateInput } from '@/server/validation'
import { runServerEffect } from '@/server/effect'
import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { AcceptEventInvitationInputSchema } from '../contracts/event.contracts'
import { previewEventShareLinkWorkflow } from '../workflows/preview-event-share-link.workflow'
import { provideEventSharingLayers } from './event-handler.layers'

export const getJoinedSharedInvitation = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(AcceptEventInvitationInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(
      validateInput(AcceptEventInvitationInputSchema, data).pipe(
        Effect.flatMap((input) =>
          provideEventSharingLayers(previewEventShareLinkWorkflow(input.token, context.user.id))
        )
      )
    )
  )

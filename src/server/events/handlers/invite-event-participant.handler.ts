import { transportInput } from '@/lib/input-validation'
import { eventAuthorizationMiddleware } from '@/lib/event-authorization.middleware'
import { validateInput } from '@/server/validation'
import { runServerEffect } from '@/server/effect'
import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { InviteEventParticipantInputSchema } from '../contracts/event.contracts'
import { inviteEventParticipantWorkflow } from '../workflows/invite-event-participant.workflow'
import { provideEventLayers } from './event-handler.layers'

export const inviteEventParticipant = createServerFn({ method: 'POST' })
  .middleware([eventAuthorizationMiddleware({ event: ['manage_participants'] })])
  .validator(transportInput(InviteEventParticipantInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(
      validateInput(InviteEventParticipantInputSchema, data).pipe(
        Effect.flatMap((invitation) =>
          provideEventLayers(
            inviteEventParticipantWorkflow({ userId: context.user.id, invitation }).pipe(
              Effect.map((result) => ({ ...result, expiresAt: result.expiresAt.toISOString() }))
            )
          )
        )
      )
    )
  )

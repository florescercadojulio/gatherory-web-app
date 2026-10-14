import { transportInput } from '@/lib/input-validation'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { validateInput } from '@/server/validation'
import { runServerEffect } from '@/server/effect'
import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { InviteEventParticipantInputSchema } from '../contracts/event.contracts'
import { inviteEventParticipantWorkflow } from '../workflows/invite-event-participant.workflow'
import { provideEventLayers } from './event-handler.layers'

export const inviteEventParticipant = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
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

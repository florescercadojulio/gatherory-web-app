import { PgClientLive } from '@/db'
import { transportInput } from '@/lib/input-validation'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { validateInput } from '@/server/validation'
import { runServerEffect } from '@/server/effect'
import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { AcceptEventInvitationInputSchema } from '../contracts/event.contracts'
import { previewEventShareLinkWorkflow } from '../workflows/event-sharing.workflows.live'

export const getJoinedSharedInvitation = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(AcceptEventInvitationInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(
      validateInput(AcceptEventInvitationInputSchema, data).pipe(
        Effect.flatMap((input) =>
          previewEventShareLinkWorkflow(input.token, context.user.id).pipe(
            Effect.provide(PgClientLive)
          )
        )
      )
    )
  )

import { PgClientLive } from '@/db'
import { transportInput } from '@/lib/input-validation'
import { validateInput } from '@/server/validation'
import { runServerEffect } from '@/server/effect'
import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { AcceptEventInvitationInputSchema } from '../contracts/event.contracts'
import { previewEventShareLinkWorkflow } from '../workflows/event-sharing.workflows.live'

export const getSharedEventInvitation = createServerFn({ method: 'GET' })
  .validator(transportInput(AcceptEventInvitationInputSchema))
  .handler(({ data }) =>
    runServerEffect(
      validateInput(AcceptEventInvitationInputSchema, data).pipe(
        Effect.flatMap((input) =>
          previewEventShareLinkWorkflow(input.token).pipe(Effect.provide(PgClientLive))
        )
      )
    )
  )

import { PgClientLive } from '@/db'
import { transportInput } from '@/lib/input-validation'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { validateInput } from '@/server/validation'
import { InvalidInputError, runServerEffect } from '@/server/effect'
import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { CreateEventInputSchema } from '../contracts/event.contracts'
import { createEventWorkflow } from '../workflows/event.workflows.live'

export const createEvent = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(CreateEventInputSchema))
  .handler(({ data, context }) => {
    const organizationId = context.session.activeOrganizationId
    if (!organizationId)
      return runServerEffect(
        validateInput(CreateEventInputSchema, data).pipe(
          Effect.flatMap(() =>
            Effect.fail(
              new InvalidInputError({
                category: 'validation',
                code: 'ACTIVE_WORKSPACE_REQUIRED',
                userMessageKey: 'serverErrors.ACTIVE_WORKSPACE_REQUIRED',
              })
            )
          )
        )
      )
    return runServerEffect(
      validateInput(CreateEventInputSchema, data).pipe(
        Effect.flatMap((event) =>
          createEventWorkflow({ organizationId, userId: context.user.id, event }).pipe(
            Effect.provide(PgClientLive)
          )
        )
      )
    )
  })

import { transportInput } from '@/lib/input-validation'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { validateInput } from '@/server/validation'
import { runServerEffect } from '@/server/effect'
import type { ServerResult } from '@/server/result'
import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { ListEventsInputSchema, type EventWorkspaceSummary } from '../contracts/event.contracts'
import { listEventsWorkflow } from '../workflows/list-events.workflow'
import { provideEventLayers } from './event-handler.layers'

export const listEvents = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(ListEventsInputSchema))
  .handler(({ data, context }): Promise<ServerResult<EventWorkspaceSummary[]>> =>
    runServerEffect(
      validateInput(ListEventsInputSchema, data).pipe(
        Effect.flatMap((input) =>
          provideEventLayers(
            listEventsWorkflow({ organizationId: input.organizationId, userId: context.user.id })
          )
        )
      )
    )
  )

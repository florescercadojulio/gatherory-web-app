import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { transportInput } from '@/lib/input-validation'
import { runServerEffect } from '@/server/effect'
import { validateInput } from '@/server/validation'
import { EventReadingInputSchema } from '../contracts/event-reading.contracts'
import { getEventReadingWorkflow } from '../workflows/event-reading.workflows.live'

export const getEventReading = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(EventReadingInputSchema))
  .handler(({ data, context }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    setResponseHeader('Vary', 'Cookie')
    return runServerEffect(
      validateInput(EventReadingInputSchema, data).pipe(
        Effect.flatMap(({ eventId }) =>
          getEventReadingWorkflow({ userId: context.user.id, eventId })
        ),
        Effect.provide(PgClientLive)
      ),
      { operation: 'event.reading' }
    )
  })

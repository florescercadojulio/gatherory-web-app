import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod'
import { PgClientLive } from '@/db'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { transportInput } from '@/lib/input-validation'
import type { EventPermissions } from '@/lib/permissions'
import { runAuthorizationCheck } from '@/server/auth/authorization-boundary'
import { ensureEventPermission } from '@/server/events/authorization.live'
import { validateInput } from '@/server/validation'

const EventAuthorizationInputSchema = z.object({ eventId: z.uuid() })

/**
 * Requires event participation and server-declared capabilities, never workspace
 * membership. Guests still need a session. Token invitation flows use their own
 * authorization because participation may not exist yet.
 */
export function eventAuthorizationMiddleware(permissions: EventPermissions) {
  return (
    createMiddleware({ type: 'function' })
      .middleware([requireSessionMiddleware])
      // Preserve the complete payload for the handler's own validation.
      .validator(transportInput(EventAuthorizationInputSchema))
      .server(async ({ data, context, next }) => {
        const headers = getRequestHeaders()
        const eventAccess = await runAuthorizationCheck(
          validateInput(EventAuthorizationInputSchema, data).pipe(
            Effect.flatMap(({ eventId }) =>
              ensureEventPermission(permissions, { eventId, userId: context.user.id }).pipe(
                Effect.map((participant) => ({ eventId, ...participant })),
                Effect.provide(PgClientLive)
              )
            )
          ),
          { headers, operation: 'authorization.event_permission' }
        )
        return next({ context: { eventAccess } })
      })
  )
}

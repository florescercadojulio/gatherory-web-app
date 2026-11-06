import { createServerFn } from '@tanstack/react-start'
import { getRequest, setResponseHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { transportInput } from '@/lib/input-validation'
import { ForbiddenError, runServerEffect } from '@/server/effect'
import { validateInput } from '@/server/validation'
import {
  BrowserGuestEventInputSchema,
  RespondAsBrowserGuestInputSchema,
} from '../contracts/browser-guest.contracts'
import { getAccountInvitedEventWorkflow } from '../workflows/account-invited-event.workflows.live'
import { respondToEventWorkflow } from '../workflows/event-guest.workflows.live'

function accountReadHeaders() {
  setResponseHeader('Cache-Control', 'private, no-store')
  setResponseHeader('Vary', 'Cookie')
}

export const getAccountInvitedEvent = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BrowserGuestEventInputSchema))
  .handler(({ data, context }) => {
    accountReadHeaders()
    return runServerEffect(
      validateInput(BrowserGuestEventInputSchema, data).pipe(
        Effect.flatMap(({ eventId }) =>
          getAccountInvitedEventWorkflow({
            userId: context.user.id,
            name: context.user.name,
            eventId,
          })
        ),
        Effect.provide(PgClientLive)
      ),
      { operation: 'invited_account.event.read' }
    )
  })

export const respondAsInvitedAccount = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(RespondAsBrowserGuestInputSchema))
  .handler(({ data, context }) => {
    accountReadHeaders()
    return runServerEffect(
      Effect.gen(function* () {
        const request = getRequest()
        // Cookie authentication requires an explicit same-origin mutation.
        if (
          !context.user.emailVerified ||
          request.headers.get('origin') !== new URL(request.url).origin ||
          (request.headers.has('sec-fetch-site') &&
            request.headers.get('sec-fetch-site') !== 'same-origin')
        )
          return yield* Effect.fail(
            new ForbiddenError({
              category: 'authorization',
              code: 'INVITATION_SESSION_REQUIRED',
              userMessageKey: 'serverErrors.INVITATION_SESSION_REQUIRED',
            })
          )
        const input = yield* validateInput(RespondAsBrowserGuestInputSchema, data)
        yield* respondToEventWorkflow(context.user.id, input.eventId, input.attendance)
        return { eventId: input.eventId, attendance: input.attendance }
      }).pipe(Effect.provide(PgClientLive)),
      { operation: 'invited_account.event.respond' }
    )
  })

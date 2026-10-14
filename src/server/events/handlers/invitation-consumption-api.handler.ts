import { Effect } from 'effect'
import { z } from 'zod'
import { PgClientLive } from '@/db'
import {
  ForbiddenError,
  InvalidInputError,
  runServerResponse,
  tryServerOperation,
} from '@/server/effect'
import { nativeSyncUser } from '@/server/sync/handlers/native-sync-auth.handler'
import { isTrustedModerationMutation } from '@/server/moderation/contracts/moderation.contracts'
import { acceptEventInvitationTokenWorkflow } from '../workflows/event-invitation.workflows.live'
import { previewEventInvitationWorkflow } from '../workflows/event-invitation.workflows.live'
import { listGuestEventInvitationsWorkflow } from '../workflows/event-guest.workflows.live'
import { respondToEventWorkflow } from '../workflows/event-guest.workflows.live'
import { leaveGuestEventWorkflow } from '../workflows/event-guest.workflows.live'

const tokenInput = z.object({ token: z.uuid().transform((value) => value.toLowerCase()) })
const responseInput = z.object({
  eventId: z.uuid().transform((value) => value.toLowerCase()),
  attendance: z.enum(['going', 'not_sure', 'not_going']),
})

export async function invitationConsumptionResponse(
  request: Request,
  operation: 'preview' | 'accept' | 'events' | 'respond' | 'leave'
) {
  return runServerResponse(
    Effect.gen(function* () {
      const account = yield* tryServerOperation(
        {
          category: 'system',
          code: 'SESSION_LOOKUP_FAILED',
          userMessageKey: 'serverErrors.SESSION_LOOKUP_FAILED',
        },
        () => nativeSyncUser(request)
      )
      if (operation !== 'preview' && !account?.emailVerified) {
        return yield* Effect.fail(
          new ForbiddenError({
            category: 'authorization',
            code: 'INVITATION_SESSION_REQUIRED',
            userMessageKey: 'serverErrors.INVITATION_SESSION_REQUIRED',
            httpStatus: account ? 403 : 401,
          })
        )
      }
      if (operation === 'events')
        return { events: yield* listGuestEventInvitationsWorkflow(account!.id) }
      if (
        operation !== 'preview' &&
        !isTrustedModerationMutation(request, process.env.BETTER_AUTH_URL)
      ) {
        return yield* Effect.fail(
          new ForbiddenError({
            category: 'authorization',
            code: 'UNTRUSTED_INVITATION_REQUEST',
            userMessageKey: 'serverErrors.UNTRUSTED_INVITATION_REQUEST',
          })
        )
      }
      const body =
        operation === 'preview'
          ? { token: new URL(request.url).searchParams.get('token') }
          : yield* Effect.tryPromise({
              try: () => request.json(),
              catch: (cause) =>
                new InvalidInputError({
                  category: 'validation',
                  code: 'INVALID_INVITATION',
                  userMessageKey: 'serverErrors.INVALID_INVITATION',
                  cause,
                }),
            })
      if (operation === 'respond') {
        const parsed = responseInput.safeParse(body)
        if (!parsed.success) {
          return yield* Effect.fail(
            new InvalidInputError({
              category: 'validation',
              code: 'INVALID_RESPONSE',
              userMessageKey: 'serverErrors.INVALID_RESPONSE',
            })
          )
        }
        return yield* respondToEventWorkflow(
          account!.id,
          parsed.data.eventId,
          parsed.data.attendance
        )
      }
      if (operation === 'leave') {
        const parsed = z
          .object({ eventId: z.uuid().transform((value) => value.toLowerCase()) })
          .strict()
          .safeParse(body)
        if (!parsed.success)
          return yield* Effect.fail(
            new InvalidInputError({
              category: 'validation',
              code: 'INVALID_EVENT',
              userMessageKey: 'serverErrors.INVALID_EVENT',
            })
          )
        return yield* leaveGuestEventWorkflow(account!.id, parsed.data.eventId)
      }
      const parsed = tokenInput.safeParse(body)
      if (!parsed.success) {
        return yield* Effect.fail(
          new InvalidInputError({
            category: 'validation',
            code: 'INVALID_INVITATION',
            userMessageKey: 'serverErrors.INVALID_INVITATION',
          })
        )
      }
      const token = parsed.data.token
      if (operation === 'preview') {
        return yield* previewEventInvitationWorkflow({
          token,
          user: account ? { id: account.id, email: account.email } : undefined,
        })
      }
      return yield* acceptEventInvitationTokenWorkflow({
        userId: account!.id,
        userEmail: account!.email,
        token,
      })
    }).pipe(Effect.provide(PgClientLive)),
    { headers: request.headers, operation: `invitation.${operation}` }
  )
}

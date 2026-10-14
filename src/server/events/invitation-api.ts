import { Effect } from 'effect'
import { z } from 'zod'
import { PgClientLive } from '@/db'
import { invitationURL } from '@/lib/event-invitation-links'
import {
  ConfigurationError,
  ForbiddenError,
  runServerResponse,
  serverOperationError,
} from '@/server/effect-utils'
import { requestJson, requestUser, validateInput } from '@/server/http-errors'
import { InviteEventParticipantInputSchema, ShareLinkInput } from './contracts/event.contracts'
import { EventRepoLive } from './repos/event.repo.live'
import { EventAuthorizationLive } from './services/event-authorization.service'
import { EventService } from './services/event.service'
import { EventServiceLive } from './services/event.service.live'
import { EventSharingServiceLive } from './services/event-sharing.service.live'
import { EventSharingRepoLive } from './repos/event-sharing.repo.live'
import { createEventShareLinkWorkflow } from './workflows/create-event-share-link.workflow'
import { revokeEventShareLinkWorkflow } from './workflows/revoke-event-share-link.workflow'
import { listEventJoinRequestsWorkflow } from './workflows/list-event-join-requests.workflow'
import { reviewEventJoinRequestWorkflow } from './workflows/review-event-join-request.workflow'
import { isTrustedModerationMutation } from '@/server/moderation/contracts'

function verifiedUser(request: Request) {
  return requestUser(request).pipe(
    Effect.flatMap((user) =>
      user.emailVerified
        ? Effect.succeed(user)
        : Effect.fail(
            new ForbiddenError({
              category: 'authorization',
              code: 'INVITATION_SESSION_REQUIRED',
              userMessageKey: 'serverErrors.INVITATION_SESSION_REQUIRED',
            })
          )
    )
  )
}

export function eventJoinRequestsResponse(request: Request) {
  return runServerResponse(
    Effect.gen(function* () {
      const user = yield* verifiedUser(request)
      if (request.method === 'GET') {
        const input = yield* validateInput(z.object({ eventId: z.uuid() }), {
          eventId: new URL(request.url).searchParams.get('eventId'),
        })
        return yield* listEventJoinRequestsWorkflow(user.id, input.eventId)
      }
      if (!isTrustedModerationMutation(request, process.env.BETTER_AUTH_URL))
        return yield* Effect.fail(
          new ForbiddenError({
            category: 'authorization',
            code: 'UNTRUSTED_INVITATION_REQUEST',
            userMessageKey: 'serverErrors.UNTRUSTED_INVITATION_REQUEST',
          })
        )
      const input = yield* validateInput(
        z.object({
          eventId: z.uuid(),
          requestId: z.uuid(),
          action: z.enum(['approve', 'decline']),
        }),
        yield* requestJson(request)
      )
      return yield* reviewEventJoinRequestWorkflow(
        user.id,
        input.eventId,
        input.requestId,
        input.action
      )
    }).pipe(
      Effect.provide(EventSharingServiceLive),
      Effect.provide(EventSharingRepoLive),
      Effect.provide(PgClientLive)
    ),
    { headers: request.headers, operation: 'invitation.join_requests' }
  )
}

/** Cookie and native bearer clients share the same domain authorization. */
export function createInvitationResponse(request: Request) {
  return runServerResponse(
    Effect.gen(function* () {
      const user = yield* verifiedUser(request)
      const body = yield* requestJson(request)
      const isShareLink = typeof body === 'object' && body !== null && !('email' in body)
      // Resolve configuration before writing. Never trust a client-supplied host.
      const baseURL = process.env.BETTER_AUTH_URL
      if (!baseURL)
        return yield* Effect.fail(
          new ConfigurationError({
            category: 'system',
            code: 'INVITATION_URL_NOT_CONFIGURED',
            debugMessage: 'BETTER_AUTH_URL is required for invitation links.',
          })
        )
      const makeURL = yield* Effect.try({
        try: () => {
          invitationURL(baseURL, crypto.randomUUID())
          return (token: string) => invitationURL(baseURL, token)
        },
        catch: (cause) =>
          serverOperationError(cause, {
            category: 'system',
            code: 'INVITATION_URL_INVALID',
            debugMessage: 'The configured invitation URL is invalid.',
          }),
      })
      if (isShareLink) {
        const input = yield* validateInput(ShareLinkInput, body)
        const link = yield* createEventShareLinkWorkflow(user.id, input)
        return {
          eventId: link.eventId,
          email: null,
          expiresAt: link.expiresAt.toISOString(),
          url: makeURL(link.token),
        }
      }
      const input = yield* validateInput(InviteEventParticipantInputSchema, body)
      const events = yield* EventService
      const invitation = yield* events.inviteParticipant(user.id, input)
      return {
        eventId: input.eventId,
        email: invitation.email,
        expiresAt: invitation.expiresAt.toISOString(),
        url: makeURL(invitation.token),
      }
    }).pipe(
      Effect.provide(EventServiceLive),
      Effect.provide(EventRepoLive),
      Effect.provide(EventAuthorizationLive),
      Effect.provide(EventSharingServiceLive),
      Effect.provide(EventSharingRepoLive),
      Effect.provide(PgClientLive)
    ),
    { headers: request.headers }
  )
}

export function revokeInvitationResponse(request: Request) {
  return runServerResponse(
    Effect.gen(function* () {
      const user = yield* verifiedUser(request)
      const input = yield* validateInput(
        z.object({ eventId: z.uuid() }),
        yield* requestJson(request)
      )
      return yield* revokeEventShareLinkWorkflow(user.id, input.eventId)
    }).pipe(
      Effect.provide(EventSharingServiceLive),
      Effect.provide(EventSharingRepoLive),
      Effect.provide(PgClientLive)
    ),
    { headers: request.headers }
  )
}

import { Effect } from "effect"
import { z } from "zod"
import { PgClientLive } from "@/db"
import { invitationURL } from "@/lib/event-invitation-links"
import { ConfigurationError, ForbiddenError, runServerResponse, serverOperationError } from "@/server/effect-utils"
import { requestJson, requestUser, validateInput } from "@/server/http-errors"
import { InviteEventParticipantInputSchema, ShareLinkInput } from "./contracts/event.contracts"
import { EventRepoLive } from "./repos/event.repo.live"
import { EventAuthorizationLive } from "./services/event-authorization.service"
import { EventService } from "./services/event.service"
import { EventServiceLive } from "./services/event.service.live"
import { createEventShareLink, revokeEventShareLink } from "./repos/event-share-link.repo"

function verifiedUser(request: Request) {
  return requestUser(request).pipe(Effect.flatMap(user => user.emailVerified ? Effect.succeed(user) :
    Effect.fail(new ForbiddenError({ category: "authorization", code: "INVITATION_SESSION_REQUIRED", userMessageKey: "serverErrors.INVITATION_SESSION_REQUIRED" }))))
}

/** Cookie and native bearer clients share the same domain authorization. */
export function createInvitationResponse(request: Request) {
  return runServerResponse(Effect.gen(function* () {
    const user = yield* verifiedUser(request)
    const body = yield* requestJson(request)
    const isShareLink = typeof body === "object" && body !== null && !("email" in body)
    // Resolve configuration before writing. Never trust a client-supplied host.
    const baseURL = process.env.BETTER_AUTH_URL
    if (!baseURL) return yield* Effect.fail(new ConfigurationError({
      category: "system", code: "INVITATION_URL_NOT_CONFIGURED", debugMessage: "BETTER_AUTH_URL is required for invitation links.",
    }))
    const makeURL = yield* Effect.try({
      try: () => {
        invitationURL(baseURL, crypto.randomUUID())
        return (token: string) => invitationURL(baseURL, token)
      },
      catch: cause => serverOperationError(cause, { category: "system", code: "INVITATION_URL_INVALID", debugMessage: "The configured invitation URL is invalid." }),
    })
    if (isShareLink) {
      const input = yield* validateInput(ShareLinkInput, body)
      const link = yield* createEventShareLink(user.id, input)
      return { eventId: link.eventId, email: null, expiresAt: link.expiresAt.toISOString(), url: makeURL(link.token) }
    }
    const input = yield* validateInput(InviteEventParticipantInputSchema, body)
    const events = yield* EventService
    const invitation = yield* events.inviteParticipant(user.id, input)
    return { eventId: input.eventId, email: invitation.email, expiresAt: invitation.expiresAt.toISOString(), url: makeURL(invitation.token) }
  }).pipe(
    Effect.provide(EventServiceLive), Effect.provide(EventRepoLive),
    Effect.provide(EventAuthorizationLive), Effect.provide(PgClientLive),
  ), { headers: request.headers })
}

export function revokeInvitationResponse(request: Request) {
  return runServerResponse(Effect.gen(function* () {
    const user = yield* verifiedUser(request)
    const input = yield* validateInput(z.object({ eventId: z.uuid() }), yield* requestJson(request))
    return yield* revokeEventShareLink(user.id, input.eventId)
  }).pipe(Effect.provide(PgClientLive)), { headers: request.headers })
}

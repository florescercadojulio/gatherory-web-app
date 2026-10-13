import { Effect } from "effect"
import { PgClientLive } from "@/db"
import { invitationURL } from "@/lib/event-invitation-links"
import { InvalidInputError, ForbiddenError, runServerEffect } from "@/server/effect"
import { nativeSyncUser, syncJSON } from "@/server/sync/native-sync-auth"
import { InviteEventParticipantInputSchema, ShareLinkInput } from "./contracts/event.contracts"
import { EventRepoLive } from "./repos/event.repo.live"
import { EventAuthorizationLive } from "./services/event-authorization.service"
import { EventService } from "./services/event.service"
import { EventServiceLive } from "./services/event.service.live"
import { z } from "zod"
import { createEventShareLink, revokeEventShareLink } from "./repos/event-share-link.repo"

/** Cookie and native bearer clients share exactly the same domain authorization. */
export async function createInvitationResponse(request: Request) {
  let failureStatus = 500
  const program = Effect.gen(function* () {
    const user = yield* Effect.tryPromise(() => nativeSyncUser(request))
    if (!user || !user.emailVerified) {
      failureStatus = user ? 403 : 401
      return yield* Effect.fail(new ForbiddenError({
        category: "authorization", code: "INVITATION_SESSION_REQUIRED",
        userMessage: "Sign in with a verified account to invite someone.",
      }))
    }
    const body = yield* Effect.tryPromise(() => request.json())
    const isShareLink = typeof body === "object" && body !== null && !("email" in body)
    const input = (isShareLink ? ShareLinkInput : InviteEventParticipantInputSchema).safeParse(body)
    if (!input.success) {
      failureStatus = 400
      return yield* Effect.fail(new InvalidInputError({
        category: "validation", code: "INVALID_INVITATION",
        userMessage: "Choose a valid event and access level.",
      }))
    }
    // Resolve configuration before writing. Never trust a client-supplied host.
    const baseURL = process.env.BETTER_AUTH_URL
    const makeURL = yield* Effect.try(() => {
      if (!baseURL) throw new Error("BETTER_AUTH_URL is required for invitation links")
      invitationURL(baseURL, crypto.randomUUID())
      return (token: string) => invitationURL(baseURL, token)
    })
    if (isShareLink) {
      const link = yield* createEventShareLink(user.id, ShareLinkInput.parse(input.data)).pipe(
        Effect.tapError((error) => Effect.sync(() => { failureStatus = error instanceof ForbiddenError ? 403 : 500 })),
      )
      return { eventId: link.eventId, email: null, expiresAt: link.expiresAt.toISOString(), url: makeURL(link.token) }
    }
    const events = yield* EventService
    const invitation = yield* events.inviteParticipant(user.id, InviteEventParticipantInputSchema.parse(input.data)).pipe(
      Effect.tapError((error) => Effect.sync(() => {
        failureStatus = error instanceof ForbiddenError ? 403 : 500
      })),
    )
    return {
      eventId: input.data.eventId,
      email: invitation.email,
      expiresAt: invitation.expiresAt.toISOString(),
      url: makeURL(invitation.token),
    }
  }).pipe(
    Effect.provide(EventServiceLive), Effect.provide(EventRepoLive),
    Effect.provide(EventAuthorizationLive), Effect.provide(PgClientLive),
  )
  const result = await runServerEffect(program)
  return syncJSON(result, result.ok ? 200 : failureStatus)
}

export async function revokeInvitationResponse(request: Request) {
  let status = 500
  const result = await runServerEffect(Effect.gen(function* () {
    const user = yield* Effect.tryPromise(() => nativeSyncUser(request))
    if (!user?.emailVerified) {
      status = user ? 403 : 401
      return yield* Effect.fail(new ForbiddenError({ category: "authorization", code: "INVITATION_SESSION_REQUIRED", userMessage: "Sign in with a verified account to manage invitations." }))
    }
    const body = yield* Effect.tryPromise(() => request.json())
    const input = z.object({ eventId: z.uuid() }).safeParse(body)
    if (!input.success) {
      status = 400
      return yield* Effect.fail(new InvalidInputError({ category: "validation", code: "INVALID_INVITATION", userMessage: "Choose an event and try again." }))
    }
    return yield* revokeEventShareLink(user.id, input.data.eventId).pipe(Effect.tapError((error) => Effect.sync(() => { status = error instanceof ForbiddenError ? 403 : 500 })))
  }).pipe(Effect.provide(PgClientLive)))
  return syncJSON(result, result.ok ? 200 : status)
}

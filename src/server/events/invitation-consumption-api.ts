import { and, eq } from "drizzle-orm"
import { Effect } from "effect"
import { z } from "zod"
import { DB, PgClientLive } from "@/db"
import { event, eventInvitation, eventShareLink } from "@/db/schema"
import { ConflictError, EntityNotFoundError, ForbiddenError, InvalidInputError, runServerEffect } from "@/server/effect"
import { nativeSyncUser, syncJSON } from "@/server/sync/native-sync-auth"
import { acceptEventShareLink, previewEventShareLink } from "./repos/event-share-link.repo"
import { guestEventInvitations, respondToEvent } from "./repos/guest-invitation.repo"
import { EventService } from "./services/event.service"
import { EventServiceLive } from "./services/event.service.live"
import { EventRepoLive } from "./repos/event.repo.live"
import { EventAuthorizationLive } from "./services/event-authorization.service"

const tokenInput = z.object({ token: z.uuid().transform((value) => value.toLowerCase()) })
const responseInput = z.object({ eventId: z.uuid().transform((value) => value.toLowerCase()), attendance: z.enum(["going", "not_sure", "not_going"]) })

export async function invitationConsumptionResponse(request: Request, operation: "preview" | "accept" | "events" | "respond") {
  let status = 500
  const result = await runServerEffect(Effect.gen(function* () {
    const account = yield* Effect.tryPromise(() => nativeSyncUser(request))
    if (operation !== "preview" && !account?.emailVerified) {
      status = account ? 403 : 401
      return yield* Effect.fail(new ForbiddenError({ category: "authorization", code: "INVITATION_SESSION_REQUIRED",
        userMessage: account ? "Verify your email before continuing." : "Sign in to continue with this invitation." }))
    }
    if (operation === "events") return { events: yield* guestEventInvitations(account!.id) }
    const body = operation === "preview" ? { token: new URL(request.url).searchParams.get("token") }
      : yield* Effect.tryPromise({ try: () => request.json(), catch: () => new InvalidInputError({ category: "validation", code: "INVALID_INVITATION", userMessage: "This invitation could not be read." }) })
    if (operation === "respond") {
      const parsed = responseInput.safeParse(body)
      if (!parsed.success) { status = 400; return yield* Effect.fail(new InvalidInputError({ category: "validation", code: "INVALID_RESPONSE", userMessage: "Choose an attendance response and try again." })) }
      return yield* respondToEvent(account!.id, parsed.data.eventId, parsed.data.attendance)
    }
    const parsed = tokenInput.safeParse(body)
    if (!parsed.success) { status = 400; return yield* Effect.fail(new InvalidInputError({ category: "validation", code: "INVALID_INVITATION", userMessage: "This invitation link is invalid. Ask the host for a new one." })) }
    const token = parsed.data.token
    const db = yield* DB
    const [shared] = yield* db.select({ id: eventShareLink.eventId }).from(eventShareLink).where(eq(eventShareLink.token, token)).limit(1)
    if (operation === "preview") {
      if (shared) {
        const preview = yield* previewEventShareLink(token, account?.id)
        if (!preview) return yield* Effect.fail(new EntityNotFoundError({ category: "not_found", code: "INVITATION_UNAVAILABLE", userMessage: "This invitation has expired or been disabled. Ask the host for a new link." }))
        return { ...preview, requiresSignIn: false }
      }
      if (!account) return { requiresSignIn: true }
      const [invitation] = yield* db.select({ title: event.title, role: eventInvitation.role, status: eventInvitation.status,
        expiresAt: eventInvitation.expiresAt, startsAt: event.startsAt, locationName: event.locationName })
        .from(eventInvitation).innerJoin(event, eq(event.id, eventInvitation.eventId))
        .where(and(eq(eventInvitation.token, token), eq(eventInvitation.email, account.email.trim().toLowerCase()))).limit(1)
      if (!invitation || !["pending", "accepted"].includes(invitation.status) || (invitation.status !== "accepted" && invitation.expiresAt <= new Date())) {
        return yield* Effect.fail(new EntityNotFoundError({ category: "not_found", code: "INVITATION_UNAVAILABLE", userMessage: "This invitation is unavailable. Check the invited email address or ask the host for a new link." }))
      }
      return { ...invitation, expiresAt: invitation.expiresAt.toISOString(), startsAt: invitation.startsAt?.toISOString() ?? null, requiresSignIn: false }
    }
    const service = yield* EventService
    const accepted = shared ? yield* acceptEventShareLink(account!.id, token)
      : yield* service.acceptInvitation({ userId: account!.id, userEmail: account!.email, invitation: { token } })
    const [target] = yield* db.select({ parent: event.parentEventId }).from(event).where(eq(event.id, accepted.eventId)).limit(1)
    return { ...accepted, planningScopeId: target?.parent === null && accepted.role !== "guest" ? accepted.eventId : null }
  }).pipe(Effect.provide(EventServiceLive), Effect.provide(EventRepoLive), Effect.provide(EventAuthorizationLive), Effect.provide(PgClientLive),
    Effect.tapError((error) => Effect.sync(() => {
      if (error instanceof ForbiddenError) status = status === 401 ? 401 : 403
      else if (error instanceof InvalidInputError) status = 400
      else if (error instanceof EntityNotFoundError) status = 404
      else if (error instanceof ConflictError) status = 409
    }))))
  return syncJSON(result, result.ok ? 200 : status)
}

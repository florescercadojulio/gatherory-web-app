import { and, eq } from "drizzle-orm"
import { Effect } from "effect"
import { z } from "zod"
import { DB, PgClientLive } from "@/db"
import { event, eventInvitation, eventShareLink } from "@/db/schema"
import { EntityNotFoundError, ForbiddenError, InvalidInputError, runServerResponse, tryServerOperation } from "@/server/effect"
import { nativeSyncUser } from "@/server/sync/native-sync-auth"
import { acceptEventShareLink, previewEventShareLink } from "./repos/event-share-link.repo"
import { guestEventInvitations, invitationCoverURL, respondToEvent } from "./repos/guest-invitation.repo"
import { leaveGuestEvent } from "./repos/event-departure.repo"
import { isTrustedModerationMutation } from "@/server/moderation/contracts"
import { EventService } from "./services/event.service"
import { EventServiceLive } from "./services/event.service.live"
import { EventRepoLive } from "./repos/event.repo.live"
import { EventAuthorizationLive } from "./services/event-authorization.service"

const tokenInput = z.object({ token: z.uuid().transform((value) => value.toLowerCase()) })
const responseInput = z.object({ eventId: z.uuid().transform((value) => value.toLowerCase()), attendance: z.enum(["going", "not_sure", "not_going"]) })

export async function invitationConsumptionResponse(request: Request, operation: "preview" | "accept" | "events" | "respond" | "leave") {
  return runServerResponse(Effect.gen(function* () {
    const account = yield* tryServerOperation({ category: "system", code: "SESSION_LOOKUP_FAILED", userMessageKey: "serverErrors.SESSION_LOOKUP_FAILED" }, () => nativeSyncUser(request))
    if (operation !== "preview" && !account?.emailVerified) {
      return yield* Effect.fail(new ForbiddenError({ category: "authorization", code: "INVITATION_SESSION_REQUIRED",
        userMessageKey: "serverErrors.INVITATION_SESSION_REQUIRED", httpStatus: account ? 403 : 401 }))
    }
    if (operation === "events") return { events: yield* guestEventInvitations(account!.id) }
    if (operation !== "preview" && !isTrustedModerationMutation(request, process.env.BETTER_AUTH_URL)) {
      return yield* Effect.fail(new ForbiddenError({ category: "authorization", code: "UNTRUSTED_INVITATION_REQUEST", userMessageKey: "serverErrors.UNTRUSTED_INVITATION_REQUEST" }))
    }
    const body = operation === "preview" ? { token: new URL(request.url).searchParams.get("token") }
      : yield* Effect.tryPromise({ try: () => request.json(), catch: (cause) => new InvalidInputError({ category: "validation", code: "INVALID_INVITATION", userMessageKey: "serverErrors.INVALID_INVITATION", cause }) })
    if (operation === "respond") {
      const parsed = responseInput.safeParse(body)
      if (!parsed.success) { return yield* Effect.fail(new InvalidInputError({ category: "validation", code: "INVALID_RESPONSE", userMessageKey: "serverErrors.INVALID_RESPONSE" })) }
      return yield* respondToEvent(account!.id, parsed.data.eventId, parsed.data.attendance)
    }
    if (operation === "leave") {
      const parsed = z.object({ eventId: z.uuid().transform(value => value.toLowerCase()) }).strict().safeParse(body)
      if (!parsed.success) return yield* Effect.fail(new InvalidInputError({ category: "validation", code: "INVALID_EVENT", userMessageKey: "serverErrors.INVALID_EVENT" }))
      return yield* leaveGuestEvent(account!.id, parsed.data.eventId)
    }
    const parsed = tokenInput.safeParse(body)
    if (!parsed.success) { return yield* Effect.fail(new InvalidInputError({ category: "validation", code: "INVALID_INVITATION", userMessageKey: "serverErrors.INVALID_INVITATION" })) }
    const token = parsed.data.token
    const db = yield* DB
    const [shared] = yield* db.select({ id: eventShareLink.eventId }).from(eventShareLink).where(eq(eventShareLink.token, token)).limit(1)
    if (operation === "preview") {
      if (shared) {
        const preview = yield* previewEventShareLink(token, account?.id)
        if (!preview) return yield* Effect.fail(new EntityNotFoundError({ category: "not_found", code: "INVITATION_UNAVAILABLE", userMessageKey: "serverErrors.INVITATION_UNAVAILABLE" }))
        return { ...preview, coverURL: yield* invitationCoverURL(shared.id, account?.id), requiresSignIn: false }
      }
      if (!account) return { requiresSignIn: true }
      const [invitation] = yield* db.select({ eventId: event.id, title: event.title, role: eventInvitation.role, status: eventInvitation.status,
        expiresAt: eventInvitation.expiresAt, startsAt: event.startsAt, locationName: event.locationName })
        .from(eventInvitation).innerJoin(event, eq(event.id, eventInvitation.eventId))
        .where(and(eq(eventInvitation.token, token), eq(eventInvitation.email, account.email.trim().toLowerCase()))).limit(1)
      if (!invitation || !["pending", "accepted"].includes(invitation.status) || (invitation.status !== "accepted" && invitation.expiresAt <= new Date())) {
        return yield* Effect.fail(new EntityNotFoundError({ category: "not_found", code: "INVITATION_UNAVAILABLE", userMessageKey: "serverErrors.INVITATION_UNAVAILABLE" }))
      }
      const { eventId, ...details } = invitation
      return { ...details, coverURL: yield* invitationCoverURL(eventId, account.id), expiresAt: invitation.expiresAt.toISOString(), startsAt: invitation.startsAt?.toISOString() ?? null, requiresSignIn: false }
    }
    const service = yield* EventService
    const accepted = shared ? yield* acceptEventShareLink(account!.id, token)
      : yield* service.acceptInvitation({ userId: account!.id, userEmail: account!.email, invitation: { token } })
    const [target] = yield* db.select({ parent: event.parentEventId }).from(event).where(eq(event.id, accepted.eventId)).limit(1)
    const awaitingApproval = "status" in accepted && accepted.status === "awaiting_approval"
    return { ...accepted, planningScopeId: !awaitingApproval && target?.parent === null && accepted.role !== "guest" ? accepted.eventId : null }
  }).pipe(Effect.provide(EventServiceLive), Effect.provide(EventRepoLive), Effect.provide(EventAuthorizationLive), Effect.provide(PgClientLive),
  ), { headers: request.headers, operation: `invitation.${operation}` })
}

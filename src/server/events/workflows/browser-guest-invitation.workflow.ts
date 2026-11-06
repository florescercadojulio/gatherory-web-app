import { Effect } from 'effect'
import { ConflictError } from '@/server/effect'
import type {
  BrowserGuestEvent,
  BrowserGuestInvitationPreview,
  BrowserGuestStatus,
} from '../contracts/browser-guest.contracts'
import { BrowserGuestRepo } from '../repos/browser-guest.repo'

export type BrowserGuestIdentity = { id: string; credential: string }

export const joinBrowserGuestInvitationWorkflow = (input: {
  identity: BrowserGuestIdentity
  token: string
  name: string
}) =>
  Effect.gen(function* () {
    const repo = yield* BrowserGuestRepo
    const verified = yield* repo
      .verify({ guestId: input.identity.id, credential: input.identity.credential })
      .pipe(Effect.catchTag('ForbiddenError', () => Effect.succeed(null)))
    if (verified && verified.name !== input.name) {
      return yield* Effect.fail(
        new ConflictError({
          category: 'conflict',
          code: 'BROWSER_GUEST_NAME_MISMATCH',
          userMessageKey: 'serverErrors.CONFLICT',
        })
      )
    }
    const registration = verified
      ? verified
      : yield* repo.register({
          id: input.identity.id,
          name: input.name,
          credential: input.identity.credential,
        })
    const joined = yield* repo.join({
      guestId: registration.id,
      credential: input.identity.credential,
      token: input.token,
    })
    return { eventId: joined.eventId, joined: true as const }
  })

export const respondAsBrowserGuestWorkflow = (input: {
  identity: BrowserGuestIdentity
  eventId: string
  attendance: 'going' | 'not_sure' | 'not_going'
}) =>
  Effect.gen(function* () {
    const repo = yield* BrowserGuestRepo
    yield* repo.verify({ guestId: input.identity.id, credential: input.identity.credential })
    yield* repo.respond({
      guestId: input.identity.id,
      credential: input.identity.credential,
      eventId: input.eventId,
      attendance: input.attendance,
    })
    return { eventId: input.eventId, attendance: input.attendance }
  })

export const getBrowserGuestEventWorkflow = (input: {
  identity: BrowserGuestIdentity
  eventId: string
}) =>
  Effect.gen(function* () {
    const repo = yield* BrowserGuestRepo
    const verified = yield* repo.verify({
      guestId: input.identity.id,
      credential: input.identity.credential,
    })
    const event = yield* repo.getEvent(verified.id, input.eventId)
    return { event }
  })

export const getBrowserGuestInvitationStatusWorkflow = (input: {
  identity?: BrowserGuestIdentity
  token: string
}) =>
  Effect.gen(function* () {
    const repo = yield* BrowserGuestRepo
    const previewCandidate = yield* repo.preview(input.token)
    const preview = previewCandidate?.role === 'guest' ? previewCandidate : null
    const eventId = yield* repo.getShareLinkEventId(input.token)
    let guest: BrowserGuestStatus | null = null
    let ownEvent: BrowserGuestEvent | null = null
    let verified: { id: string; name: string } | null = null
    if (input.identity) {
      verified = yield* repo
        .verify({
          guestId: input.identity.id,
          credential: input.identity.credential,
        })
        .pipe(Effect.catchTag('ForbiddenError', () => Effect.succeed(null)))
    }
    if (verified && eventId) {
      ownEvent = yield* repo.getEvent(verified.id, eventId)
      if (ownEvent) {
        guest = {
          eventId,
          name: verified.name,
          attendance: ownEvent.attendance,
          canRespond: ownEvent.canRespond,
        }
      }
    }
    const invitation: BrowserGuestInvitationPreview | null =
      preview && eventId
        ? {
            eventId,
            title: preview.title,
            startsAt: preview.startsAt,
            timeZone: preview.timeZone,
            isAllDay: preview.isAllDay,
            locationName: preview.locationName,
            role: 'guest',
            status: guest ? 'accepted' : 'pending',
            expiresAt: preview.expiresAt,
          }
        : guest && eventId && ownEvent
          ? {
              eventId,
              title: ownEvent.title,
              startsAt: ownEvent.startsAt,
              timeZone: ownEvent.timeZone,
              isAllDay: ownEvent.isAllDay,
              locationName: ownEvent.locationName,
              role: 'guest' as const,
              status: 'accepted' as const,
              expiresAt: null,
            }
          : null
    return { invitation, guest, identityName: verified?.name ?? null }
  })

import { Effect } from 'effect'
import { z } from 'zod'
import { PgClientLive } from '@/db'
import { requestJson, requestUser, validateInput } from '@/server/http-errors'
import { ForbiddenError, runServerResponse } from '@/server/effect-utils'
import { listDeviceGuestEventInvitationsWorkflow } from '../workflows/event-guest.workflows.live'
import {
  GuestAttendanceSchema,
  GuestCredentialSchema,
  GuestEventSchema,
  GuestProfileRegistrationSchema,
  GuestShareTokenSchema,
} from '../contracts/guest-capability.contracts'
import {
  claimDeviceGuestProfile,
  joinDeviceGuestEvent,
  leaveDeviceGuestEvent,
  registerDeviceGuestProfile,
  respondToDeviceGuestEvent,
  verifyDeviceGuestProfile,
} from '../repos/device-guest.repo.persistence'

const guestID = z.uuid().transform((value) => value.toLowerCase())
const guestHeaders = z.object({
  guestId: guestID,
  credential: GuestCredentialSchema,
})

function readGuestHeaders(request: Request) {
  return validateInput(guestHeaders, {
    guestId: request.headers.get('x-gatherory-guest-id'),
    credential: request.headers.get('x-gatherory-guest-token'),
  })
}

function verifiedAccount(request: Request) {
  return Effect.flatMap(requestUser(request), (account) =>
    account.emailVerified
      ? Effect.succeed(account)
      : Effect.fail(
          new ForbiddenError({
            category: 'authorization',
            code: 'GUEST_CLAIM_REQUIRES_VERIFIED_ACCOUNT',
            userMessageKey: 'serverErrors.INVITATION_EMAIL_UNVERIFIED',
          })
        )
  )
}

export function deviceGuestSessionResponse(request: Request) {
  return runServerResponse(
    Effect.gen(function* () {
      const input = yield* validateInput(
        GuestProfileRegistrationSchema,
        yield* requestJson(request)
      )
      return yield* registerDeviceGuestProfile(input)
    }).pipe(Effect.provide(PgClientLive)),
    { headers: request.headers, operation: 'guest.session.register' }
  )
}

export function deviceGuestEventsResponse(request: Request) {
  return runServerResponse(
    Effect.gen(function* () {
      const identity = yield* readGuestHeaders(request)
      const profile = yield* verifyDeviceGuestProfile(identity)
      if (request.method === 'GET') {
        return { events: yield* listDeviceGuestEventInvitationsWorkflow(profile.id) }
      }
      const body = yield* requestJson(request)
      if (request.method === 'POST') {
        const input = yield* validateInput(GuestShareTokenSchema, body)
        return yield* joinDeviceGuestEvent({
          guestId: profile.id,
          credential: identity.credential,
          token: input.token,
        })
      }
      if (request.method === 'PATCH') {
        const input = yield* validateInput(GuestAttendanceSchema, body)
        return yield* respondToDeviceGuestEvent({
          guestId: profile.id,
          credential: identity.credential,
          eventId: input.eventId,
          attendance: input.attendance,
        })
      }
      const input = yield* validateInput(GuestEventSchema, body)
      return yield* leaveDeviceGuestEvent({
        guestId: profile.id,
        credential: identity.credential,
        eventId: input.eventId,
      })
    }).pipe(Effect.provide(PgClientLive)),
    { headers: request.headers, operation: `guest.events.${request.method.toLowerCase()}` }
  )
}

export function deviceGuestClaimResponse(request: Request) {
  return runServerResponse(
    Effect.gen(function* () {
      const account = yield* verifiedAccount(request)
      const identity = yield* readGuestHeaders(request)
      return yield* claimDeviceGuestProfile({
        guestId: identity.guestId,
        credential: identity.credential,
        userId: account.id,
        account: { name: account.name, email: account.email, image: account.image ?? null },
      })
    }).pipe(Effect.provide(PgClientLive)),
    { headers: request.headers, operation: 'guest.profile.claim' }
  )
}

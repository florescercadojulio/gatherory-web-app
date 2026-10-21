import { Effect } from 'effect'
import { z } from 'zod'
import { PgClientLive } from '@/db'
import { runServerResponse } from '@/server/effect-utils'
import { requestJson, requestUser, validateInput } from '@/server/http-errors'
import { GuestCredentialSchema } from '@/server/events/contracts/guest-capability.contracts'
import { verifyDeviceGuestProfile } from '@/server/events/repos/device-guest.repo.persistence'
import {
  AnnouncementEventSchema,
  SendAnnouncementSchema,
} from '../contracts/announcement.contracts'
import {
  listAnnouncementsWorkflow,
  sendAnnouncementWorkflow,
} from '../workflows/announcement.workflows.live'

export function announcementsResponse(request: Request, eventId: string) {
  return runServerResponse(
    Effect.gen(function* () {
      const account = yield* requestUser(request)
      const id = yield* validateInput(AnnouncementEventSchema, eventId)
      if (request.method === 'GET')
        return yield* listAnnouncementsWorkflow({
          eventId: id,
          actor: { kind: 'user', id: account.id },
        })
      const input = yield* validateInput(SendAnnouncementSchema, yield* requestJson(request))
      return {
        announcement: yield* sendAnnouncementWorkflow({
          ...input,
          eventId: id,
          userId: account.id,
        }),
      }
    }).pipe(Effect.provide(PgClientLive)),
    { headers: request.headers, operation: `event.announcements.${request.method.toLowerCase()}` }
  )
}

export function guestAnnouncementsResponse(request: Request, eventId: string) {
  return runServerResponse(
    Effect.gen(function* () {
      const identity = yield* validateInput(
        z.object({ guestId: AnnouncementEventSchema, credential: GuestCredentialSchema }),
        {
          guestId: request.headers.get('x-gatherory-guest-id'),
          credential: request.headers.get('x-gatherory-guest-token'),
        }
      )
      const profile = yield* verifyDeviceGuestProfile(identity)
      const id = yield* validateInput(AnnouncementEventSchema, eventId)
      return yield* listAnnouncementsWorkflow({
        eventId: id,
        actor: { kind: 'device_guest', id: profile.id },
      })
    }).pipe(Effect.provide(PgClientLive)),
    { headers: request.headers, operation: 'guest.event.announcements.list' }
  )
}

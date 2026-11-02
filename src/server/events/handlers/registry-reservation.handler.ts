import { Effect } from 'effect'
import { z } from 'zod'
import { PgClientLive } from '@/db'
import { runServerResponse } from '@/server/effect-utils'
import { requestJson, requestUser, validateInput } from '@/server/http-errors'
import { GuestCredentialSchema } from '../contracts/guest-capability.contracts'
import {
  changeRegistryReservation,
  listVisibleRegistry,
  type RegistryReservationActor,
} from '../repos/registry-reservation.repo.persistence'

const EventIdSchema = z.uuid().transform((value) => value.toLowerCase())
const ReservationCommandSchema = z
  .object({
    requestId: z.uuid().transform((value) => value.toLowerCase()),
    itemId: z.uuid().transform((value) => value.toLowerCase()),
    quantity: z.number().int().positive().optional(),
  })
  .strict()
const CancellationCommandSchema = z
  .object({
    requestId: z.uuid().transform((value) => value.toLowerCase()),
    itemId: z.uuid().transform((value) => value.toLowerCase()),
  })
  .strict()
const GuestIdentitySchema = z.object({
  guestId: EventIdSchema,
  credential: GuestCredentialSchema,
})

function registryAction(request: Request, eventId: string, actor: RegistryReservationActor) {
  return Effect.gen(function* () {
    const id = yield* validateInput(EventIdSchema, eventId)
    if (request.method === 'GET') return yield* listVisibleRegistry(id, actor)
    if (request.method === 'POST') {
      const command = yield* validateInput(ReservationCommandSchema, yield* requestJson(request))
      return yield* changeRegistryReservation(id, actor, command, 'reserve')
    }
    const command = yield* validateInput(CancellationCommandSchema, yield* requestJson(request))
    return yield* changeRegistryReservation(id, actor, command, 'cancel')
  })
}

export function accountRegistryReservationResponse(request: Request, eventId: string) {
  return runServerResponse(
    Effect.gen(function* () {
      const account = yield* requestUser(request)
      return yield* registryAction(request, eventId, { kind: 'user', id: account.id })
    }).pipe(Effect.provide(PgClientLive)),
    { headers: request.headers, operation: `event.registry.${request.method.toLowerCase()}` }
  )
}

export function guestRegistryReservationResponse(request: Request, eventId: string) {
  return runServerResponse(
    Effect.gen(function* () {
      const identity = yield* validateInput(GuestIdentitySchema, {
        guestId: request.headers.get('x-gatherory-guest-id'),
        credential: request.headers.get('x-gatherory-guest-token'),
      })
      return yield* registryAction(request, eventId, {
        kind: 'device_guest',
        id: identity.guestId,
        credential: identity.credential,
      })
    }).pipe(Effect.provide(PgClientLive)),
    { headers: request.headers, operation: `guest.registry.${request.method.toLowerCase()}` }
  )
}

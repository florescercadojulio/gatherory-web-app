import { beforeEach, expect, test, vi } from 'vitest'
import { Effect, Layer } from 'effect'
import { EntityNotFoundError, ForbiddenError } from '@/lib/domain-errors'

const state = vi.hoisted(() => ({
  accountId: 'registry-account-1',
  guestId: '16da1fb3-4f72-4571-8e95-becfd38725f8',
  credential: 'a'.repeat(43),
  anonymous: false,
  unavailable: false,
  reads: [] as unknown[],
  writes: [] as unknown[],
}))

vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/http-errors', async () => {
  const { validateInput } = await import('@/server/validation')
  return {
    validateInput,
    requestJson: (request: Request) => Effect.promise(() => request.json()),
    requestUser: () => state.anonymous
      ? Effect.fail(new ForbiddenError({ category: 'authorization', code: 'UNAUTHORIZED', httpStatus: 401, userMessageKey: 'serverErrors.UNAUTHORIZED' }))
      : Effect.succeed({ id: state.accountId }),
  }
})
vi.mock('@/server/events/repos/registry-reservation.repo.persistence', async () => {
  const { Effect } = await import('effect')
  return {
    listVisibleRegistry: (eventId: string, actor: unknown) => {
      state.reads.push({ eventId, actor })
      return state.unavailable
        ? Effect.fail(new EntityNotFoundError({ category: 'not_found', code: 'REGISTRY_UNAVAILABLE', userMessageKey: 'serverErrors.NOT_FOUND' }))
        : Effect.succeed({
            eventId,
            shared: true,
            canReserve: true,
            items: [{ id: '4dc61665-f8a4-4d2e-a829-08d1c5fc51bb', eventId, title: 'Place setting', category: 'home', quantity: 2, committedCount: 1, availableCount: 1, reservedQuantity: 0, isReservedByViewer: false, canReserve: true }],
          })
    },
    changeRegistryReservation: (eventId: string, actor: unknown, command: unknown, action: string) => {
      state.writes.push({ eventId, actor, command, action })
      return Effect.succeed({ eventId, itemId: '4dc61665-f8a4-4d2e-a829-08d1c5fc51bb', quantity: 2, committedCount: 2, availableCount: 0, reservedQuantity: 1, isReservedByViewer: true, canReserve: true, replayed: false })
    },
  }
})

const eventId = '7bcc6c2a-cc96-42cc-aab2-305771a2ce37'
const itemId = '4dc61665-f8a4-4d2e-a829-08d1c5fc51bb'
const guestHeaders = { 'x-gatherory-guest-id': state.guestId, 'x-gatherory-guest-token': state.credential }

beforeEach(() => {
  state.anonymous = false
  state.unavailable = false
  state.reads.length = 0
  state.writes.length = 0
})

test('account registry HTTP returns only the aggregate and binds reads and writes to the authenticated account', async () => {
  const { accountRegistryReservationResponse } = await import('@/server/events/handlers/registry-reservation.handler')
  const read = await accountRegistryReservationResponse(new Request(`https://app.example/api/events/${eventId}/registry`), eventId)
  expect(read.status).toBe(200)
  expect(read.headers.get('Cache-Control')).toBe('private, no-store')
  const body = await read.json()
  expect(body).toEqual({ ok: true, data: expect.objectContaining({ eventId, shared: true, items: [expect.objectContaining({ id: itemId, committedCount: 1, availableCount: 1 })] }) })
  expect(JSON.stringify(body)).not.toContain(state.accountId)

  const requestId = 'c0d7b6f0-9f4a-4c4a-8ef1-fad4e0e96c76'
  const write = await accountRegistryReservationResponse(new Request(`https://app.example/api/events/${eventId}/registry`, {
    method: 'POST', body: JSON.stringify({ requestId, itemId, quantity: 1 }),
  }), eventId)
  expect(write.status).toBe(200)
  expect(await write.json()).toEqual({ ok: true, data: expect.objectContaining({ eventId, itemId, reservedQuantity: 1 }) })
  expect(state.reads).toEqual([{ eventId, actor: { kind: 'user', id: state.accountId } }])
  expect(state.writes).toEqual([{ eventId, actor: { kind: 'user', id: state.accountId }, command: { requestId, itemId, quantity: 1 }, action: 'reserve' }])
})

test('guest registry HTTP verifies proof fields and keeps actor credentials out of the response', async () => {
  const { guestRegistryReservationResponse } = await import('@/server/events/handlers/registry-reservation.handler')
  const response = await guestRegistryReservationResponse(new Request(`https://app.example/api/guest/events/${eventId}/registry`, { headers: guestHeaders }), eventId)
  expect(response.status).toBe(200)
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  const body = await response.json()
  expect(body).toEqual({ ok: true, data: expect.objectContaining({ eventId, shared: true, items: [expect.objectContaining({ id: itemId, quantity: 2 })] }) })
  expect(JSON.stringify(body)).not.toContain(state.guestId)
  expect(JSON.stringify(body)).not.toContain(state.credential)

  const requestId = 'b2027174-07b7-49ae-b55a-f89993decb16'
  const write = await guestRegistryReservationResponse(new Request(`https://app.example/api/guest/events/${eventId}/registry`, {
    method: 'POST', headers: { ...guestHeaders, 'content-type': 'application/json' },
    body: JSON.stringify({ requestId, itemId, quantity: 1 }),
  }), eventId)
  expect(write.status).toBe(200)
  expect(JSON.stringify(await write.json())).not.toContain(state.credential)
  expect(state.reads[0]).toEqual({ eventId, actor: { kind: 'device_guest', id: state.guestId, credential: state.credential } })
  expect(state.writes[0]).toEqual({ eventId, actor: { kind: 'device_guest', id: state.guestId, credential: state.credential }, command: { requestId, itemId, quantity: 1 }, action: 'reserve' })
})

test('anonymous, malformed guest proof, and malformed commands fail before registry access', async () => {
  const { accountRegistryReservationResponse, guestRegistryReservationResponse } = await import('@/server/events/handlers/registry-reservation.handler')
  state.anonymous = true
  const anonymous = await accountRegistryReservationResponse(new Request(`https://app.example/api/events/${eventId}/registry`), eventId)
  expect(anonymous.status).toBe(401)
  state.anonymous = false

  const missingProof = await guestRegistryReservationResponse(new Request(`https://app.example/api/guest/events/${eventId}/registry`, {
    headers: { 'x-gatherory-guest-id': state.guestId },
  }), eventId)
  expect(missingProof.status).toBe(400)
  const malformed = await accountRegistryReservationResponse(new Request(`https://app.example/api/events/${eventId}/registry`, {
    method: 'POST', body: JSON.stringify({ requestId: crypto.randomUUID(), itemId, quantity: 1, userId: 'attacker' }),
  }), eventId)
  expect(malformed.status).toBe(400)
  const oversized = await accountRegistryReservationResponse(new Request(`https://app.example/api/events/${eventId}/registry`, {
    method: 'POST', body: JSON.stringify({ requestId: crypto.randomUUID(), itemId, quantity: Number.MAX_SAFE_INTEGER + 1 }),
  }), eventId)
  expect(oversized.status).toBe(400)
  expect(state.reads).toEqual([])
  expect(state.writes).toEqual([])
})

test('unavailable exact event serializes the same private not-found response without item details', async () => {
  const { accountRegistryReservationResponse } = await import('@/server/events/handlers/registry-reservation.handler')
  state.unavailable = true
  const hiddenEventId = crypto.randomUUID()
  const response = await accountRegistryReservationResponse(new Request(`https://app.example/api/events/${hiddenEventId}/registry`), hiddenEventId)
  expect(response.status).toBe(404)
  const body = await response.json()
  expect(body.ok).toBe(false)
  expect(JSON.stringify(body)).not.toContain(hiddenEventId)
  expect(JSON.stringify(body)).not.toContain(itemId)
  expect(JSON.stringify(body)).not.toContain(state.accountId)
})

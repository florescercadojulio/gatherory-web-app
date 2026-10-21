import { afterAll, beforeEach, expect, test, vi } from 'vitest'
import { Effect, Layer } from 'effect'
import { ForbiddenError } from '@/lib/domain-errors'

const calls = vi.hoisted(() => ({
  user: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  revoke: vi.fn(),
  requests: vi.fn(),
  review: vi.fn(),
  invite: vi.fn(),
}))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/sync/handlers/native-sync-auth.handler', () => ({ nativeSyncUser: calls.user }))
vi.mock('@/server/events/workflows/event.workflows.live', () => ({
  inviteEventParticipantWorkflow: calls.invite,
}))
vi.mock('@/server/events/workflows/event-sharing.workflows.live', () => ({
  listActiveEventShareLinksWorkflow: calls.list,
  createEventShareLinkWorkflow: calls.create,
  revokeEventShareLinkWorkflow: calls.revoke,
  listEventJoinRequestsWorkflow: calls.requests,
  reviewEventJoinRequestWorkflow: calls.review,
}))
const { eventJoinRequestsResponse, createInvitationResponse, revokeInvitationResponse } =
  await import('@/server/events/handlers/invitation-api.handler')
const eventId = '10000000-0000-4000-8000-000000000001'
const token = '20000000-0000-4000-8000-000000000001'
function request(method: string, body?: unknown, query = '') {
  return new Request(`https://app.example/api/invitations${query}`, {
    method,
    headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('BETTER_AUTH_URL', 'https://app.example')
  calls.user.mockResolvedValue({ id: 'host-account', emailVerified: true })
})
afterAll(() => vi.unstubAllEnvs())

test('share-link GET is explicit and returns only public link fields with role and nullable expiry', async () => {
  calls.list.mockReturnValue(
    Effect.succeed([
      { eventId, token, role: 'guest', expiresAt: null, createdByUserId: 'private-owner' },
      {
        eventId,
        token: '30000000-0000-4000-8000-000000000001',
        role: 'collaborator',
        expiresAt: new Date('2026-12-01T00:00:00Z'),
        email: 'private@example.com',
      },
    ])
  )
  const response = await eventJoinRequestsResponse(
    request('GET', undefined, `?eventId=${eventId}&kind=share-links`)
  )
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    ok: true,
    data: {
      links: [
        {
          eventId,
          email: null,
          role: 'guest',
          expiresAt: null,
          url: `https://app.example/join/${token}`,
        },
        {
          eventId,
          email: null,
          role: 'collaborator',
          expiresAt: '2026-12-01T00:00:00.000Z',
          url: 'https://app.example/join/30000000-0000-4000-8000-000000000001',
        },
      ],
    },
  })
  expect(calls.list).toHaveBeenCalledWith('host-account', eventId)
  expect(calls.requests).not.toHaveBeenCalled()
  expect(response.headers.get('Cache-Control')).toContain('no-store')
})

test('GET without the share-link discriminator preserves the approval request response', async () => {
  const result = { requests: [{ id: 'pending-request', userId: 'requesting-account' }] }
  calls.requests.mockReturnValue(Effect.succeed(result))
  const response = await eventJoinRequestsResponse(request('GET', undefined, `?eventId=${eventId}`))
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ ok: true, data: result })
  expect(calls.requests).toHaveBeenCalledWith('host-account', eventId)
  expect(calls.list).not.toHaveBeenCalled()
})

test.each(['guest', 'collaborator'])(
  'POST serializes the independent %s link without an expiration date',
  async (role) => {
    calls.create.mockReturnValue(Effect.succeed({ eventId, token, role, expiresAt: null }))
    const response = await createInvitationResponse(request('POST', { eventId, role }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      ok: true,
      data: {
        eventId,
        email: null,
        role,
        expiresAt: null,
        url: `https://app.example/join/${token}`,
      },
    })
    expect(calls.create).toHaveBeenCalledWith('host-account', { eventId, role })
  }
)

test.each(['guest', 'collaborator', undefined])(
  'DELETE preserves selected role %s and legacy revoke-all requests',
  async (role) => {
    calls.revoke.mockReturnValue(Effect.succeed({ eventId }))
    const response = await revokeInvitationResponse(
      request('DELETE', { eventId, ...(role ? { role } : {}) })
    )
    expect(response.status).toBe(200)
    expect(calls.revoke).toHaveBeenCalledWith('host-account', eventId, role)
  }
)

test('invalid role cannot become a revoke-all operation', async () => {
  const response = await revokeInvitationResponse(request('DELETE', { eventId, role: 'host' }))
  expect(response.status).toBe(400)
  expect(calls.revoke).not.toHaveBeenCalled()
})

test.each([null, { id: 'unverified-account', emailVerified: false }])(
  'unverified or absent identity cannot read or mutate links',
  async (identity) => {
    calls.user.mockResolvedValue(identity)
    for (const response of [
      await eventJoinRequestsResponse(
        request('GET', undefined, `?eventId=${eventId}&kind=share-links`)
      ),
      await createInvitationResponse(request('POST', { eventId, role: 'guest' })),
      await revokeInvitationResponse(request('DELETE', { eventId, role: 'guest' })),
    ])
      expect(response.status).toBeGreaterThanOrEqual(400)
    expect(calls.list).not.toHaveBeenCalled()
    expect(calls.create).not.toHaveBeenCalled()
    expect(calls.revoke).not.toHaveBeenCalled()
  }
)

test('manager denial remains a failure rather than an empty share list', async () => {
  calls.list.mockReturnValue(
    Effect.fail(
      new ForbiddenError({
        category: 'authorization',
        code: 'EVENT_PERMISSION_REQUIRED',
        userMessageKey: 'serverErrors.EVENT_PERMISSION_REQUIRED',
      })
    )
  )
  const response = await eventJoinRequestsResponse(
    request('GET', undefined, `?eventId=${eventId}&kind=share-links`)
  )
  expect(response.status).toBe(403)
  const body = await response.json()
  expect(body.ok).toBe(false)
  expect(body).not.toHaveProperty('data.links')
})

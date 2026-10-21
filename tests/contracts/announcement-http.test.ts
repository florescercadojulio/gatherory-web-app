import { expect, test, vi } from 'vitest'
import { Effect, Layer } from 'effect'
import { ForbiddenError } from '@/lib/domain-errors'

const fixtures = vi.hoisted(() => ({
  accountId: 'account-1',
  verifiedGuest: 'guest-1',
  calls: [] as unknown[],
  denyProof: false,
}))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/http-errors', async () => {
  const { validateInput } = await import('@/server/validation')
  return {
    validateInput,
    requestUser: () => Effect.succeed({ id: fixtures.accountId }),
    requestJson: (request: Request) => Effect.promise(() => request.json()),
  }
})
vi.mock('@/server/events/repos/device-guest.repo.persistence', () => ({
  verifyDeviceGuestProfile: () =>
    fixtures.denyProof
      ? Effect.fail(
          new ForbiddenError({
            category: 'authorization',
            code: 'GUEST_SESSION_INVALID',
            userMessageKey: 'serverErrors.AUTHORIZATION',
          })
        )
      : Effect.succeed({ id: fixtures.verifiedGuest }),
}))
vi.mock('@/server/announcements/workflows/announcement.workflows.live', () => ({
  listAnnouncementsWorkflow: (input: unknown) =>
    Effect.sync(() => {
      fixtures.calls.push(input)
      return { announcements: [], canSend: false, allowedAudiences: [] }
    }),
  sendAnnouncementWorkflow: (input: unknown) =>
    Effect.sync(() => {
      fixtures.calls.push(input)
      return { id: 'announcement-1' }
    }),
}))

const eventId = '7bcc6c2a-cc96-42cc-aab2-305771a2ce37'
test('announcement HTTP sends preserve standard envelopes and private no-store responses', async () => {
  fixtures.calls.length = 0
  const { announcementsResponse } =
    await import('@/server/announcements/handlers/announcement-api.handler')
  const requestId = 'b2027174-07b7-49ae-b55a-f89993decb16'
  const request = new Request(`https://example.test/api/events/${eventId}/announcements`, {
    method: 'POST',
    body: JSON.stringify({ requestId, message: '  Update  ' }),
  })
  const response = await announcementsResponse(request, eventId)
  expect(response.status).toBe(200)
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  expect(await response.json()).toEqual({
    ok: true,
    data: { announcement: { id: 'announcement-1' } },
  })
  expect(fixtures.calls).toEqual([
    { eventId, requestId, userId: 'account-1', message: 'Update', audience: 'all' },
  ])
})

test('guest HTTP reads use verified identity and never reach history when proof fails', async () => {
  fixtures.calls.length = 0
  const { guestAnnouncementsResponse } =
    await import('@/server/announcements/handlers/announcement-api.handler')
  const request = new Request(`https://example.test/api/guest/events/${eventId}/announcements`, {
    headers: { 'x-gatherory-guest-id': eventId, 'x-gatherory-guest-token': 'a'.repeat(43) },
  })
  const response = await guestAnnouncementsResponse(request, eventId)
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  expect(await response.json()).toEqual({
    ok: true,
    data: { announcements: [], canSend: false, allowedAudiences: [] },
  })
  expect(fixtures.calls).toEqual([{ eventId, actor: { kind: 'device_guest', id: 'guest-1' } }])
  fixtures.calls.length = 0
  fixtures.denyProof = true
  try {
    const denied = await guestAnnouncementsResponse(request, eventId)
    expect(denied.status).toBe(403)
    expect(fixtures.calls).toEqual([])
  } finally {
    fixtures.denyProof = false
  }
})

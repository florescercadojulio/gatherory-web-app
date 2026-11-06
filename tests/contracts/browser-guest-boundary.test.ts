import { beforeEach, expect, test, vi } from 'vitest'
import { Effect, Layer } from 'effect'

const mocks = vi.hoisted(() => ({
  allowed: true,
  identity: null as null | { id: string; credential: string },
  prepare: vi.fn(),
  end: vi.fn(),
  join: vi.fn(),
  respond: vi.fn(),
  read: vi.fn(),
  status: vi.fn(),
  header: vi.fn(),
}))

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const builder = {
      validator: () => builder,
      handler: (fn: unknown) => fn,
    }
    return builder
  },
}))
vi.mock('@tanstack/react-start/server', () => ({
  setResponseHeader: mocks.header,
  getRequestHeaders: () => new Headers(),
}))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/events/handlers/browser-guest-session.adapter', () => ({
  isAllowedBrowserGuestPost: () => mocks.allowed,
  readBrowserGuestSessionIdentity: async () => mocks.identity,
  prepareBrowserGuestSessionIdentity: mocks.prepare,
  endBrowserGuestSessionIdentity: mocks.end,
}))
vi.mock('@/server/events/workflows/browser-guest-invitation.workflows.live', () => ({
  getBrowserGuestInvitationStatusWorkflow: mocks.status,
  joinBrowserGuestInvitationWorkflow: mocks.join,
  respondAsBrowserGuestWorkflow: mocks.respond,
  getBrowserGuestEventWorkflow: mocks.read,
}))

import {
  endBrowserGuestSession,
  getBrowserGuestEvent,
  getBrowserGuestInvitationStatus,
  joinBrowserGuestInvitation,
  prepareBrowserGuestSession,
  respondAsBrowserGuest,
} from '@/server/events/handlers/browser-guest-invitation.handler'

const eventId = '970ead59-c37d-4c45-9a96-34514fa08013'
const token = '38ae1cf2-b5ec-455b-8c5d-f32798df03c8'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.allowed = true
  mocks.identity = null
  mocks.prepare.mockResolvedValue({ id: 'server-identity', credential: 'never-serialize-me' })
  mocks.end.mockResolvedValue(undefined)
  mocks.join.mockImplementation(() => Effect.succeed({ eventId, joined: true }))
  mocks.respond.mockImplementation(() => Effect.succeed({ eventId, attendance: 'going' }))
  mocks.read.mockImplementation(() => Effect.succeed({ event: null }))
  mocks.status.mockImplementation(() => Effect.succeed({ invitation: null, guest: null }))
})

test('preview without a cookie does not establish identity or enroll an attendee', async () => {
  const result = await getBrowserGuestInvitationStatus({ data: { token } })
  expect(result).toEqual({ ok: true, data: { invitation: null, guest: null } })
  expect(mocks.prepare).not.toHaveBeenCalled()
  expect(mocks.join).not.toHaveBeenCalled()
  expect(mocks.header).toHaveBeenCalledWith('Cache-Control', 'private, no-store')
})

test('preparation persists cookie transport before enrollment and serializes no bearer secret', async () => {
  const result = await prepareBrowserGuestSession({ data: {} })
  expect(result).toEqual({ ok: true, data: { prepared: true } })
  expect(mocks.prepare).toHaveBeenCalledOnce()
  expect(mocks.join).not.toHaveBeenCalled()
  expect(JSON.stringify(result)).not.toContain('never-serialize-me')
})

test('cross-origin posts and requests without the prepared cookie cannot enroll or respond', async () => {
  mocks.allowed = false
  expect((await prepareBrowserGuestSession({ data: {} })).ok).toBe(false)
  expect((await joinBrowserGuestInvitation({ data: { token, name: 'Alex' } })).ok).toBe(false)
  expect((await respondAsBrowserGuest({ data: { eventId, attendance: 'going' } })).ok).toBe(false)
  expect(mocks.prepare).not.toHaveBeenCalled()
  mocks.allowed = true
  expect((await joinBrowserGuestInvitation({ data: { token, name: 'Alex' } })).ok).toBe(false)
  expect(mocks.join).not.toHaveBeenCalled()
  expect(mocks.respond).not.toHaveBeenCalled()
})

test('invalid identifiers fail inside the safe result boundary before domain reads or writes', async () => {
  mocks.identity = { id: 'server-identity', credential: 'never-serialize-me' }
  expect((await getBrowserGuestEvent({ data: { eventId: 'invalid' } })).ok).toBe(false)
  expect((await joinBrowserGuestInvitation({ data: { token: 'invalid', name: '' } })).ok).toBe(
    false
  )
  expect(mocks.read).not.toHaveBeenCalled()
  expect(mocks.join).not.toHaveBeenCalled()
})

test('attendance identity is derived only from the cookie, and ending a session does not delete a guest', async () => {
  mocks.identity = { id: 'cookie-principal', credential: 'never-serialize-me' }
  const result = await respondAsBrowserGuest({ data: { eventId, attendance: 'going' } })
  expect(result.ok).toBe(true)
  expect(mocks.respond).toHaveBeenCalledWith({
    identity: mocks.identity,
    eventId,
    attendance: 'going',
  })
  expect(JSON.stringify(result)).not.toContain('never-serialize-me')
  expect((await endBrowserGuestSession({ data: {} })).ok).toBe(true)
  expect(mocks.end).toHaveBeenCalledOnce()
  expect(mocks.join).not.toHaveBeenCalled()
})

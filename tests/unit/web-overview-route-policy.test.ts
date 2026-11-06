import { beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  routes: new Map<
    string,
    { beforeLoad?: (input: unknown) => unknown; loader?: (input: unknown) => unknown }
  >(),
  getSession: vi.fn(),
  getAccountInvitedEvent: vi.fn(),
  getBrowserGuestEvent: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute:
    (path: string) => (options: typeof mocks.routes extends Map<string, infer T> ? T : never) => {
      mocks.routes.set(path, options)
      return { options }
    },
  redirect: (options: unknown) =>
    Object.assign(new Error('route redirect'), { isRedirect: true, options }),
  Link: () => null,
  useRouter: () => ({ invalidate: vi.fn() }),
}))
vi.mock('@/lib/auth.functions', () => ({ getSession: mocks.getSession }))
vi.mock('@/server/events/handlers/account-invited-event.handler', () => ({
  getAccountInvitedEvent: mocks.getAccountInvitedEvent,
  respondAsInvitedAccount: vi.fn(),
}))
vi.mock('@/server/events/handlers/browser-guest-invitation.handler', () => ({
  getBrowserGuestEvent: mocks.getBrowserGuestEvent,
  respondAsBrowserGuest: vi.fn(),
}))
vi.mock('@/components/invitations/guest-event-view', () => ({ GuestEventView: () => null }))

import '@/routes/_event/route'
import '@/routes/_event/events/$eventId/index'
import '@/routes/_protected/workspaces/$workspaceSlug/route'
import '@/routes/_protected/workspaces/$workspaceSlug/index'
import '@/routes/invited/events/$eventId/index'

function route(path: string) {
  const value = mocks.routes.get(path)
  if (!value) throw new Error(`Missing route ${path}`)
  return value
}

async function expectOverviewRedirect(action: () => unknown) {
  try {
    await action()
    throw new Error('Expected route redirect')
  } catch (error) {
    expect(error).toMatchObject({
      isRedirect: true,
      options: { to: '/workspaces' },
    })
  }
}

describe('overview-only web route policy', () => {
  beforeEach(() => {
    mocks.getSession.mockReset()
    mocks.getAccountInvitedEvent.mockReset()
    mocks.getBrowserGuestEvent.mockReset()
  })

  test('redirects signed-in direct planner URLs and the legacy workspace ancestry to overview', async () => {
    await expectOverviewRedirect(() => route('/_event').beforeLoad?.({}))
    await expectOverviewRedirect(() => route('/_event/events/$eventId/').beforeLoad?.({}))
    await expectOverviewRedirect(() =>
      route('/_protected/workspaces/$workspaceSlug').beforeLoad?.({})
    )
    await expectOverviewRedirect(() =>
      route('/_protected/workspaces/$workspaceSlug/').beforeLoad?.({})
    )
  })

  test('keeps signed-in invited guests on the event summary and RSVP route', async () => {
    mocks.getSession.mockResolvedValue({ ok: true, data: { user: { id: 'user-1' } } })
    mocks.getAccountInvitedEvent.mockResolvedValue({
      ok: true,
      data: { planningEventId: null, event: { id: 'event-1', title: 'Dinner' } },
    })

    await expect(
      route('/invited/events/$eventId/').loader?.({
        params: { eventId: '123e4567-e89b-42d3-a456-426614174000' },
      })
    ).resolves.toMatchObject({ account: true, event: { title: 'Dinner' }, loadError: null })
  })

  test('sends invited accounts with planning access to overview, preserving guest RSVP access', async () => {
    mocks.getSession.mockResolvedValue({ ok: true, data: { user: { id: 'user-1' } } })
    mocks.getAccountInvitedEvent.mockResolvedValue({
      ok: true,
      data: { planningEventId: 'main-event-1', event: { id: 'event-1', title: 'Dinner' } },
    })

    await expectOverviewRedirect(() =>
      route('/invited/events/$eventId/').loader?.({
        params: { eventId: '123e4567-e89b-42d3-a456-426614174000' },
      })
    )
  })

  test('keeps accountless guest event summaries and RSVP access available', async () => {
    mocks.getSession.mockResolvedValue({ ok: true, data: null })
    mocks.getBrowserGuestEvent.mockResolvedValue({
      ok: true,
      data: { event: { id: 'event-1', title: 'Dinner' } },
    })

    await expect(
      route('/invited/events/$eventId/').loader?.({
        params: { eventId: '123e4567-e89b-42d3-a456-426614174000' },
      })
    ).resolves.toMatchObject({ account: false, event: { title: 'Dinner' }, loadError: null })
  })

  test('preserves invalid, inaccessible, and failed invitation recovery states', async () => {
    const loader = route('/invited/events/$eventId/').loader
    await expect(loader?.({ params: { eventId: 'invalid' } })).resolves.toMatchObject({
      account: false,
      event: null,
      loadError: null,
    })
    expect(mocks.getSession).not.toHaveBeenCalled()

    mocks.getSession.mockResolvedValue({ ok: true, data: null })
    mocks.getBrowserGuestEvent.mockResolvedValue({
      ok: false,
      error: { userMessage: 'Unavailable' },
    })
    await expect(
      loader?.({ params: { eventId: '123e4567-e89b-42d3-a456-426614174000' } })
    ).resolves.toMatchObject({ event: null, loadError: 'Unavailable' })
  })
})

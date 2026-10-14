import { createMiddleware, executeMiddleware } from '@tanstack/start-client-core'
import { runWithStartContext } from '@tanstack/start-storage-context'
import { Effect } from 'effect'
import { beforeEach, expect, test, vi } from 'vitest'
import type { EventPermissions } from '@/lib/permissions'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getActiveMember: vi.fn(),
  getEventParticipant: vi.fn(),
  hasWorkspaceMembership: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mocks.getSession, getActiveMember: mocks.getActiveMember } },
}))
vi.mock('@tanstack/react-start/server', () => ({ getRequestHeaders: () => new Headers() }))
vi.mock('@/db', async () => {
  const { Layer } = await import('effect')
  return { PgClientLive: Layer.empty }
})
vi.mock('@/server/events/repos/event.repo.live', async () => {
  const { Layer } = await import('effect')
  const { EventRepo } = await import('@/server/events/repos/event.repo.contract')
  return {
    EventRepoLive: Layer.mock(EventRepo, {
      getEventParticipant: mocks.getEventParticipant,
      hasWorkspaceMembership: mocks.hasWorkspaceMembership,
    }),
  }
})

import { eventAuthorizationMiddleware } from '@/lib/event-authorization.middleware'

const eventId = '12345678-1234-4234-8234-123456789abc'
const userId = 'user-1'

async function execute(permissions: EventPermissions, data: unknown = { eventId }) {
  let handlerRuns = 0
  let handlerData: unknown
  const handler = createMiddleware({ type: 'function' }).server(async ({ next, data }) => {
    handlerRuns += 1
    handlerData = data
    return next()
  })
  const result = await runWithStartContext(
    {
      getRouter: async () => {
        throw new Error('Router is not used')
      },
      request: new Request('https://gatherory.test/server-function'),
      startOptions: {},
      contextAfterGlobalMiddlewares: {},
      executedRequestMiddlewares: new Set(),
      handlerType: 'serverFn',
    },
    () =>
      executeMiddleware([eventAuthorizationMiddleware(permissions), handler], 'server', {
        method: 'POST',
        data,
        context: {},
        headers: new Headers(),
        serverFnMeta: { id: 'event-authorization-test' },
      })
  )
  return { result, handlerRuns, handlerData }
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.getSession.mockResolvedValue({
    session: { id: 'session-1', activeOrganizationId: null },
    user: { id: userId },
  })
  mocks.getEventParticipant.mockReturnValue(
    Effect.succeed({ role: 'host', planningPermission: 'manage' })
  )
})

test.each([
  ['host', 'manage', { event: ['manage_participants'] }],
  ['collaborator', 'manage', { event: ['manage_participants'] }],
  ['collaborator', 'contribute', { media: ['upload'] }],
  ['collaborator', 'view_only', { event: ['read'] }],
  ['guest', 'view_only', { attendance: ['respond'] }],
] satisfies Array<[string, string, EventPermissions]>)(
  'allows %s with %s access without organization membership',
  async (role, planningPermission, permissions) => {
    mocks.getEventParticipant.mockReturnValue(Effect.succeed({ role, planningPermission }))
    const data = { eventId, email: 'invitee@example.com', role: 'guest' }
    const { result, handlerRuns, handlerData } = await execute(permissions, data)
    expect(result.error).toBeUndefined()
    expect(handlerRuns).toBe(1)
    expect(handlerData).toEqual(data)
    expect(result.context).toMatchObject({
      eventAccess: {
        eventId,
        role,
        planningPermission: planningPermission === 'view_only' ? 'viewOnly' : planningPermission,
      },
    })
    expect(mocks.getEventParticipant).toHaveBeenCalledWith({ eventId, userId })
    expect(mocks.getActiveMember).not.toHaveBeenCalled()
    expect(mocks.hasWorkspaceMembership).not.toHaveBeenCalled()
  }
)

test('unauthenticated requests never query participation or run the handler', async () => {
  mocks.getSession.mockResolvedValue(null)
  const { result, handlerRuns } = await execute({ event: ['read'] })
  expect(result.error).toBeDefined()
  expect(handlerRuns).toBe(0)
  expect(mocks.getEventParticipant).not.toHaveBeenCalled()
})

test.each([{}, { eventId: 'invalid' }, { eventId: null }, null])(
  'invalid event scope fails before any participant lookup: %j',
  async (data) => {
    const { result, handlerRuns } = await execute({ event: ['read'] }, data)
    expect(result.error).toBeInstanceOf(Error)
    expect(handlerRuns).toBe(0)
    expect(mocks.getEventParticipant).not.toHaveBeenCalled()
  }
)

test('a nonparticipant cannot authorize by spoofing identity, role, or permissions', async () => {
  mocks.getEventParticipant.mockReturnValue(Effect.succeed(undefined))
  const { result, handlerRuns } = await execute(
    { event: ['manage_participants'] },
    {
      eventId,
      userId: 'other-user',
      role: 'host',
      planningPermission: 'manage',
      permissions: { event: ['read'] },
    }
  )
  expect(result.error).toBeInstanceOf(Error)
  expect(handlerRuns).toBe(0)
  expect(mocks.getEventParticipant).toHaveBeenCalledWith({ eventId, userId })
})

test('guests cannot override the server-declared permission', async () => {
  mocks.getEventParticipant.mockReturnValue(
    Effect.succeed({ role: 'guest', planningPermission: 'manage' })
  )
  const { result, handlerRuns } = await execute(
    { event: ['manage_participants'] },
    {
      eventId,
      role: 'host',
      permissions: { event: ['read'] },
    }
  )
  expect(result.error).toBeInstanceOf(Error)
  expect(handlerRuns).toBe(0)
})

test('empty permission declarations fail closed', async () => {
  const { result, handlerRuns } = await execute({ event: [] })
  expect(result.error).toBeInstanceOf(Error)
  expect(handlerRuns).toBe(0)
  expect(mocks.getEventParticipant).not.toHaveBeenCalled()
})

test('database defects are sanitized and never run the handler', async () => {
  mocks.getEventParticipant.mockReturnValue(Effect.die(new Error('private-database-detail')))
  const { result, handlerRuns } = await execute({ event: ['read'] })
  expect(handlerRuns).toBe(0)
  expect(result.error).toBeInstanceOf(Error)
  if (result.error instanceof Error) {
    expect(result.error.message).not.toContain('private-database-detail')
    expect(result.error.stack).toBeUndefined()
    expect(result.error.cause).toBeUndefined()
  }
})

test('rechecks participation for each event and each request', async () => {
  expect((await execute({ event: ['read'] })).handlerRuns).toBe(1)
  mocks.getEventParticipant.mockReturnValue(Effect.succeed(undefined))
  expect((await execute({ event: ['read'] })).handlerRuns).toBe(0)
  const otherEventId = '87654321-1234-4234-8234-123456789abc'
  expect((await execute({ event: ['read'] }, { eventId: otherEventId })).handlerRuns).toBe(0)
  expect(mocks.getEventParticipant).toHaveBeenLastCalledWith({ eventId: otherEventId, userId })
  expect(mocks.getEventParticipant).toHaveBeenCalledTimes(3)
})

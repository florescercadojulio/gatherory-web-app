import { createMiddleware, executeMiddleware } from '@tanstack/start-client-core'
import { runWithStartContext } from '@tanstack/start-storage-context'
import { APIError } from 'better-auth/api'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getActiveMember: vi.fn(),
  hasPermission: vi.fn(),
  getRequestHeaders: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: authMocks.getSession,
      getActiveMember: authMocks.getActiveMember,
      hasPermission: authMocks.hasPermission,
    },
  },
}))

vi.mock('@tanstack/react-start/server', () => ({
  getRequestHeaders: authMocks.getRequestHeaders,
}))

import { orgAuthorizationMiddleware, requireActiveOrgMiddleware } from '@/lib/auth.middleware'
import type { OrgPermissions } from '@/lib/org-permissions'

const requestHeaders = new Headers({ cookie: 'session-cookie' })
const user = { id: 'user-1', name: 'Planner', email: 'planner@example.com' }
const membership = {
  id: 'membership-1',
  userId: user.id,
  organizationId: 'org-active',
  role: 'admin',
}
const serverPermissions: OrgPermissions = { organization: ['update'] }

function configureSession(activeOrganizationId: string | null = membership.organizationId) {
  authMocks.getSession.mockResolvedValue({
    session: { id: 'session-1', activeOrganizationId },
    user,
  })
}

function configureMembership(value: typeof membership | null = membership) {
  authMocks.getActiveMember.mockResolvedValue(value)
}

async function execute(
  middleware: Parameters<typeof executeMiddleware>[0][number],
  data: unknown = {}
) {
  let handlerRuns = 0
  const handler = createMiddleware({ type: 'function' }).server(async ({ next }) => {
    handlerRuns += 1
    return next()
  })
  const result = await runWithStartContext(
    {
      getRouter: async () => {
        throw new Error('Router is not used by function middleware tests')
      },
      request: new Request('https://gatherory.test/server-function'),
      startOptions: {},
      contextAfterGlobalMiddlewares: {},
      executedRequestMiddlewares: new Set(),
      handlerType: 'serverFn',
    },
    () =>
      executeMiddleware([middleware, handler], 'server', {
        method: 'GET',
        data,
        context: {},
        headers: requestHeaders,
        serverFnMeta: { id: 'organization-authorization-test' },
      })
  )
  return { result, handlerRuns }
}

beforeEach(() => {
  vi.clearAllMocks()
  authMocks.getRequestHeaders.mockReturnValue(requestHeaders)
  configureSession()
  configureMembership()
  authMocks.hasPermission.mockResolvedValue({ success: true })
})

describe('organization authorization middleware', () => {
  test('does not run the handler when the session is absent', async () => {
    authMocks.getSession.mockResolvedValue(null)

    const { handlerRuns, result } = await execute(orgAuthorizationMiddleware(serverPermissions))

    expect(handlerRuns).toBe(0)
    expect(result.error).toBeDefined()
    expect(authMocks.getActiveMember).not.toHaveBeenCalled()
    expect(authMocks.hasPermission).not.toHaveBeenCalled()
  })

  test('requireActiveOrgMiddleware does not run the handler without an active organization', async () => {
    configureSession(null)

    const { handlerRuns, result } = await execute(requireActiveOrgMiddleware)

    expect(handlerRuns).toBe(0)
    expect(result.error).toBeInstanceOf(Error)
    expect(authMocks.getActiveMember).not.toHaveBeenCalled()
  })

  test('sanitizes session-provider failures before they reach the client', async () => {
    authMocks.getSession.mockRejectedValue(new Error('private-session-driver-detail'))

    const { handlerRuns, result } = await execute(orgAuthorizationMiddleware(serverPermissions))

    expect(handlerRuns).toBe(0)
    expect(authMocks.getActiveMember).not.toHaveBeenCalled()
    expect(result.error).toBeInstanceOf(Error)
    if (result.error instanceof Error) {
      expect(result.error.message).not.toContain('private-session-driver-detail')
      expect(result.error.stack).toBeUndefined()
      expect(result.error.cause).toBeUndefined()
    }
  })

  test.each([
    ['no membership', null],
    ['a membership for another organization', { ...membership, organizationId: 'org-other' }],
    ['a membership for another user', { ...membership, userId: 'user-other' }],
  ] satisfies ReadonlyArray<readonly [string, typeof membership | null]>)(
    'does not run the handler with %s',
    async (_description, activeMember) => {
      configureMembership(activeMember)

      const { handlerRuns, result } = await execute(orgAuthorizationMiddleware(serverPermissions))

      expect(handlerRuns).toBe(0)
      expect(result.error).toBeInstanceOf(Error)
      expect(authMocks.hasPermission).not.toHaveBeenCalled()
    }
  )

  test('does not run the handler when the server-declared permission is denied', async () => {
    authMocks.hasPermission.mockResolvedValue({ success: false })

    const { handlerRuns, result } = await execute(orgAuthorizationMiddleware(serverPermissions), {
      permissions: { organization: ['delete'] },
      organizationId: 'org-attacker',
    })

    expect(handlerRuns).toBe(0)
    expect(result.error).toBeInstanceOf(Error)
    expect(authMocks.hasPermission).toHaveBeenCalledWith({
      headers: requestHeaders,
      body: { organizationId: membership.organizationId, permissions: serverPermissions },
    })
  })

  test('does not run the handler or expose provider details when the authorization provider fails', async () => {
    authMocks.getActiveMember.mockRejectedValue(
      new Error('provider-secret: internal database host and query')
    )

    const { handlerRuns, result } = await execute(orgAuthorizationMiddleware(serverPermissions))

    expect(handlerRuns).toBe(0)
    expect(result.error).toBeInstanceOf(Error)
    if (result.error instanceof Error) {
      expect(result.error.message).not.toContain('provider-secret')
      expect(result.error.message).not.toContain('internal database host')
      expect(result.error.message).toContain('Something went wrong.')
      expect(result.error.stack).toBeUndefined()
      expect(result.error.cause).toBeUndefined()
    }
  })

  test('fails closed if membership is revoked between the membership and permission checks', async () => {
    authMocks.hasPermission.mockRejectedValue(
      new APIError('UNAUTHORIZED', {
        code: 'USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION',
        message: 'private-provider-membership-detail',
      })
    )

    const { handlerRuns, result } = await execute(orgAuthorizationMiddleware(serverPermissions))

    expect(handlerRuns).toBe(0)
    expect(result.error).toBeInstanceOf(Error)
    if (result.error instanceof Error) {
      expect(result.error.message).toContain('You do not have access to this event.')
      expect(result.error.message).not.toContain('private-provider-membership-detail')
    }
  })

  test('runs the handler for a valid membership and permission, pinning the authorized organization', async () => {
    const { handlerRuns, result } = await execute(orgAuthorizationMiddleware(serverPermissions), {
      permissions: { organization: ['delete'] },
      organizationId: 'org-attacker',
    })

    expect(handlerRuns).toBe(1)
    expect(result.error).toBeUndefined()
    expect(result.context).toMatchObject({ membership })
    expect(authMocks.getActiveMember).toHaveBeenCalledWith({ headers: requestHeaders })
    expect(authMocks.hasPermission).toHaveBeenCalledWith({
      headers: requestHeaders,
      body: { organizationId: membership.organizationId, permissions: serverPermissions },
    })
  })
})

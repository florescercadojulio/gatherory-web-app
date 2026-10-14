import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { Effect } from 'effect'

import { auth } from '@/lib/auth'
import { ensureActiveOrg, ensureOrgPermission } from '@/server/auth/authorization'
import type { OrgPermissions } from '@/lib/org-permissions'
import { runAuthorizationCheck } from '@/server/auth/authorization-boundary'
import { OrganizationAuthorizationConLive } from '@/server/auth/connectors/organization-authorization.con.live'
import { tryServerOperation } from '@/server/effect-utils'

/**
 * Establishes identity for a server function. Event membership and capability
 * checks belong to event-scoped authorization middleware, not this middleware.
 */
export const requireSessionMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const headers = getRequestHeaders()
    const session = await runAuthorizationCheck(
      tryServerOperation(
        {
          category: 'system',
          code: 'SESSION_LOOKUP_FAILED',
          userMessageKey: 'serverErrors.SESSION_LOOKUP_FAILED',
        },
        () => auth.api.getSession({ headers })
      ),
      { headers, operation: 'authorization.session' }
    )

    if (!session) {
      throw redirect({
        to: '/auth/$path',
        params: { path: 'sign-in' },
      })
    }

    return next({
      context: {
        session: session.session,
        user: session.user,
      },
    })
  }
)

/** Requires real membership, not merely an active organization in the session. */
export const requireActiveOrgMiddleware = createMiddleware({ type: 'function' })
  .middleware([requireSessionMiddleware])
  .server(async ({ context, next }) => {
    const headers = getRequestHeaders()
    const membership = await runAuthorizationCheck(
      ensureActiveOrg({
        userId: context.user.id,
        activeOrganizationId: context.session.activeOrganizationId,
        headers,
      }).pipe(Effect.provide(OrganizationAuthorizationConLive)),
      { headers, operation: 'authorization.active_organization' }
    )
    return next({ context: { membership } })
  })

/**
 * Guards organization administration before the handler runs. Event guests and
 * collaborators must use event-scoped checks instead of this membership gate.
 */
export function orgAuthorizationMiddleware(permissions: OrgPermissions) {
  return createMiddleware({ type: 'function' })
    .middleware([requireActiveOrgMiddleware])
    .server(async ({ context, next }) => {
      const headers = getRequestHeaders()
      await runAuthorizationCheck(
        ensureOrgPermission(permissions, {
          organizationId: context.membership.organizationId,
          headers,
        }).pipe(Effect.provide(OrganizationAuthorizationConLive)),
        { headers, operation: 'authorization.organization_permission' }
      )
      return next()
    })
}

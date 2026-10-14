import { Effect } from 'effect'
import { ForbiddenError, InvalidInputError } from '@/lib/domain-errors'
import type { OrgPermissions } from '@/lib/org-permissions'
import { OrganizationAuthorizationCon } from '@/server/auth/connectors/organization-authorization.con'

/** Server-only Effect helpers, not separately callable RPC endpoints. */
export function ensureActiveOrg(input: {
  userId: string
  activeOrganizationId?: string | null
  headers: Headers
}) {
  return Effect.gen(function* () {
    if (!input.activeOrganizationId) {
      return yield* Effect.fail(
        new InvalidInputError({
          category: 'validation',
          code: 'ACTIVE_WORKSPACE_REQUIRED',
          userMessageKey: 'serverErrors.ACTIVE_WORKSPACE_REQUIRED',
        })
      )
    }
    const authorization = yield* OrganizationAuthorizationCon
    const membership = yield* authorization.activeMember(input.headers)
    if (
      !membership ||
      membership.userId !== input.userId ||
      membership.organizationId !== input.activeOrganizationId
    ) {
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'WORKSPACE_MEMBERSHIP_REQUIRED',
          userMessageKey: 'serverErrors.WORKSPACE_MEMBERSHIP_REQUIRED',
        })
      )
    }
    return membership
  })
}

/**
 * Permissions are declared by server code, never read from the request body.
 * Better Auth checks current membership as well as the requested permissions.
 */
export function ensureOrgPermission(
  permissions: OrgPermissions,
  input: { organizationId: string; headers: Headers }
) {
  return Effect.gen(function* () {
    if (!input.organizationId || !Object.values(permissions).some((actions) => actions?.length)) {
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'ORGANIZATION_PERMISSION_REQUIRED',
          userMessageKey: 'serverErrors.AUTHORIZATION',
        })
      )
    }
    const authorization = yield* OrganizationAuthorizationCon
    const granted = yield* authorization.hasPermission({ ...input, permissions })
    if (!granted) {
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'ORGANIZATION_PERMISSION_REQUIRED',
          userMessageKey: 'serverErrors.AUTHORIZATION',
        })
      )
    }
  })
}

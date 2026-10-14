import { APIError } from 'better-auth/api'
import { Effect, Layer } from 'effect'
import { auth } from '@/lib/auth'
import { ForbiddenError, isDomainError, ServerOperationError } from '@/lib/domain-errors'
import { OrganizationAuthorizationCon } from './organization-authorization.con'

function authorizationFailure(cause: unknown) {
  if (isDomainError(cause)) return cause
  if (
    cause instanceof APIError &&
    (cause.statusCode === 401 ||
      cause.statusCode === 403 ||
      cause.body?.code === 'MEMBER_NOT_FOUND' ||
      cause.body?.code === 'NO_ACTIVE_ORGANIZATION')
  ) {
    return new ForbiddenError({
      category: 'authorization',
      code: 'WORKSPACE_MEMBERSHIP_REQUIRED',
      userMessageKey: 'serverErrors.WORKSPACE_MEMBERSHIP_REQUIRED',
      cause,
    })
  }
  return new ServerOperationError({
    category: 'system',
    code: 'ORGANIZATION_AUTHORIZATION_FAILED',
    userMessageKey: 'serverErrors.SYSTEM',
    cause,
  })
}

export const OrganizationAuthorizationConLive = Layer.succeed(OrganizationAuthorizationCon, {
  activeMember: (headers) =>
    Effect.tryPromise({
      try: () => auth.api.getActiveMember({ headers }),
      catch: authorizationFailure,
    }),
  hasPermission: ({ headers, organizationId, permissions }) =>
    Effect.tryPromise({
      // Better Auth rechecks current membership and roles for this exact org.
      try: async () =>
        (await auth.api.hasPermission({ headers, body: { organizationId, permissions } }))
          .success === true,
      catch: authorizationFailure,
    }),
})

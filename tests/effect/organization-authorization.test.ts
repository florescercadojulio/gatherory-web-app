import { expect, it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import { ServerOperationError } from '@/lib/domain-errors'
import { ensureActiveOrg, ensureOrgPermission } from '@/server/auth/authorization'
import {
  OrganizationAuthorizationCon,
  type OrganizationMembership,
} from '@/server/auth/connectors/organization-authorization.con'

const membership: OrganizationMembership = {
  id: 'membership-1',
  userId: 'user-1',
  organizationId: 'org-1',
  role: 'admin',
}

it.effect('requires an active organization before querying membership', () =>
  Effect.gen(function* () {
    const failure = yield* Effect.flip(
      ensureActiveOrg({ userId: 'user-1', headers: new Headers() })
    )
    expect(failure.code).toBe('ACTIVE_WORKSPACE_REQUIRED')
  }).pipe(Effect.provide(Layer.mock(OrganizationAuthorizationCon, {})))
)

for (const [label, actual] of [
  ['no membership', null],
  ['another organization', { ...membership, organizationId: 'org-2' }],
  ['another user', { ...membership, userId: 'user-2' }],
] as const) {
  it.effect(`rejects ${label} rather than trusting the session organization`, () =>
    Effect.gen(function* () {
      const failure = yield* Effect.flip(
        ensureActiveOrg({
          userId: 'user-1',
          activeOrganizationId: 'org-1',
          headers: new Headers(),
        })
      )
      expect(failure.code).toBe('WORKSPACE_MEMBERSHIP_REQUIRED')
    }).pipe(
      Effect.provide(
        Layer.mock(OrganizationAuthorizationCon, { activeMember: () => Effect.succeed(actual) })
      )
    )
  )
}

it.effect('returns the verified membership using the current request headers', () => {
  const headers = new Headers({ cookie: 'test-session' })
  return Effect.gen(function* () {
    const actual = yield* ensureActiveOrg({
      userId: 'user-1',
      activeOrganizationId: 'org-1',
      headers,
    })
    expect(actual).toEqual(membership)
  }).pipe(
    Effect.provide(
      Layer.mock(OrganizationAuthorizationCon, {
        activeMember: (receivedHeaders) =>
          Effect.sync(() => {
            expect(receivedHeaders).toBe(headers)
            return membership
          }),
      })
    )
  )
})

for (const granted of [true, false]) {
  it.effect(`organization permission ${granted ? 'allows' : 'denies'} the declared action`, () => {
    const headers = new Headers()
    const program = ensureOrgPermission(
      { organization: ['update'] },
      { headers, organizationId: 'org-1' }
    ).pipe(
      Effect.provide(
        Layer.mock(OrganizationAuthorizationCon, {
          hasPermission: (input) =>
            Effect.sync(() => {
              expect(input).toEqual({
                headers,
                organizationId: 'org-1',
                permissions: { organization: ['update'] },
              })
              return granted
            }),
        })
      )
    )
    return Effect.gen(function* () {
      if (granted) {
        expect(yield* program).toBeUndefined()
      } else {
        const failure = yield* Effect.flip(program)
        expect(failure.code).toBe('ORGANIZATION_PERMISSION_REQUIRED')
      }
    })
  })
}

it.effect('an empty permission declaration fails closed without calling Better Auth', () =>
  Effect.gen(function* () {
    const failure = yield* Effect.flip(
      ensureOrgPermission({ organization: [] }, { headers: new Headers(), organizationId: 'org-1' })
    )
    expect(failure.code).toBe('ORGANIZATION_PERMISSION_REQUIRED')
  }).pipe(Effect.provide(Layer.mock(OrganizationAuthorizationCon, {})))
)

it.effect('provider failures remain failures, never authorization grants', () => {
  const failure = new ServerOperationError({
    category: 'system',
    code: 'ORGANIZATION_AUTHORIZATION_FAILED',
    userMessageKey: 'serverErrors.SYSTEM',
  })
  return Effect.gen(function* () {
    expect(
      yield* Effect.flip(
        ensureOrgPermission(
          { organization: ['update'] },
          { headers: new Headers(), organizationId: 'org-1' }
        )
      )
    ).toBe(failure)
  }).pipe(
    Effect.provide(
      Layer.mock(OrganizationAuthorizationCon, { hasPermission: () => Effect.fail(failure) })
    )
  )
})

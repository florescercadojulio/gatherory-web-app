import { expect, it } from '@effect/vitest'
import { Cause, Effect, Exit, Layer, Option } from 'effect'
import { AppleAuthCon } from '@/server/auth/connectors/apple-auth.con'
import { AppleTokenRepo } from '@/server/auth/repos/apple-token.repo'
import { AppleTokenServiceLive } from '@/server/auth/services/apple-token.service.live'
import { saveAppleTokenWorkflow } from '@/server/auth/workflows/save-apple-token.workflow'
import { PersistenceError } from '@/lib/domain-errors'

const tokenSet = {
  subject: 'verified-apple-subject',
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 3600,
}

it.effect(
  'Apple token ServiceLive resolves connector and repository tags and saves verified credentials',
  () => {
    const calls: string[] = []
    const connector = Layer.succeed(AppleAuthCon, {
      exchangeCode: (code) =>
        Effect.sync(() => {
          calls.push(`exchange:${code}`)
          return tokenSet
        }),
      revoke: (token, type) =>
        Effect.sync(() => {
          calls.push(`revoke:${token}:${type}`)
        }),
    })
    const repo = Layer.succeed(AppleTokenRepo, {
      findLinkedAccount: ({ userId, subject }) =>
        Effect.sync(() => {
          expect(userId).toBe('signed-in-user')
          expect(subject).toBe(tokenSet.subject)
          return 'linked-account'
        }),
      saveTokens: (input) =>
        Effect.sync(() => {
          expect(input).toEqual({
            accountId: 'linked-account',
            userId: 'signed-in-user',
            ...tokenSet,
          })
          calls.push('save')
        }),
    })
    const serviceLayer = AppleTokenServiceLive.pipe(Layer.provide(Layer.mergeAll(connector, repo)))

    return saveAppleTokenWorkflow({ authorizationCode: 'one-time-code' }, 'signed-in-user').pipe(
      Effect.provide(serviceLayer),
      Effect.tap((result) =>
        Effect.sync(() => {
          expect(result).toEqual({ saved: true })
          expect(calls).toEqual(['exchange:one-time-code', 'save'])
        })
      )
    )
  }
)

it.effect(
  'Apple token ServiceLive revokes unlinked credentials and retains the typed authorization failure',
  () => {
    const calls: string[] = []
    const connector = Layer.succeed(AppleAuthCon, {
      exchangeCode: () => Effect.succeed(tokenSet),
      revoke: (token, type) =>
        Effect.sync(() => {
          calls.push(`${token}:${type}`)
        }),
    })
    const repo = Layer.succeed(AppleTokenRepo, {
      findLinkedAccount: () => Effect.succeed(null),
      saveTokens: () => Effect.die(new Error('Must not save an unlinked identity')),
    })
    const serviceLayer = AppleTokenServiceLive.pipe(Layer.provide(Layer.mergeAll(connector, repo)))

    return Effect.exit(
      saveAppleTokenWorkflow({ authorizationCode: 'one-time-code' }, 'signed-in-user').pipe(
        Effect.provide(serviceLayer)
      )
    ).pipe(
      Effect.tap((exit) =>
        Effect.sync(() => {
          expect(calls).toEqual(['refresh-token:refresh_token'])
          expect(Exit.isFailure(exit)).toBe(true)
          if (Exit.isFailure(exit)) {
            const error = Cause.findErrorOption(exit.cause)
            expect(Option.isSome(error)).toBe(true)
            if (Option.isSome(error)) {
              expect(error.value._tag).toBe('ForbiddenError')
              expect(error.value.code).toBe('APPLE_ACCOUNT_MISMATCH')
              expect(error.value.category).toBe('authorization')
            }
          }
        })
      )
    )
  }
)

it.effect('Apple token ServiceLive revokes exchanged credentials when persistence fails', () => {
  const calls: string[] = []
  const connector = Layer.succeed(AppleAuthCon, {
    exchangeCode: () => Effect.succeed(tokenSet),
    revoke: (token, type) =>
      Effect.sync(() => {
        calls.push(`${token}:${type}`)
      }),
  })
  const repo = Layer.succeed(AppleTokenRepo, {
    findLinkedAccount: () => Effect.succeed('linked-account'),
    saveTokens: () =>
      Effect.fail(
        new PersistenceError({
          category: 'system',
          code: 'APPLE_TOKEN_PERSISTENCE_FAILED',
          userMessageKey: 'serverErrors.SYSTEM',
        })
      ),
  })
  const serviceLayer = AppleTokenServiceLive.pipe(Layer.provide(Layer.mergeAll(connector, repo)))
  return Effect.exit(
    saveAppleTokenWorkflow({ authorizationCode: 'one-time-code' }, 'signed-in-user').pipe(
      Effect.provide(serviceLayer)
    )
  ).pipe(
    Effect.tap((exit) =>
      Effect.sync(() => {
        expect(calls).toEqual(['refresh-token:refresh_token'])
        expect(Exit.isFailure(exit)).toBe(true)
        if (Exit.isFailure(exit)) {
          const error = Cause.findErrorOption(exit.cause)
          expect(Option.isSome(error)).toBe(true)
          if (Option.isSome(error)) {
            expect(error.value._tag).toBe('PersistenceError')
            expect(error.value.code).toBe('APPLE_TOKEN_PERSISTENCE_FAILED')
          }
        }
      })
    )
  )
})

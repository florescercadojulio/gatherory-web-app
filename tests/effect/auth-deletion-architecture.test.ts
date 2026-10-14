import { expect, it } from '@effect/vitest'
import { Cause, Effect, Exit, Layer, Option } from 'effect'
import {
  AccountDeletionRepo,
  type DeleteAccountMediaObject,
} from '@/server/auth/repos/account-deletion.repo'
import { AccountDeletionStorageCon } from '@/server/auth/connectors/account-deletion-storage.con'
import { AccountDeletionService } from '@/server/auth/services/account-deletion.service'
import { AccountDeletionServiceLive } from '@/server/auth/services/account-deletion.service.live'
import { AppleTokenRevocationCon } from '@/server/auth/connectors/apple-token-revocation.con'
import { AppleAccountDeletionRepo } from '@/server/auth/repos/apple-account-deletion.repo'
import { AppleAccountDeletionServiceLive } from '@/server/auth/services/apple-account-deletion.service.live'
import { prepareAccountDeletionWorkflow } from '@/server/auth/workflows/prepare-account-deletion.workflow'
import { revokeAppleAccountsBeforeDeletionWorkflow } from '@/server/auth/workflows/revoke-apple-accounts-before-deletion.workflow'

const identityToken = (audience: string) =>
  `e30.${Buffer.from(JSON.stringify({ aud: audience })).toString('base64url')}.signature`

it.effect('account deletion workflow preserves the original persistence failure', () => {
  const failure = new Error('storage failure')
  const prepare = () => Effect.fail(failure)
  return Effect.exit(
    prepareAccountDeletionWorkflow('user-1').pipe(
      Effect.provide(Layer.succeed(AccountDeletionService, { prepare }))
    )
  ).pipe(
    Effect.tap((exit) =>
      Effect.sync(() => {
        expect(Exit.isFailure(exit)).toBe(true)
        if (Exit.isFailure(exit)) {
          const error = Cause.findErrorOption(exit.cause)
          expect(Option.isSome(error) && error.value).toBe(failure)
        }
      })
    )
  )
})

it.effect('account deletion service passes storage removal into the repository', () => {
  const calls: string[] = []
  const deleteObject: DeleteAccountMediaObject = (input) =>
    Promise.resolve().then(() => void calls.push(`${input.bucket}:${input.key}`))
  const prepare = (_userId: string, remove: DeleteAccountMediaObject) =>
    Effect.tryPromise({
      try: () => remove({ bucket: 'private', key: 'asset' }),
      catch: (cause) => cause,
    })
  const dependencies = Layer.mergeAll(
    Layer.succeed(AccountDeletionRepo, { prepare }),
    Layer.succeed(AccountDeletionStorageCon, { deleteObject })
  )
  const service = AccountDeletionServiceLive.pipe(Layer.provide(dependencies))
  return prepareAccountDeletionWorkflow('user-1').pipe(
    Effect.provide(service),
    Effect.tap(() => Effect.sync(() => expect(calls).toEqual(['private:asset'])))
  )
})

it.effect('Apple revocations run sequentially and preserve the first provider failure', () => {
  const failure = new Error('Apple unavailable')
  const calls: string[] = []
  const repo = Layer.succeed(AppleAccountDeletionRepo, {
    findAccounts: () =>
      Effect.succeed([
        { idToken: identityToken('allowed-client'), refreshToken: 'refresh-1', accessToken: null },
        { idToken: identityToken('allowed-client'), refreshToken: 'refresh-2', accessToken: null },
      ]),
  })
  const apple = Layer.succeed(AppleTokenRevocationCon, {
    decodeStoredToken: (value) => Effect.succeed(value),
    allowedClientIds: () => ['allowed-client'],
    revoke: (_clientId, token) =>
      Effect.sync(() => calls.push(`start:${token}`)).pipe(
        Effect.andThen(Effect.sync(() => calls.push(`end:${token}`))),
        Effect.andThen(token === 'refresh-1' ? Effect.fail(failure) : Effect.void)
      ),
  })
  const service = AppleAccountDeletionServiceLive.pipe(Layer.provide(Layer.mergeAll(repo, apple)))
  return Effect.exit(
    revokeAppleAccountsBeforeDeletionWorkflow('user-1').pipe(Effect.provide(service))
  ).pipe(
    Effect.tap((exit) =>
      Effect.sync(() => {
        expect(Exit.isFailure(exit)).toBe(true)
        if (Exit.isFailure(exit)) {
          const error = Cause.findErrorOption(exit.cause)
          expect(Option.isSome(error) && error.value).toBe(failure)
        }
        expect(calls).toEqual(['start:refresh-1', 'end:refresh-1'])
      })
    )
  )
})

it.effect('Apple deletion skips identity-only and unapproved accounts', () => {
  const calls: string[] = []
  const repo = Layer.succeed(AppleAccountDeletionRepo, {
    findAccounts: () =>
      Effect.succeed([
        { idToken: identityToken('allowed-client'), refreshToken: null, accessToken: null },
        { idToken: identityToken('other-client'), refreshToken: 'refresh', accessToken: null },
      ]),
  })
  const apple = Layer.succeed(AppleTokenRevocationCon, {
    decodeStoredToken: (value) => Effect.succeed(value),
    allowedClientIds: () => ['allowed-client'],
    revoke: (_clientId, token) => Effect.sync(() => calls.push(token)),
  })
  const service = AppleAccountDeletionServiceLive.pipe(Layer.provide(Layer.mergeAll(repo, apple)))
  return revokeAppleAccountsBeforeDeletionWorkflow('user-1').pipe(
    Effect.provide(service),
    Effect.tap(() => Effect.sync(() => expect(calls).toEqual([])))
  )
})

it.effect(
  'Apple deletion uses decoded refresh tokens first and falls back to access tokens',
  () => {
    const calls: Array<{ token: string; type: string; clientId: string }> = []
    const repo = Layer.mock(AppleAccountDeletionRepo, {
      findAccounts: () =>
        Effect.succeed([
          {
            idToken: 'encrypted-id',
            refreshToken: 'encrypted-refresh',
            accessToken: 'unused-access',
          },
          {
            idToken: identityToken('allowed-client'),
            refreshToken: null,
            accessToken: 'access-token',
          },
          { idToken: 'invalid-legacy-token', refreshToken: 'skip-this-token', accessToken: null },
        ]),
    })
    const apple = Layer.mock(AppleTokenRevocationCon, {
      decodeStoredToken: (value) =>
        Effect.succeed(
          value === 'encrypted-id'
            ? identityToken('allowed-client')
            : value === 'encrypted-refresh'
              ? 'refresh-token'
              : value
        ),
      allowedClientIds: () => ['allowed-client'],
      revoke: (clientId, token, type) =>
        Effect.sync(() => {
          calls.push({ clientId, token, type })
        }),
    })
    return Effect.gen(function* () {
      yield* revokeAppleAccountsBeforeDeletionWorkflow('user-1')
      expect(calls).toEqual([
        { clientId: 'allowed-client', token: 'refresh-token', type: 'refresh_token' },
        { clientId: 'allowed-client', token: 'access-token', type: 'access_token' },
      ])
    }).pipe(
      Effect.provide(AppleAccountDeletionServiceLive),
      Effect.provide(repo),
      Effect.provide(apple)
    )
  }
)

it.effect('token decoding failure stops deletion without calling the revocation provider', () => {
  const failure = new Error('could not decrypt token')
  return Effect.gen(function* () {
    expect(yield* Effect.flip(revokeAppleAccountsBeforeDeletionWorkflow('user-1'))).toBe(failure)
  }).pipe(
    Effect.provide(AppleAccountDeletionServiceLive),
    Effect.provide(
      Layer.mock(AppleAccountDeletionRepo, {
        findAccounts: () =>
          Effect.succeed([
            {
              idToken: identityToken('allowed-client'),
              refreshToken: 'encrypted',
              accessToken: null,
            },
          ]),
      })
    ),
    Effect.provide(
      Layer.mock(AppleTokenRevocationCon, {
        decodeStoredToken: () => Effect.fail(failure),
        allowedClientIds: () => {
          throw new Error('Must stop before client selection')
        },
      })
    )
  )
})

import { Effect, Layer } from 'effect'
import { ForbiddenError } from '@/lib/domain-errors'
import { AppleAuthCon } from '../connectors/apple-auth.con'
import { AppleTokenRepo } from '../repos/apple-token.repo'
import { AppleTokenService } from './apple-token.service'

export const AppleTokenServiceLive = Layer.effect(
  AppleTokenService,
  Effect.gen(function* () {
    const apple = yield* AppleAuthCon
    const repo = yield* AppleTokenRepo
    return {
      saveAuthorizationCode: (input, userId, options) =>
        Effect.gen(function* () {
          const exchanged = yield* apple.exchangeCode(input.authorizationCode, options)
          const accountId = yield* repo.findLinkedAccount({ userId, subject: exchanged.subject })
          if (!accountId) {
            yield* apple.revoke(exchanged.refreshToken, 'refresh_token', options)
            return yield* Effect.fail(
              new ForbiddenError({
                category: 'authorization',
                code: 'APPLE_ACCOUNT_MISMATCH',
                userMessageKey: 'serverErrors.AUTHORIZATION',
              })
            )
          }
          yield* repo
            .saveTokens({ accountId, userId, ...exchanged })
            .pipe(
              Effect.tapError(() => apple.revoke(exchanged.refreshToken, 'refresh_token', options))
            )
          return { saved: true as const }
        }),
    }
  })
)

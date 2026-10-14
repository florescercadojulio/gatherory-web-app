import { Effect, Layer } from 'effect'
import { ConfigurationError, isDomainError, ExternalServiceError } from '@/lib/domain-errors'
import { env } from '@/env'
import { exchangeAppleAuthorizationCode, revokeAppleToken } from './apple-provider'
import { AppleAuthCon } from './apple-auth.con'

function providerOperation<A>(operation: () => Promise<A>) {
  return Effect.tryPromise({
    try: operation,
    catch: (cause) =>
      isDomainError(cause)
        ? cause
        : new ExternalServiceError({
            category: 'external',
            code: 'APPLE_PROVIDER_OPERATION_FAILED',
            userMessageKey: 'serverErrors.EXTERNAL',
            cause,
          }),
  })
}

export const AppleAuthConLive = Layer.succeed(AppleAuthCon, {
  exchangeCode: (code, options) => {
    const clientId = env.APPLE_APP_BUNDLE_IDENTIFIER
    if (!clientId)
      return Effect.fail(
        new ConfigurationError({
          category: 'system',
          code: 'APPLE_NATIVE_CLIENT_ID_MISSING',
          userMessageKey: 'serverErrors.SYSTEM',
        })
      )
    return providerOperation(() => exchangeAppleAuthorizationCode(code, clientId, options))
  },
  revoke: (token, type, options) => {
    const clientId = env.APPLE_APP_BUNDLE_IDENTIFIER
    if (!clientId)
      return Effect.fail(
        new ConfigurationError({
          category: 'system',
          code: 'APPLE_NATIVE_CLIENT_ID_MISSING',
          userMessageKey: 'serverErrors.SYSTEM',
        })
      )
    return providerOperation(() => revokeAppleToken(token, clientId, type, options))
  },
})

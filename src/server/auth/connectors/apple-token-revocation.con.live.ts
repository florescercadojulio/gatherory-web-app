import { Effect, Layer } from 'effect'
import { symmetricDecrypt } from 'better-auth/crypto'
import { env } from '@/env'
import { revokeAppleToken } from './apple-provider'
import { AppleTokenRevocationCon } from './apple-token-revocation.con'

export const AppleTokenRevocationConLive = Layer.succeed(AppleTokenRevocationCon, {
  decodeStoredToken: (value) => {
    if (!value) return Effect.succeed(null)
    const encrypted =
      value.startsWith('$ba$') || (value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value))
    return encrypted
      ? Effect.tryPromise({
          try: () => symmetricDecrypt({ key: env.BETTER_AUTH_SECRET, data: value }),
          catch: (cause) => cause,
        })
      : Effect.succeed(value)
  },
  allowedClientIds: () =>
    [env.APPLE_APP_BUNDLE_IDENTIFIER, env.APPLE_CLIENT_ID].filter(
      (value): value is string => !!value
    ),
  revoke: (clientId, token, type, options) =>
    Effect.tryPromise({
      try: () => revokeAppleToken(token, clientId, type, options),
      // Keep the legacy callback's provider rejection instance intact.
      catch: (cause) => cause,
    }),
})

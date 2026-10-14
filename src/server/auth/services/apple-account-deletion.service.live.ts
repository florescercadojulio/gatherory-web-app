import { decodeJwt } from 'jose'
import { Effect, Layer } from 'effect'
import { AppleTokenRevocationCon } from '../connectors/apple-token-revocation.con'
import { AppleAccountDeletionRepo } from '../repos/apple-account-deletion.repo'
import { AppleAccountDeletionService } from './apple-account-deletion.service'

export const AppleAccountDeletionServiceLive = Layer.effect(
  AppleAccountDeletionService,
  Effect.gen(function* () {
    const repo = yield* AppleAccountDeletionRepo
    const apple = yield* AppleTokenRevocationCon
    return {
      revokeBeforeDeletion: (userId, options) =>
        Effect.gen(function* () {
          const accounts = yield* repo.findAccounts(userId)
          for (const item of accounts) {
            const refreshToken = yield* apple.decodeStoredToken(item.refreshToken)
            const accessToken = yield* apple.decodeStoredToken(item.accessToken)
            if (!refreshToken && !accessToken) continue
            const idToken = yield* apple.decodeStoredToken(item.idToken)
            const audiences = apple.allowedClientIds()
            // The old identity token is used only to select an allowlisted client.
            let clientId: string | undefined
            try {
              clientId = idToken ? (decodeJwt(idToken).aud as string | undefined) : undefined
            } catch {
              // Legacy records with an unreadable ID token do not block deletion.
            }
            if (!clientId || !audiences.includes(clientId)) continue
            yield* apple.revoke(
              clientId,
              refreshToken ?? accessToken!,
              refreshToken ? 'refresh_token' : 'access_token',
              options
            )
          }
        }),
    }
  })
)

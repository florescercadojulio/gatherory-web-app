import { symmetricDecrypt } from 'better-auth/crypto'
import { and, eq } from 'drizzle-orm'
import { decodeJwt, type jwtVerify } from 'jose'
import { Effect, Layer } from 'effect'

import { db, PgClientLive } from '@/db'
import { account } from '@/db/schema/auth.schema'
import { env } from '@/env'
import { AppleAuthConLive } from './connectors/apple-auth.con.live'
import {
  exchangeAppleAuthorizationCode as exchangeProviderCode,
  generateAppleClientSecret,
  revokeAppleToken as revokeProviderToken,
} from './connectors/apple-provider'
import { AppleTokenRepoLive } from './repos/apple-token.repo.live'
import { AppleTokenServiceLive } from './services/apple-token.service.live'
import { saveAppleTokenWorkflow } from './workflows/save-apple-token.workflow'

export { generateAppleClientSecret }

type AppleTokenOptions = {
  fetcher?: typeof fetch
  keys?: Parameters<typeof jwtVerify>[1]
}

/** Promise compatibility export used by Better Auth integrations and tests. */
export function exchangeAppleAuthorizationCode(
  code: string,
  clientId: string,
  options: AppleTokenOptions = {}
) {
  return exchangeProviderCode(code, clientId, options)
}

/** Promise compatibility export; injection remains available to existing tests. */
export function revokeAppleToken(
  token: string,
  clientId: string,
  type: 'refresh_token' | 'access_token',
  fetcher: typeof fetch = fetch
) {
  return revokeProviderToken(token, clientId, type, { fetcher })
}

/**
 * Promise compatibility wrapper over the Effect service. Provider injection is
 * translated into an injected connector layer; persistence remains the same
 * production repository used by the route.
 */
export async function saveNativeAppleRevocationToken(
  userId: string,
  code: string,
  options: AppleTokenOptions = {}
) {
  const serviceLayer = AppleTokenServiceLive.pipe(
    Layer.provide(
      Layer.mergeAll(AppleAuthConLive, AppleTokenRepoLive).pipe(Layer.provide(PgClientLive))
    )
  )
  await Effect.runPromise(
    saveAppleTokenWorkflow({ authorizationCode: code }, userId, options).pipe(
      Effect.provide(serviceLayer)
    )
  )
}

const encryptedToken = (value: string) =>
  value.startsWith('$ba$') || (value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value))

async function decodeStoredToken(value: string | null) {
  if (!value) return null
  // Better Auth reads old plaintext OAuth records after encryption is enabled.
  return encryptedToken(value)
    ? symmetricDecrypt({ key: env.BETTER_AUTH_SECRET, data: value })
    : value
}

/** Called before Gatherory data is removed, so Apple failures can be retried. */
export async function revokeAppleAccountsBeforeDeletion(
  userId: string,
  options: { fetcher?: typeof fetch } = {}
) {
  const accounts = await db
    .select({
      idToken: account.idToken,
      refreshToken: account.refreshToken,
      accessToken: account.accessToken,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'apple')))
  for (const item of accounts) {
    const refreshToken = await decodeStoredToken(item.refreshToken)
    const accessToken = await decodeStoredToken(item.accessToken)
    if (!refreshToken && !accessToken) continue // Older identity-token-only accounts; deletion must still succeed.
    const idToken = await decodeStoredToken(item.idToken)
    const audiences = [env.APPLE_APP_BUNDLE_IDENTIFIER, env.APPLE_CLIENT_ID].filter(
      (value): value is string => !!value
    )
    // The ID token can be years old when the account is deleted. It was
    // verified at sign-in; read only its audience to select an allowed client.
    // An absent/invalid audience must not permanently block account deletion.
    let clientId: string | undefined
    try {
      clientId = idToken ? (decodeJwt(idToken).aud as string | undefined) : undefined
    } catch {
      /* legacy record */
    }
    if (!clientId || !audiences.includes(clientId)) continue
    await revokeProviderToken(
      refreshToken ?? accessToken!,
      clientId,
      refreshToken ? 'refresh_token' : 'access_token',
      options
    )
  }
}

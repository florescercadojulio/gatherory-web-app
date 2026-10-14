import { type jwtVerify } from 'jose'
import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import {
  exchangeAppleAuthorizationCode as exchangeProviderCode,
  generateAppleClientSecret,
  revokeAppleToken as revokeProviderToken,
} from '../connectors/apple-provider'
import { revokeAppleAccountsBeforeDeletionWorkflow } from '../workflows/apple-account-deletion.workflows.live'

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

export async function saveNativeAppleRevocationToken(
  userId: string,
  code: string,
  options: AppleTokenOptions = {}
) {
  const { saveAppleTokenWorkflow } = await import('../workflows/apple-token.workflows.live')
  await Effect.runPromise(
    saveAppleTokenWorkflow({ authorizationCode: code }, userId, options).pipe(
      Effect.provide(PgClientLive)
    )
  )
}

/** Called before Gatherory data is removed, so Apple failures can be retried. */
export async function revokeAppleAccountsBeforeDeletion(
  userId: string,
  options: { fetcher?: typeof fetch } = {}
) {
  await Effect.runPromise(
    revokeAppleAccountsBeforeDeletionWorkflow(userId, options).pipe(Effect.provide(PgClientLive))
  )
}

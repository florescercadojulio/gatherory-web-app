import { symmetricDecrypt, symmetricEncrypt } from 'better-auth/crypto'
import { and, eq } from 'drizzle-orm'
import { createRemoteJWKSet, decodeJwt, importPKCS8, jwtVerify, SignJWT } from 'jose'

import { db } from '@/db'
import { account } from '@/db/schema/auth.schema'
import {
  ConfigurationError,
  ExternalServiceError,
  ForbiddenError,
  InvalidInputError,
} from '@/lib/domain-errors'
import { env } from '@/env'

const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'))
const appleOrigin = 'https://appleid.apple.com'
const encryptedToken = (value: string) =>
  value.startsWith('$ba$') || (value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value))

export async function generateAppleClientSecret(clientId: string) {
  if (!env.APPLE_TEAM_ID || !env.APPLE_KEY_ID || !env.APPLE_PRIVATE_KEY) {
    throw new ConfigurationError({
      category: 'system',
      code: 'APPLE_CREDENTIALS_MISSING',
      userMessageKey: 'serverErrors.SYSTEM',
    })
  }
  const key = await importPKCS8(env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n').trim(), 'ES256')
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: env.APPLE_KEY_ID })
    .setIssuer(env.APPLE_TEAM_ID)
    .setSubject(clientId)
    .setAudience(appleOrigin)
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(key)
}

async function decodeStoredToken(value: string | null) {
  if (!value) return null
  // Better Auth reads old plaintext OAuth records after encryption is enabled.
  return encryptedToken(value)
    ? symmetricDecrypt({ key: env.BETTER_AUTH_SECRET, data: value })
    : value
}

export async function exchangeAppleAuthorizationCode(
  code: string,
  clientId: string,
  options: { fetcher?: typeof fetch; keys?: Parameters<typeof jwtVerify>[1] } = {}
) {
  const response = await (options.fetcher ?? fetch)(`${appleOrigin}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: await generateAppleClientSecret(clientId),
      code,
      grant_type: 'authorization_code',
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    if (response.status === 400) {
      throw new InvalidInputError({
        category: 'validation',
        code: 'APPLE_CODE_INVALID',
        userMessageKey: 'serverErrors.VALIDATION',
        debugMessage: `Apple code exchange returned HTTP ${response.status}`,
      })
    }
    throw new ExternalServiceError({
      category: 'external',
      code: 'APPLE_TOKEN_EXCHANGE_FAILED',
      userMessageKey: 'serverErrors.EXTERNAL',
      debugMessage: `Apple code exchange returned HTTP ${response.status}`,
    })
  }
  const body: unknown = await response.json()
  if (
    !body ||
    typeof body !== 'object' ||
    !('access_token' in body) ||
    !('refresh_token' in body) ||
    !('id_token' in body) ||
    typeof body.access_token !== 'string' ||
    typeof body.refresh_token !== 'string' ||
    typeof body.id_token !== 'string' ||
    !body.access_token ||
    !body.refresh_token ||
    !body.id_token
  ) {
    throw new ExternalServiceError({
      category: 'external',
      code: 'APPLE_TOKEN_RESPONSE_INVALID',
      userMessageKey: 'serverErrors.EXTERNAL',
    })
  }
  let subject: string | undefined
  try {
    const { payload } = await jwtVerify(body.id_token, options.keys ?? appleKeys, {
      issuer: appleOrigin,
      audience: clientId,
    })
    subject = payload.sub
  } catch (cause) {
    await revokeToken(body.refresh_token, clientId, 'refresh_token', options.fetcher)
    throw new InvalidInputError({
      category: 'validation',
      code: 'APPLE_IDENTITY_INVALID',
      userMessageKey: 'serverErrors.VALIDATION',
      cause,
    })
  }
  if (!subject) {
    await revokeToken(body.refresh_token, clientId, 'refresh_token', options.fetcher)
    throw new InvalidInputError({
      category: 'validation',
      code: 'APPLE_IDENTITY_INVALID',
      userMessageKey: 'serverErrors.VALIDATION',
    })
  }
  return {
    subject,
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresIn: 'expires_in' in body && typeof body.expires_in === 'number' ? body.expires_in : 3600,
  }
}

async function revokeToken(
  token: string,
  clientId: string,
  type: 'refresh_token' | 'access_token',
  fetcher: typeof fetch = fetch
) {
  const response = await fetcher(`${appleOrigin}/auth/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: await generateAppleClientSecret(clientId),
      token,
      token_type_hint: type,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok)
    throw new ExternalServiceError({
      category: 'external',
      code: 'APPLE_REVOCATION_FAILED',
      userMessageKey: 'serverErrors.EXTERNAL',
      debugMessage: `Apple token revocation returned HTTP ${response.status}`,
    })
}

/** A native authorization code is bound to an authenticated Apple account by its verified subject. */
export async function saveNativeAppleRevocationToken(
  userId: string,
  code: string,
  options: {
    fetcher?: typeof fetch
    keys?: Parameters<typeof jwtVerify>[1]
  } = {}
) {
  const clientId = env.APPLE_APP_BUNDLE_IDENTIFIER
  if (!clientId)
    throw new ConfigurationError({
      category: 'system',
      code: 'APPLE_NATIVE_CLIENT_ID_MISSING',
      userMessageKey: 'serverErrors.SYSTEM',
    })
  const exchanged = await exchangeAppleAuthorizationCode(code, clientId, options)
  const [linked] = await db
    .select({ id: account.id })
    .from(account)
    .where(
      and(
        eq(account.userId, userId),
        eq(account.providerId, 'apple'),
        eq(account.accountId, exchanged.subject)
      )
    )
    .limit(1)
  if (!linked) {
    await revokeToken(exchanged.refreshToken, clientId, 'refresh_token', options.fetcher)
    throw new ForbiddenError({
      category: 'authorization',
      code: 'APPLE_ACCOUNT_MISMATCH',
      userMessageKey: 'serverErrors.AUTHORIZATION',
    })
  }
  try {
    await db
      .update(account)
      .set({
        accessToken: await symmetricEncrypt({
          key: env.BETTER_AUTH_SECRET,
          data: exchanged.accessToken,
        }),
        refreshToken: await symmetricEncrypt({
          key: env.BETTER_AUTH_SECRET,
          data: exchanged.refreshToken,
        }),
        accessTokenExpiresAt: new Date(Date.now() + exchanged.expiresIn * 1000),
      })
      .where(and(eq(account.id, linked.id), eq(account.userId, userId)))
  } catch (cause) {
    await revokeToken(exchanged.refreshToken, clientId, 'refresh_token', options.fetcher)
    throw cause
  }
}

/** Called before Gatherory data is removed, so Apple failures can be retried. */
export async function revokeAppleAccountsBeforeDeletion(
  userId: string,
  options: {
    fetcher?: typeof fetch
  } = {}
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
    await revokeToken(
      refreshToken ?? accessToken!,
      clientId,
      refreshToken ? 'refresh_token' : 'access_token',
      options.fetcher
    )
  }
}

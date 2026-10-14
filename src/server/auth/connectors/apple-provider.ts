import { createRemoteJWKSet, jwtVerify, importPKCS8, SignJWT } from 'jose'
import { env } from '@/env'
import { ConfigurationError, ExternalServiceError, InvalidInputError } from '@/lib/domain-errors'

const appleOrigin = 'https://appleid.apple.com'
const appleKeys = createRemoteJWKSet(new URL(`${appleOrigin}/auth/keys`))

export type AppleProviderOptions = {
  readonly fetcher?: typeof fetch
  readonly keys?: Parameters<typeof jwtVerify>[1]
}

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

export async function exchangeAppleAuthorizationCode(
  code: string,
  clientId: string,
  options: AppleProviderOptions = {}
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
    if (response.status === 400)
      throw new InvalidInputError({
        category: 'validation',
        code: 'APPLE_CODE_INVALID',
        userMessageKey: 'serverErrors.VALIDATION',
        debugMessage: `Apple code exchange returned HTTP ${response.status}`,
      })
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
    subject = (
      await jwtVerify(body.id_token, options.keys ?? appleKeys, {
        issuer: appleOrigin,
        audience: clientId,
      })
    ).payload.sub
  } catch (cause) {
    await revokeAppleToken(body.refresh_token, clientId, 'refresh_token', options)
    throw new InvalidInputError({
      category: 'validation',
      code: 'APPLE_IDENTITY_INVALID',
      userMessageKey: 'serverErrors.VALIDATION',
      cause,
    })
  }
  if (!subject) {
    await revokeAppleToken(body.refresh_token, clientId, 'refresh_token', options)
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

export async function revokeAppleToken(
  token: string,
  clientId: string,
  type: 'refresh_token' | 'access_token',
  options: AppleProviderOptions = {}
) {
  const response = await (options.fetcher ?? fetch)(`${appleOrigin}/auth/revoke`, {
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

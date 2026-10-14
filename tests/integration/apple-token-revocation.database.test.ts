import { expect, test } from 'vitest'
import { symmetricEncrypt } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'

test(
  'native Apple code is bound to its signed-in account, stored encrypted, and revoked before deletion',
  {
    skip: process.env.RUN_APPLE_TOKEN_DB_TESTS !== '1',
    timeout: 30_000,
  },
  async () => {
    expect(
      ['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL!).hostname)
    ).toBeTruthy()
    const { env } = await import('@/env')
    expect(
      env.APPLE_APP_BUNDLE_IDENTIFIER &&
        env.APPLE_TEAM_ID &&
        env.APPLE_KEY_ID &&
        env.APPLE_PRIVATE_KEY
    ).toBeTruthy()
    const { db, pool } = await import('@/db')
    const { user, account } = await import('@/db/schema/auth.schema')
    const { saveNativeAppleRevocationToken, revokeAppleAccountsBeforeDeletion } =
      await import('@/server/auth/apple-tokens')
    const { publicKey, privateKey } = await generateKeyPair('ES256')
    const keys = createLocalJWKSet({
      keys: [{ ...(await exportJWK(publicKey)), alg: 'ES256', kid: 'fixture' }],
    })
    const userId = `apple-token-test-${crypto.randomUUID()}`
    const subject = `apple-subject-${crypto.randomUUID()}`
    const accountId = crypto.randomUUID()
    const issue = (sub: string, audience = env.APPLE_APP_BUNDLE_IDENTIFIER!) =>
      new SignJWT({})
        .setProtectedHeader({ alg: 'ES256', kid: 'fixture' })
        .setIssuer('https://appleid.apple.com')
        .setAudience(audience)
        .setSubject(sub)
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(privateKey)
    let identityToken = await issue(subject)
    let failRevocation = false
    const requests: { path: string; form: URLSearchParams }[] = []
    const fetcher: typeof fetch = async (input, init) => {
      const path = new URL(String(input)).pathname
      const form = new URLSearchParams(init?.body as URLSearchParams)
      requests.push({ path, form })
      if (path === '/auth/token')
        return Response.json({
          access_token: 'access-fixture',
          refresh_token: 'refresh-fixture',
          id_token: identityToken,
          expires_in: 3600,
        })
      if (path === '/auth/revoke') return new Response(null, { status: failRevocation ? 400 : 200 })
      throw new Error('Unexpected Apple URL')
    }
    try {
      await db.insert(user).values({
        id: userId,
        name: 'Apple token fixture',
        email: `${userId}@example.com`,
        emailVerified: true,
      })
      await db.insert(account).values({
        id: accountId,
        userId,
        accountId: subject,
        providerId: 'apple',
        idToken: await symmetricEncrypt({ key: env.BETTER_AUTH_SECRET, data: identityToken }),
      })

      identityToken = await issue('other-apple-user')
      await expect(
        saveNativeAppleRevocationToken(userId, 'single-use-code', { fetcher, keys })
      ).rejects.toMatchObject({ code: 'APPLE_ACCOUNT_MISMATCH' })
      expect(requests.at(-1)?.path, 'Unmatched code is revoked immediately').toBe('/auth/revoke')
      expect(
        (await db.select().from(account).where(eq(account.id, accountId)))[0].refreshToken
      ).toBe(null)

      identityToken = await issue(subject)
      await saveNativeAppleRevocationToken(userId, 'fresh-code', { fetcher, keys })
      const [stored] = await db.select().from(account).where(eq(account.id, accountId))
      expect(stored.refreshToken ?? '').toMatch(/^(?:\$ba\$|[0-9a-f]+$)/i)
      expect(stored.refreshToken).not.toBe('refresh-fixture')
      expect(stored.accessToken ?? '').toMatch(/^(?:\$ba\$|[0-9a-f]+$)/i)
      expect(requests.find((item) => item.path === '/auth/token')?.form.get('client_id')).toBe(
        env.APPLE_APP_BUNDLE_IDENTIFIER
      )

      // Refresh tokens must remain revocable after the saved ID token expires.
      const now = Math.floor(Date.now() / 1000)
      const expiredIdentityToken = await new SignJWT({})
        .setProtectedHeader({ alg: 'ES256', kid: 'fixture' })
        .setIssuer('https://appleid.apple.com')
        .setAudience(env.APPLE_APP_BUNDLE_IDENTIFIER!)
        .setSubject(subject)
        .setIssuedAt(now - 3600)
        .setExpirationTime(now - 1800)
        .sign(privateKey)
      await db
        .update(account)
        .set({
          idToken: await symmetricEncrypt({
            key: env.BETTER_AUTH_SECRET,
            data: expiredIdentityToken,
          }),
        })
        .where(eq(account.id, accountId))

      failRevocation = true
      await expect(revokeAppleAccountsBeforeDeletion(userId, { fetcher })).rejects.toMatchObject({
        code: 'APPLE_REVOCATION_FAILED',
      })
      expect(
        (await db.select().from(user).where(eq(user.id, userId))).length,
        'A failed Apple call must leave the account available to retry deletion'
      ).toBe(1)

      failRevocation = false
      await revokeAppleAccountsBeforeDeletion(userId, { fetcher })
      const revoked = requests.at(-1)!
      expect(revoked.path).toBe('/auth/revoke')
      expect(revoked.form.get('client_id')).toBe(env.APPLE_APP_BUNDLE_IDENTIFIER)
      expect(revoked.form.get('token')).toBe('refresh-fixture')
      expect(revoked.form.get('token_type_hint')).toBe('refresh_token')

      // A linked web account can have a Services ID audience and only an access token.
      await db
        .update(account)
        .set({
          refreshToken: null,
          accessToken: 'web-access-token',
          idToken: await issue(subject, env.APPLE_CLIENT_ID!),
        })
        .where(eq(account.id, accountId))
      await revokeAppleAccountsBeforeDeletion(userId, { fetcher })
      expect(requests.at(-1)?.form.get('client_id')).toBe(env.APPLE_CLIENT_ID)
      expect(requests.at(-1)?.form.get('token_type_hint')).toBe('access_token')
      expect(requests.at(-1)?.form.get('token')).toBe('web-access-token')

      // Accounts created before code capture still delete without an Apple token.
      await db.update(account).set({ accessToken: null }).where(eq(account.id, accountId))
      const requestCount = requests.length
      await revokeAppleAccountsBeforeDeletion(userId, { fetcher })
      expect(requests.length).toBe(requestCount)

      // The endpoint must not accept an anonymous code, even if it is well formed.
      const response = await fetch('http://127.0.0.1:3003/api/auth/apple-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizationCode: 'unused' }),
      })
      expect(response.status).toBe(401)
    } finally {
      await db.delete(user).where(eq(user.id, userId))
      await pool.end()
    }
  }
)

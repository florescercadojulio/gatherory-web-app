import { expect, test } from 'vitest'
import { createHash, randomBytes } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'

test(
  'Android Apple handoff atomically enforces PKCE, state, expiry, and live-session identity',
  {
    skip: process.env.RUN_ANDROID_APPLE_AUTH_TESTS !== '1',
    timeout: 30_000,
  },
  async () => {
    const oldEnabled = process.env.ANDROID_APPLE_SIGN_IN_ENABLED
    process.env.ANDROID_APPLE_SIGN_IN_ENABLED = 'true'
    const { env } = await import('@/env')
    expect(['localhost', '127.0.0.1', '[::1]'].includes(new URL(env.DATABASE_URL).hostname)).toBe(
      true
    )
    const { db, pool } = await import('@/db')
    const schema = await import('@/db/schema/auth.schema')
    const {
      androidAppleHandoffRecordId,
      androidAppleStartRecordId,
      handleAndroidAppleComplete,
      handleAndroidAppleExchange,
      handleAndroidAppleStart,
    } = await import('@/server/auth/handlers/android-apple-sign-in.handler')
    const userId = `android-apple-handoff-${crypto.randomUUID()}`
    const sessionId = crypto.randomUUID()
    const sessionToken = `synthetic-session-${crypto.randomUUID()}`
    const now = new Date()
    const code = randomBytes(32).toString('base64url')
    const verifier = randomBytes(32).toString('base64url')
    const state = randomBytes(32).toString('base64url')
    const challenge = createHash('sha256').update(verifier, 'ascii').digest('base64url')
    const wrongProofCode = randomBytes(32).toString('base64url')
    const wrongProofID = androidAppleHandoffRecordId(wrongProofCode)
    const expiredCode = randomBytes(32).toString('base64url')
    const expiredID = androidAppleHandoffRecordId(expiredCode)
    const staleSessionCode = randomBytes(32).toString('base64url')
    const staleSessionID = androidAppleHandoffRecordId(staleSessionCode)
    const startNonce = randomBytes(32).toString('base64url')
    const startID = androidAppleStartRecordId(startNonce)
    const callbackNonce = randomBytes(32).toString('base64url')
    const callbackChallenge = randomBytes(32).toString('base64url')
    const callbackState = randomBytes(32).toString('base64url')
    const value = JSON.stringify({ challenge, clientState: state, userId, sessionId })
    try {
      await db.insert(schema.user).values({
        id: userId,
        name: 'Android Apple fixture',
        email: `${userId}@example.test`,
        emailVerified: true,
      })
      await db.insert(schema.session).values({
        id: sessionId,
        token: sessionToken,
        userId,
        expiresAt: new Date(now.getTime() + 5 * 60_000),
        createdAt: now,
        updatedAt: now,
      })
      await db.insert(schema.verification).values([
        {
          id: androidAppleHandoffRecordId(code),
          identifier: 'android-apple-handoff',
          value,
          expiresAt: new Date(now.getTime() + 5 * 60_000),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: wrongProofID,
          identifier: 'android-apple-handoff',
          value,
          expiresAt: new Date(now.getTime() + 5 * 60_000),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: expiredID,
          identifier: 'android-apple-handoff',
          value,
          expiresAt: new Date(now.getTime() - 1),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: staleSessionID,
          identifier: 'android-apple-handoff',
          value,
          expiresAt: new Date(now.getTime() + 5 * 60_000),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: startID,
          identifier: 'android-apple-start',
          value: JSON.stringify({
            challenge: callbackChallenge,
            clientState: callbackState,
            callbackNonce,
          }),
          expiresAt: new Date(now.getTime() + 5 * 60_000),
          createdAt: now,
          updatedAt: now,
        },
      ])

      const request = (body: unknown) =>
        new Request('https://app.gatherory.com/api/auth/android/apple/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      const oversized = await handleAndroidAppleExchange(
        new Request('https://app.gatherory.com/api/auth/android/apple/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: 'x'.repeat(3000), verifier, state }),
        })
      )
      expect(oversized.status).toBe(400)

      const callbackURL = `https://app.gatherory.com/api/auth/android/apple/complete?challenge=${callbackChallenge}&state=${callbackState}&bridge=${callbackNonce}&error=access_denied`
      const wrongCookie = await handleAndroidAppleComplete(
        new Request(callbackURL, {
          headers: { Cookie: `gatherory_android_apple_start=${'x'.repeat(43)}` },
        })
      )
      expect(wrongCookie.headers.get('location')).toContain('error=sign_in_failed')
      expect(
        await db.select().from(schema.verification).where(eq(schema.verification.id, startID))
      ).toHaveLength(1)

      const denied = await handleAndroidAppleComplete(
        new Request(callbackURL, {
          headers: { Cookie: `gatherory_android_apple_start=${startNonce}` },
        })
      )
      const deniedURL = new URL(denied.headers.get('location')!)
      expect(deniedURL.searchParams.get('error')).toBe('sign_in_failed')
      expect(deniedURL.searchParams.get('state')).toBe(callbackState)
      expect(denied.headers.get('set-cookie')).toContain('Max-Age=0')
      expect(
        await db.select().from(schema.verification).where(eq(schema.verification.id, startID))
      ).toHaveLength(0)

      const startUrl = `https://app.gatherory.com/api/auth/android/apple/start?challenge=${'a'.repeat(43)}&state=${'b'.repeat(43)}`
      const assertFailedStartCleansRecord = async (
        runAuth: (authRequest: Request) => Promise<Response>
      ) => {
        const before = await db
          .select({ id: schema.verification.id })
          .from(schema.verification)
          .where(eq(schema.verification.identifier, 'android-apple-start'))
        const response = await handleAndroidAppleStart(new Request(startUrl), {
          enabled: true,
          runAuth,
        })
        expect(response.status).toBe(503)
        expect(await response.json()).toEqual({ error: 'APPLE_SIGN_IN_UNAVAILABLE' })
        expect(response.headers.get('set-cookie')).toBeNull()
        const after = await db
          .select({ id: schema.verification.id })
          .from(schema.verification)
          .where(eq(schema.verification.identifier, 'android-apple-start'))
        expect(after).toHaveLength(before.length)
      }
      const authBodies: Record<string, unknown>[] = []
      await assertFailedStartCleansRecord(async (authRequest) => {
        authBodies.push((await authRequest.json()) as Record<string, unknown>)
        throw new Error('Synthetic provider configuration failure')
      })
      expect(authBodies[0]?.provider).toBe('apple')
      expect(authBodies[0]?.callbackURL).toBe(authBodies[0]?.errorCallbackURL)
      await assertFailedStartCleansRecord(async () =>
        Response.json({ error: 'Provider not configured' }, { status: 400 })
      )
      await assertFailedStartCleansRecord(async () => Response.json({ url: 'not a valid URL' }))

      const success = await handleAndroidAppleExchange(request({ code, verifier, state }))
      expect(success.status).toBe(200)
      const payload = await success.json()
      expect(payload.token).toBe(sessionToken)
      expect(payload.user.id).toBe(userId)
      expect(success.headers.get('cache-control')).toBe('no-store')
      expect(
        await db
          .select()
          .from(schema.verification)
          .where(eq(schema.verification.id, androidAppleHandoffRecordId(code)))
      ).toHaveLength(0)
      const replay = await handleAndroidAppleExchange(request({ code, verifier, state }))
      expect(replay.status).toBe(401)

      const wrongState = `${state.slice(0, -1)}${state.endsWith('x') ? 'y' : 'x'}`
      const wrongProof = await handleAndroidAppleExchange(
        request({ code: wrongProofCode, verifier, state: wrongState })
      )
      expect(wrongProof.status).toBe(401)
      expect(
        await db.select().from(schema.verification).where(eq(schema.verification.id, wrongProofID))
      ).toHaveLength(0)
      const changedStateReplay = await handleAndroidAppleExchange(
        request({ code: wrongProofCode, verifier, state })
      )
      expect(changedStateReplay.status).toBe(401)

      const expired = await handleAndroidAppleExchange(
        request({ code: expiredCode, verifier, state })
      )
      expect(expired.status).toBe(401)

      // A previously issued handoff cannot restore a revoked Better Auth session.
      await db.delete(schema.session).where(eq(schema.session.id, sessionId))
      const staleSession = await handleAndroidAppleExchange(
        request({ code: staleSessionCode, verifier, state })
      )
      expect(staleSession.status).toBe(401)
      expect(
        await db.select().from(schema.session).where(eq(schema.session.id, sessionId))
      ).toHaveLength(0)
      expect(
        await db
          .select()
          .from(schema.verification)
          .where(eq(schema.verification.id, staleSessionID))
      ).toHaveLength(0)
    } finally {
      await db
        .delete(schema.verification)
        .where(
          inArray(schema.verification.id, [
            androidAppleHandoffRecordId(code),
            wrongProofID,
            expiredID,
            staleSessionID,
            startID,
          ])
        )
      await db.delete(schema.user).where(eq(schema.user.id, userId))
      await pool.end()
      if (oldEnabled === undefined) delete process.env.ANDROID_APPLE_SIGN_IN_ENABLED
      else process.env.ANDROID_APPLE_SIGN_IN_ENABLED = oldEnabled
    }
  }
)

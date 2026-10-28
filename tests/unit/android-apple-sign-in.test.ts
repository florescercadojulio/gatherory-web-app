import { expect, test } from 'vitest'
import { env } from '@/env'
import {
  androidAppleSignInContract,
  handleAndroidAppleStart,
} from '@/server/auth/handlers/android-apple-sign-in.handler'

test('Android Apple bridge is fixed-origin, short-lived, and accepts only SHA-256 PKCE tokens', () => {
  const { appCallback, challengePattern, statePattern, verifierPattern, handoffTtlMs } = androidAppleSignInContract
  expect(appCallback).toBe('gatherory://auth/apple/callback')
  expect(handoffTtlMs).toBe(5 * 60 * 1000)
  expect(challengePattern.test('a'.repeat(43))).toBe(true)
  expect(statePattern.test('b'.repeat(43))).toBe(true)
  expect(verifierPattern.test('c'.repeat(43))).toBe(true)
  expect(challengePattern.test('a'.repeat(42))).toBe(false)
  expect(challengePattern.test(`${'a'.repeat(42)}=`)).toBe(false)
  expect(statePattern.test('state with spaces'.padEnd(43, 'x'))).toBe(false)
  expect(verifierPattern.test('short')).toBe(false)
})

test('disabled Android Apple sign-in does not start an OAuth redirect or set browser cookies', async () => {
  if (env.ANDROID_APPLE_SIGN_IN_ENABLED) return
  const response = await handleAndroidAppleStart(new Request(
    'https://app.gatherory.com/api/auth/android/apple/start?challenge=' + 'a'.repeat(43) +
      '&state=' + 'b'.repeat(43) + '&requestSignUp=true'
  ))
  expect(response.status).toBe(404)
  expect(response.headers.get('location')).toBeNull()
  expect(response.headers.get('set-cookie')).toBeNull()
  expect(response.headers.get('cache-control')).toBe('no-store')
})

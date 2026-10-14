import { expect, test } from 'vitest'
import { mapAppleProfile } from '@/server/auth/apple-profile'

test('Apple email omission recovers only the profile linked to the verified subject', async () => {
  const saved = { email: 'person@privaterelay.appleid.com', emailVerified: true, name: 'Person' }
  const result = await mapAppleProfile({ sub: 'known-apple-subject' }, async (subject) => {
    expect(subject).toBe('known-apple-subject')
    return saved
  })
  expect(result).toEqual(saved)
})

test("A present Apple email uses the provider's normal verification mapping", async () => {
  expect(
    await mapAppleProfile({ sub: 'subject', email: 'person@example.com' }, async () => {
      throw new Error('Must not replace a current Apple email with a cached one')
    })
  ).toEqual({})
})

test('Missing-email deleted and unknown identities get a recovery error, never a placeholder', async () => {
  for (const sub of ['deleted-subject', 'unknown-subject', '']) {
    await expect(mapAppleProfile({ sub }, async () => undefined)).rejects.toMatchObject({
      status: 'BAD_REQUEST',
      body: { code: 'APPLE_EMAIL_REQUIRED' },
    })
  }
})

test('A saved unverified email is never promoted to verified', async () => {
  const result = await mapAppleProfile({ sub: 'subject' }, async () => ({
    email: 'person@example.com',
    emailVerified: false,
    name: 'Person',
  }))
  expect(result.emailVerified).toBe(false)
})

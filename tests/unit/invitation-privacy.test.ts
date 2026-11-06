import { expect, test } from 'vitest'
import { isPrivateInvitationPath, redactInvitationCredentials } from '@/lib/invitation-privacy'

test('invitation and attendee screens are excluded from capture without excluding normal events', () => {
  for (const pathname of ['/join', '/join/token', '/invited/events/id']) {
    expect(isPrivateInvitationPath(pathname), pathname).toBe(true)
  }
  for (const pathname of ['/workspaces', '/account', '/joinery', '/invitedness']) {
    expect(isPrivateInvitationPath(pathname), pathname).toBe(false)
  }
})

test('invitation bearer credentials are removed from nested referrals and encoded auth continuations', () => {
  const token = '880539cd-c19c-44c9-965e-339ea9737629'
  const input = {
    properties: {
      $referrer: `https://app.example/join/${token}`,
      $current_url: `https://app.example/auth/sign-in?redirectTo=%2Fjoin%2F${token}`,
    },
    nested: [`/join/${token}`],
    count: 2,
  }
  const result = redactInvitationCredentials(input)
  expect(JSON.stringify(result)).not.toContain(token)
  expect(result.properties.$referrer).toBe('https://app.example/join/[redacted]')
  expect(result.count).toBe(2)
  expect(input.nested[0]).toContain(token)
  expect(redactInvitationCredentials(null)).toBeNull()
})

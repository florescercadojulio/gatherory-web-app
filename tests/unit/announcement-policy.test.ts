import { expect, test } from 'vitest'
import {
  announcementNotificationAllowed,
  announcementPolicy,
} from '@/server/announcements/services/announcement-policy'

test.each([
  ['host', 'manage', ['all', 'planning', 'guests'], ['all', 'planning', 'guests']],
  ['collaborator', 'manage', ['planning'], ['all', 'planning']],
  ['collaborator', 'contribute', ['planning'], ['all', 'planning']],
  ['collaborator', 'view_only', [], ['all', 'planning']],
  ['guest', 'view_only', [], ['all', 'guests']],
] as const)(
  'audience grants for %s/%s preserve planning privacy',
  (role, permission, sends, reads) => {
    const policy = announcementPolicy({ kind: 'user', role, permission, active: true })
    expect(policy.allowedAudiences).toEqual(sends)
    expect(policy.readAudiences).toEqual(reads)
    expect(policy.canSend).toBe(sends.length > 0)
  }
)

test('device guests and inactive events cannot send; hosts moderate without guest alerts', () => {
  const host = announcementPolicy({
    kind: 'user',
    role: 'host',
    permission: 'manage',
    active: true,
  })
  expect(host.readAudiences).toContain('guests')
  expect(announcementNotificationAllowed(host, 'guests')).toBe(false)
  const guest = announcementPolicy({
    kind: 'device_guest',
    role: 'guest',
    permission: 'view_only',
    active: true,
  })
  expect(guest.allowedAudiences).toEqual([])
  expect(announcementNotificationAllowed(guest, 'planning')).toBe(false)
  expect(announcementNotificationAllowed(guest, 'guests')).toBe(true)
  expect(
    announcementPolicy({ kind: 'user', role: 'host', permission: 'manage', active: false })
      .allowedAudiences
  ).toEqual([])
})

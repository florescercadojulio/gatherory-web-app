import { expect, test } from 'vitest'
import { SendAnnouncementSchema } from '@/server/announcements/contracts/announcement.contracts'

const requestId = '7bcc6c2a-cc96-42cc-aab2-305771a2ce37'
test('announcement text trims surrounding whitespace and counts Unicode scalars', () => {
  expect(SendAnnouncementSchema.parse({ requestId, message: '  Meet upstairs.\n' }).message).toBe(
    'Meet upstairs.'
  )
  expect(SendAnnouncementSchema.safeParse({ requestId, message: '😀'.repeat(750) }).success).toBe(
    true
  )
  expect(SendAnnouncementSchema.safeParse({ requestId, message: '😀'.repeat(751) }).success).toBe(
    false
  )
  expect(SendAnnouncementSchema.safeParse({ requestId, message: ' \n\t' }).success).toBe(false)
  expect(SendAnnouncementSchema.safeParse({ requestId, message: '\ud800' }).success).toBe(false)
  expect(SendAnnouncementSchema.safeParse({ requestId, message: '\udfff' }).success).toBe(false)
  expect(SendAnnouncementSchema.safeParse({ requestId, message: 'Hello\u0000world' }).success).toBe(
    false
  )
})

test('announcement writes require an explicit UUID receipt and reject caller supplied authority', () => {
  expect(SendAnnouncementSchema.parse({ requestId, message: 'Update' }).audience).toBe('all')
  expect(
    SendAnnouncementSchema.parse({ requestId, message: 'Update', audience: 'planning' }).audience
  ).toBe('planning')
  expect(
    SendAnnouncementSchema.safeParse({ requestId, message: 'Update', audience: 'organization' })
      .success
  ).toBe(false)
  expect(SendAnnouncementSchema.safeParse({ message: 'Update' }).success).toBe(false)
  expect(
    SendAnnouncementSchema.safeParse({ requestId: 'retry-1', message: 'Update' }).success
  ).toBe(false)
  expect(
    SendAnnouncementSchema.safeParse({ requestId, message: 'Update', role: 'host' }).success
  ).toBe(false)
})

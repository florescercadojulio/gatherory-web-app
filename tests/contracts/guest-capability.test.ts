import { expect, test } from 'vitest'
import {
  GuestAttendanceSchema,
  GuestCredentialSchema,
  GuestEventSchema,
  GuestProfileRegistrationSchema,
  GuestShareTokenSchema,
} from '@/server/events/contracts/guest-capability.contracts'

test('device guest registration accepts trimmed Unicode names and 256-bit credentials', () => {
  const input = {
    id: crypto.randomUUID(),
    name: `  ${'🌿'.repeat(80)}  `,
    credential: 'A'.repeat(43),
  }
  expect(GuestProfileRegistrationSchema.parse(input)).toMatchObject({
    name: '🌿'.repeat(80),
  })
  expect(
    GuestProfileRegistrationSchema.safeParse({ ...input, name: '🌿'.repeat(81) }).success
  ).toBe(false)
  expect(GuestCredentialSchema.safeParse(`${'A'.repeat(42)}=`).success).toBe(false)
})

test('guest attendance and invitation inputs are narrow and UUID scoped', () => {
  const eventId = crypto.randomUUID()
  expect(GuestAttendanceSchema.parse({ eventId, attendance: 'not_sure' }).attendance).toBe(
    'not_sure'
  )
  expect(GuestAttendanceSchema.safeParse({ eventId, attendance: 'host' }).success).toBe(false)
  expect(GuestEventSchema.safeParse({ eventId: 'not-an-id' }).success).toBe(false)
  expect(GuestShareTokenSchema.safeParse({ token: crypto.randomUUID() }).success).toBe(true)
})

import { z } from 'zod'

const uuid = z.uuid().transform((value) => value.toLowerCase())

/** 256-bit client-generated base64url credential, without padding. */
export const GuestCredentialSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/)

export const GuestProfileRegistrationSchema = z.object({
  id: uuid,
  name: z
    .string()
    .trim()
    .min(1)
    .refine((value) => Array.from(value).length <= 80, 'Name must be 80 characters or fewer.'),
  credential: GuestCredentialSchema,
})

export const GuestShareTokenSchema = z.object({ token: uuid })

export const GuestAttendanceSchema = z.object({
  eventId: uuid,
  attendance: z.enum(['going', 'not_sure', 'not_going']),
})

export const GuestEventSchema = z.object({ eventId: uuid })

export type GuestProfileRegistration = z.infer<typeof GuestProfileRegistrationSchema>
export type GuestAttendance = z.infer<typeof GuestAttendanceSchema>

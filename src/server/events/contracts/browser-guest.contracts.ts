import { z } from 'zod'
import { GuestProfileRegistrationSchema } from './guest-capability.contracts'

const uuid = z.uuid().transform((value) => value.toLowerCase())

export const BrowserGuestInvitationStatusInputSchema = z.object({ token: uuid })
export const PrepareBrowserGuestSessionInputSchema = z.object({}).strict()
export const JoinBrowserGuestInvitationInputSchema = z.object({
  token: uuid,
  name: GuestProfileRegistrationSchema.shape.name,
})
export const BrowserGuestEventInputSchema = z.object({ eventId: uuid })
export const RespondAsBrowserGuestInputSchema = z.object({
  eventId: uuid,
  attendance: z.enum(['going', 'not_sure', 'not_going']),
})

export type BrowserGuestInvitationStatusInput = z.infer<
  typeof BrowserGuestInvitationStatusInputSchema
>
export type JoinBrowserGuestInvitationInput = z.infer<typeof JoinBrowserGuestInvitationInputSchema>
export type BrowserGuestEventInput = z.infer<typeof BrowserGuestEventInputSchema>
export type RespondAsBrowserGuestInput = z.infer<typeof RespondAsBrowserGuestInputSchema>

/** Deliberately limited to the event's invitation summary and this guest's own RSVP. */
export type BrowserGuestEvent = {
  id: string
  title: string
  startsAt: string | null
  endsAt: string | null
  isAllDay: boolean
  timeZone: string
  locationName: string | null
  attendance: 'pending' | 'going' | 'not_sure' | 'not_going'
  name: string
  canRespond: boolean
}

export type BrowserGuestStatus = {
  eventId: string
  name: string
  attendance: BrowserGuestEvent['attendance']
  canRespond: boolean
}

export type BrowserGuestInvitationStatus = {
  invitation: BrowserGuestInvitationPreview | null
  guest: BrowserGuestStatus | null
  /** Verified current browser guest display name, even before joining this event. */
  identityName: string | null
}

export type BrowserGuestInvitationPreview = {
  eventId: string
  title: string
  startsAt: string | null
  timeZone: string
  isAllDay: boolean
  locationName: string | null
  role: 'guest'
  status: 'pending' | 'accepted'
  expiresAt: string | null
}

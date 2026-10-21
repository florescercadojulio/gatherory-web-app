import { z } from 'zod'

export const AnnouncementEventSchema = z.uuid().transform((value) => value.toLowerCase())
export const AnnouncementAudienceSchema = z.enum(['all', 'planning', 'guests'])
export type AnnouncementAudience = z.infer<typeof AnnouncementAudienceSchema>
export const SendAnnouncementSchema = z
  .object({
    requestId: z.uuid().transform((value) => value.toLowerCase()),
    audience: AnnouncementAudienceSchema.default('all'),
    message: z
      .string()
      .trim()
      .min(1)
      .refine((value) => !value.includes('\u0000'))
      .refine((value) => Array.from(value).length <= 750)
      .refine(
        (value) =>
          !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)
      ),
  })
  .strict()

export type SendAnnouncement = z.input<typeof SendAnnouncementSchema>
export type AnnouncementIdentity = { kind: 'user' | 'device_guest'; id: string }
export type Announcement = {
  id: string
  eventId: string
  message: string
  audience: AnnouncementAudience
  /** Resolved against the current event member profile; null after account deletion. */
  authorId: string | null
  /** Generic byline avoids retaining a deleted account's name or email. */
  authorName: 'Host' | 'Planning Team'
  createdAt: string
}
export type AnnouncementHistory = {
  announcements: Announcement[]
  canSend: boolean
  allowedAudiences: AnnouncementAudience[]
}

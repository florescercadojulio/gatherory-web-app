import { z } from "zod"

const optionalText = z
  .string()
  .trim()
  .max(2_000)
  .optional()
  .transform((value) => value || undefined)

const eventBase = {
  title: z.string().trim().min(1).max(120),
  description: optionalText,
  imageUrl: z.url().optional(),
  startsAt: z.iso.datetime().optional(),
  endsAt: z.iso.datetime().optional(),
  timeZone: z.string().trim().min(1).max(100),
  locationName: z.string().trim().max(160).optional(),
  locationAddress: z.string().trim().max(500).optional(),
}

export const CreateEventInputSchema = z
  .union([
    z.object({
      ...eventBase,
      parentEventId: z.null().optional(),
      purpose: z.null().optional(),
    }),
    z.object({
      ...eventBase,
      parentEventId: z.uuid(),
      purpose: z.enum(["planning_scouting", "part_of_event"]),
      category: z
        .enum([
          "venue",
          "food_tasting",
          "photography",
          "honeymoon",
          "attire_fitting",
          "wedding_shower",
          "bachelor_bachelorette",
          "rehearsal",
          "ceremony",
          "reception",
          "other",
        ])
        .default("other"),
      planningStatus: z
        .enum(["draft", "approved", "not_sure", "rejected", "archived"])
        .default("approved"),
    }),
  ])
  .refine(
    (value) => !value.endsAt || Boolean(value.startsAt),
    {
      message: "An event end requires a start.",
      path: ["endsAt"],
    },
  )
  .refine(
    (value) =>
      !value.startsAt ||
      !value.endsAt ||
      new Date(value.endsAt) >= new Date(value.startsAt),
    {
      message: "The event end must be after its start.",
      path: ["endsAt"],
    },
  )

export type CreateEventInput = z.infer<typeof CreateEventInputSchema>

export const ListEventsInputSchema = z.object({
  organizationId: z.string().trim().min(1),
})

export const InviteEventParticipantInputSchema = z.object({
  eventId: z.uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  email: z.email().trim().toLowerCase(),
  role: z.enum(["host", "collaborator", "guest"]),
  planningPermission: z.enum(["manage", "contribute", "viewOnly"]),
})

export type InviteEventParticipantInput = z.infer<
  typeof InviteEventParticipantInputSchema
>

export const AcceptEventInvitationInputSchema = z.object({
  token: z.uuid(),
})

export type AcceptEventInvitationInput = z.infer<
  typeof AcceptEventInvitationInputSchema
>

export type EventParticipantSummary = {
  id: string
  userId: string | null
  name: string
  image: string | null
  role: "host" | "collaborator" | "guest"
  planningPermission: "manage" | "contribute" | "view_only"
  attendanceStatus: "pending" | "going" | "not_sure" | "not_going"
}

export type EventParticipantPreview = Pick<
  EventParticipantSummary,
  "id" | "name" | "image"
>

export type ChildEventSummary = {
  id: string
  title: string
  purpose: "planning_scouting" | "part_of_event"
  status: "draft" | "approved" | "not_sure" | "rejected" | "archived"
  startsAt: string | null
  endsAt: string | null
  timeZone: string
  locationName: string | null
  participantCount: number
  participants: EventParticipantPreview[]
}

export type EventWorkspaceSummary = {
  id: string
  title: string
  workspaceName: string
  description: string | null
  imageUrl: string | null
  status: "draft" | "ongoing" | "finished"
  startsAt: string | null
  endsAt: string | null
  timeZone: string
  locationName: string | null
  pendingInvitationCount: number
  currentParticipant: EventParticipantSummary
  participants: EventParticipantSummary[]
  childEvents: ChildEventSummary[]
}

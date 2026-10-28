import { z } from 'zod'

const requestKey = z.string().trim().min(8).max(128)
const timeZone = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value })
      return true
    } catch {
      return false
    }
  }, 'Use a valid IANA time zone.')
const eventFields = {
  title: z.string().trim().min(1).max(120).describe('The event title.'),
  description: z
    .string()
    .trim()
    .max(2_000)
    .nullable()
    .optional()
    .describe('Optional source-grounded event details or attribution.'),
  startsAt: z.iso
    .datetime({ offset: true })
    .optional()
    .describe('ISO timestamp with Z or an explicit UTC offset.'),
  endsAt: z.iso
    .datetime({ offset: true })
    .nullable()
    .optional()
    .describe('Optional ISO timestamp with Z or an explicit UTC offset.'),
  timeZone: timeZone.optional().describe('IANA time zone, such as America/New_York.'),
  isAllDay: z.boolean().optional().describe('Whether the event lasts all day.'),
  locationName: z
    .string()
    .trim()
    .max(160)
    .nullable()
    .optional()
    .describe('Optional confirmed venue name.'),
  locationAddress: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
    .describe('Optional confirmed street address.'),
}
const eventUpdateFields = z
  .object(eventFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one event field to update.')

export const McpListEventsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(20),
    cursor: z.string().max(128).optional(),
  })
  .strict()
export const McpGetEventInputSchema = z.object({ eventId: z.uuid() }).strict()
export const McpListIdeasInputSchema = z
  .object({
    eventId: z.uuid(),
    limit: z.number().int().min(1).max(50).default(20),
    cursor: z.string().max(128).optional(),
  })
  .strict()
export const McpCreateEventInputSchema = z
  .object({
    idempotencyKey: requestKey,
    title: eventFields.title,
    description: eventFields.description,
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: eventFields.endsAt,
    timeZone,
    isAllDay: z.boolean().default(false),
    locationName: eventFields.locationName,
    locationAddress: eventFields.locationAddress,
  })
  .strict()
  .refine((value) => !value.endsAt || new Date(value.endsAt) >= new Date(value.startsAt), {
    path: ['endsAt'],
    message: 'The event end must be after its start.',
  })
export const McpUpdateEventInputSchema = z
  .object({
    idempotencyKey: requestKey,
    eventId: z.uuid(),
    expectedVersion: z.number().int().positive(),
    changes: eventUpdateFields,
  })
  .strict()
  .refine(
    ({ changes }) =>
      !changes.endsAt ||
      !changes.startsAt ||
      new Date(changes.endsAt) >= new Date(changes.startsAt),
    { path: ['changes', 'endsAt'], message: 'The event end must be after its start.' }
  )

const ideaFields = {
  title: z.string().trim().min(1).max(120).describe('The idea or unscheduled option title.'),
  note: z
    .string()
    .trim()
    .max(2_000)
    .nullable()
    .optional()
    .describe('Optional context, including why this is an alternative or remains unscheduled.'),
  category: z
    .enum([
      'event',
      'registry',
      'link',
      'venue',
      'attire',
      'flowers',
      'food',
      'photography',
      'music',
      'decor',
      'invitations',
      'honeymoon',
      'other',
    ])
    .describe('The closest matching idea category.'),
}
const ideaUpdateFields = z
  .object(ideaFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one idea field to update.')
export const McpCreateIdeaInputSchema = z
  .object({
    idempotencyKey: requestKey,
    eventId: z.uuid(),
    ...ideaFields,
  })
  .strict()
export const McpUpdateIdeaInputSchema = z
  .object({
    idempotencyKey: requestKey,
    eventId: z.uuid(),
    ideaId: z.uuid(),
    expectedVersion: z.number().int().positive(),
    changes: ideaUpdateFields,
  })
  .strict()

export const MCP_CONTENT_TOOL_SCHEMAS = {
  list_events: McpListEventsInputSchema,
  get_event: McpGetEventInputSchema,
  list_ideas: McpListIdeasInputSchema,
  create_event: McpCreateEventInputSchema,
  update_event: McpUpdateEventInputSchema,
  create_idea: McpCreateIdeaInputSchema,
  update_idea: McpUpdateIdeaInputSchema,
} as const

export type McpContentToolName = keyof typeof MCP_CONTENT_TOOL_SCHEMAS
export type McpContentActor = { userId: string }

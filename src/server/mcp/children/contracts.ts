import { z } from 'zod'
import { ConfirmedInstantSchema } from '@/contracts/date-time.contracts'
import { characterString } from '@/contracts/content-primitives'

const idempotencyKey = characterString(8, 128)
const timeZone = characterString(1, 100).refine((value) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}, 'Use a valid IANA time zone.')

const categories = [
  'venue',
  'foodTasting',
  'photography',
  'honeymoon',
  'attireFitting',
  'weddingShower',
  'bachelorBachelorette',
  'rehearsal',
  'ceremony',
  'reception',
  'other',
] as const

const childFields = {
  title: characterString(1, 120).describe(
    'Concise confirmed session or activity title. Do not repeat dates or times here; use the schedule fields.'
  ),
  description: characterString(0, 2_000)
    .nullable()
    .optional()
    .describe('Optional source-grounded details, including attribution or a source link.'),
  category: z.enum(categories).default('other').describe('The closest matching event category.'),
  purpose: z
    .enum(['planning', 'eventExperience'])
    .default('planning')
    .describe(
      'Use eventExperience for a selected scheduled session or activity; planning is for other child planning items.'
    ),
  startsAt: ConfirmedInstantSchema.describe(
    'Confirmed ISO timestamp including Z or an explicit UTC offset.'
  ),
  endsAt: ConfirmedInstantSchema.nullable()
    .optional()
    .describe('Optional confirmed ISO end timestamp; omit when the source gives no end time.'),
  timeZone: timeZone.describe('IANA time zone governing this event, such as America/New_York.'),
  isAllDay: z.boolean().default(false).describe('Whether this is an all-day item.'),
  locationName: characterString(0, 160)
    .nullable()
    .optional()
    .describe('Optional confirmed venue or room name.'),
  locationAddress: characterString(0, 500)
    .nullable()
    .optional()
    .describe('Optional confirmed street address.'),
}

export const ListChildEventsInputSchema = z
  .object({
    parentEventId: z.uuid(),
    limit: z.number().int().min(1).max(50).default(20),
    cursor: z.string().max(128).optional(),
  })
  .strict()

export const CreateChildEventInputSchema = z
  .object({
    parentEventId: z.uuid(),
    idempotencyKey,
    ...childFields,
  })
  .strict()
  .refine(({ startsAt, endsAt }) => !endsAt || new Date(endsAt) >= new Date(startsAt), {
    path: ['endsAt'],
    message: 'The event end must be after its start.',
  })

// Updates must not apply creation defaults to fields the caller omitted.
const childUpdateFields = z
  .object({
    ...childFields,
    category: childFields.category.removeDefault().describe(childFields.category.description!),
    purpose: childFields.purpose.removeDefault().describe(childFields.purpose.description!),
    isAllDay: childFields.isAllDay.removeDefault().describe(childFields.isAllDay.description!),
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one child event field.')

export const UpdateChildEventInputSchema = z
  .object({
    parentEventId: z.uuid(),
    childEventId: z.uuid(),
    idempotencyKey,
    expectedVersion: z.number().int().positive(),
    changes: childUpdateFields,
  })
  .strict()

export const MCP_CHILD_EVENT_SCHEMAS = {
  list_child_events: ListChildEventsInputSchema,
  create_child_event: CreateChildEventInputSchema,
  update_child_event: UpdateChildEventInputSchema,
} as const

export type McpChildEventToolName = keyof typeof MCP_CHILD_EVENT_SCHEMAS

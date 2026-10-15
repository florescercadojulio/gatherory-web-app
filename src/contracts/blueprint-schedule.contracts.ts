import { z } from 'zod'
import {
  BlueprintContentHashSchema,
  BlueprintStableKeySchema,
  BLUEPRINT_LIMITS,
} from './blueprint-install.contracts'
import { ConfirmedInstantSchema } from './date-time.contracts'
import { TimeZoneNameSchema } from './content-primitives'
import { BlueprintShareTokenSchema } from './blueprint-sharing.contracts'

const mainScheduleSchema = z
  .object({ startsAt: ConfirmedInstantSchema, timeZone: TimeZoneNameSchema })
  .strict()
export const BlueprintScheduleInputSchema = z
  .object({
    catalogKey: BlueprintStableKeySchema,
    shareToken: BlueprintShareTokenSchema.optional(),
    revision: z.number().int().positive(),
    contentHash: BlueprintContentHashSchema,
    mainEvent: mainScheduleSchema,
  })
  .strict()

const localDateTimeSchema = z.iso
  .datetime({ local: true })
  .length(19)
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
const suggestionBase = { key: BlueprintStableKeySchema, localDateTime: localDateTimeSchema }
export const BlueprintScheduleSuggestionSchema = z.discriminatedUnion('status', [
  z
    .object({
      ...suggestionBase,
      status: z.literal('suggested'),
      candidates: z.array(ConfirmedInstantSchema).length(1),
    })
    .strict(),
  z
    .object({
      ...suggestionBase,
      status: z.literal('ambiguous'),
      candidates: z.array(ConfirmedInstantSchema).length(2),
    })
    .strict(),
  z
    .object({
      ...suggestionBase,
      status: z.literal('nonexistent'),
      candidates: z.array(ConfirmedInstantSchema).length(0),
    })
    .strict(),
  z
    .object({
      key: BlueprintStableKeySchema,
      localDateTime: z.null(),
      status: z.literal('manual'),
      candidates: z.array(ConfirmedInstantSchema).length(0),
    })
    .strict(),
])
export const BlueprintScheduleResponseSchema = BlueprintScheduleInputSchema.omit({
  shareToken: true,
})
  .extend({
    suggestions: z.array(BlueprintScheduleSuggestionSchema).max(BLUEPRINT_LIMITS.children),
  })
  .strict()

export type BlueprintScheduleInput = z.infer<typeof BlueprintScheduleInputSchema>
export type BlueprintScheduleResponse = z.infer<typeof BlueprintScheduleResponseSchema>
export type BlueprintScheduleSuggestion = z.infer<typeof BlueprintScheduleSuggestionSchema>

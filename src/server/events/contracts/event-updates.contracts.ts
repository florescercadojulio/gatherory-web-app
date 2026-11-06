import { z } from 'zod'
import { characterString } from '@/contracts/content-primitives'

const eventId = z.uuid().transform((value) => value.toLowerCase())
const version = z.number().int().positive()
const optionalText = (max: number) => characterString(0, max).nullable().optional()

export const CompleteTodoInputSchema = z
  .object({
    eventId,
    todoId: z.uuid().transform((value) => value.toLowerCase()),
    isCompleted: z.boolean(),
    expectedVersion: version,
  })
  .strict()

export const CreateEventNoteInputSchema = z
  .object({
    eventId,
    /** UUID reused for an exact retry; also serves as the immutable note ID. */
    idempotencyKey: z.uuid().transform((value) => value.toLowerCase()),
    body: characterString(1, 750),
  })
  .strict()

export const UpdateEventDetailsInputSchema = z
  .object({
    eventId,
    expectedVersion: version,
    changes: z
      .object({
        title: characterString(1, 120).optional(),
        description: optionalText(2_000),
        locationName: optionalText(160),
      })
      .strict()
      .refine(
        (changes) => Object.keys(changes).length > 0,
        'Provide at least one field to update.'
      ),
  })
  .strict()

export type CompleteTodoInput = z.infer<typeof CompleteTodoInputSchema>
export type CreateEventNoteInput = z.infer<typeof CreateEventNoteInputSchema>
export type UpdateEventDetailsInput = z.infer<typeof UpdateEventDetailsInputSchema>

export type EventUpdateResult = {
  eventId: string
  version: number
  changes: {
    title?: string
    description?: string | null
    locationName?: string | null
  }
}

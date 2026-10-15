import { z } from 'zod'

import type { BlueprintDraftContent } from './blueprint-authoring.contracts'
import {
  BlueprintChildCategorySchema,
  BlueprintIdeaCategorySchema,
} from './blueprint-install.contracts'
import { ConfirmedInstantSchema } from './date-time.contracts'
import {
  characterString,
  OpaqueIdentifierSchema,
  TimeZoneNameSchema,
  UUIDSchema,
} from './content-primitives'

const uniqueUuidArray = (max: number) =>
  z
    .array(UUIDSchema)
    .max(max)
    .superRefine((ids, context) => {
      if (new Set(ids).size !== ids.length) {
        context.addIssue({ code: 'custom', message: 'IDs must be unique.' })
      }
    })

export const BlueprintCaptureSelectionSchema = z
  .object({
    childIds: uniqueUuidArray(50),
    ideaIds: uniqueUuidArray(100),
    instructionIds: uniqueUuidArray(30),
    includeIdeaNotes: z.boolean().default(false),
  })
  .strict()

export type BlueprintCaptureSelection = z.infer<typeof BlueprintCaptureSelectionSchema>

export const BlueprintEventCaptureSourceSchema = z
  .object({
    event: z
      .object({
        id: UUIDSchema,
        title: characterString(1, 120),
        startsAt: ConfirmedInstantSchema.nullable(),
        timeZone: TimeZoneNameSchema,
        experienceType: z.enum(['wedding', 'birthday', 'holiday', 'custom']),
      })
      .strict(),
    children: z
      .array(
        z
          .object({
            id: UUIDSchema,
            title: characterString(1, 120),
            purpose: z.enum(['planning_scouting', 'part_of_event']),
            category: BlueprintChildCategorySchema,
            startsAt: ConfirmedInstantSchema.nullable(),
          })
          .strict()
      )
      .max(50),
    ideas: z
      .array(
        z
          .object({
            id: UUIDSchema,
            eventId: UUIDSchema,
            title: characterString(1, 120),
            category: BlueprintIdeaCategorySchema,
            notes: characterString(0, 2_000).nullable(),
          })
          .strict()
      )
      .max(100),
    instructions: z
      .array(
        z
          .object({
            id: UUIDSchema,
            eventId: UUIDSchema,
            title: characterString(1, 120),
            body: characterString(1, 5_000),
            audience: z.enum(['planning_only', 'event_participants']),
          })
          .strict()
      )
      .max(30),
  })
  .strict()
  .superRefine((source, context) => {
    const ids = [
      source.event.id,
      ...source.children.map(({ id }) => id),
      ...source.ideas.map(({ id }) => id),
      ...source.instructions.map(({ id }) => id),
    ]
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: 'custom', message: 'Source record IDs must be unique.' })
    }

    const validEventIds = new Set([source.event.id, ...source.children.map(({ id }) => id)])
    for (const [group, records] of [
      ['ideas', source.ideas],
      ['instructions', source.instructions],
    ] as const) {
      records.forEach((record, index) => {
        if (!validEventIds.has(record.eventId)) {
          context.addIssue({
            code: 'custom',
            message: `${group} must target the main event or one of its children.`,
            path: [group, index, 'eventId'],
          })
        }
      })
    }
  })

export type BlueprintEventCaptureSource = z.infer<typeof BlueprintEventCaptureSourceSchema>

export const BlueprintCaptureSourceInputSchema = z.object({ eventId: UUIDSchema }).strict()

export const BlueprintCapturePreviewInputSchema = z
  .object({
    eventId: UUIDSchema,
    selection: BlueprintCaptureSelectionSchema,
    expectedSourceHash: z
      .string()
      .length(64)
      .regex(/^[0-9a-f]{64}$/),
    templateId: UUIDSchema.optional(),
    name: characterString(1, 120).optional(),
  })
  .strict()

export const BlueprintCaptureSaveInputSchema = BlueprintCapturePreviewInputSchema.extend({
  requestId: UUIDSchema,
  organizationId: OpaqueIdentifierSchema,
  expectedVersion: z.number().int().positive().optional(),
})
  .strict()
  .superRefine((input, context) => {
    if (input.templateId && input.expectedVersion === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'expectedVersion is required when refreshing a template.',
        path: ['expectedVersion'],
      })
    } else if (!input.templateId && input.expectedVersion !== undefined) {
      context.addIssue({
        code: 'custom',
        message: 'expectedVersion is only valid when refreshing a template.',
        path: ['expectedVersion'],
      })
    }
  })

export type BlueprintCaptureMetadata = {
  kind: 'event'
  eventId: string
  selection: BlueprintCaptureSelection
  capturedContent: BlueprintDraftContent
  requestId?: string
  requestHash?: string
  /** Binds native publication visibility as well as the captured content. */
  nativeCreationRequestHash?: string
}

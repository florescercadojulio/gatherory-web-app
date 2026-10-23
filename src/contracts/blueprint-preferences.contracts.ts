import { z } from 'zod'
import { SchemaUrlSchema, StableKeySchema, UUIDSchema } from './content-primitives'

export const BlueprintPreferenceKindSchema = z.enum(['like', 'bookmark', 'notInterested'])

export const BlueprintPreferenceMutationSchema = z
  .object({
    requestId: UUIDSchema,
    catalogKey: StableKeySchema,
    revision: z.number().int().positive(),
    contentHash: z
      .string()
      .length(64)
      .regex(/^[a-f0-9]{64}$/),
    kind: BlueprintPreferenceKindSchema,
    enabled: z.boolean(),
  })
  .strict()

export const BlueprintPreferenceStateSchema = z.object({
  catalogKey: StableKeySchema,
  revision: z.number().int().positive(),
  contentHash: z
    .string()
    .length(64)
    .regex(/^[a-f0-9]{64}$/),
  liked: z.boolean(),
  bookmarked: z.boolean(),
  notInterested: z.boolean(),
})

export const BlueprintPreferenceEntrySchema = z.object({
  catalogKey: StableKeySchema,
  revision: z.number().int().positive(),
  contentHash: z
    .string()
    .length(64)
    .regex(/^[a-f0-9]{64}$/),
  name: z.string().min(1).max(120),
  coverImageURL: SchemaUrlSchema.optional(),
  creatorName: z.string().min(1).max(80).optional(),
})

export const BlueprintPreferenceListItemSchema = BlueprintPreferenceStateSchema.extend({
  // A preference can point at a different publication revision for each kind.
  // Keep the original binding so each action can be removed independently.
  likeRevision: z.number().int().positive().nullable().optional(),
  likeContentHash: z
    .string()
    .length(64)
    .regex(/^[a-f0-9]{64}$/)
    .nullable()
    .optional(),
  bookmarkRevision: z.number().int().positive().nullable().optional(),
  bookmarkContentHash: z
    .string()
    .length(64)
    .regex(/^[a-f0-9]{64}$/)
    .nullable()
    .optional(),
  notInterestedRevision: z.number().int().positive().nullable().optional(),
  notInterestedContentHash: z
    .string()
    .length(64)
    .regex(/^[a-f0-9]{64}$/)
    .nullable()
    .optional(),
  likeAvailability: z.enum(['available', 'unavailable']).optional(),
  bookmarkAvailability: z.enum(['available', 'unavailable']),
  notInterestedAvailability: z.enum(['available', 'unavailable']).optional(),
  entry: BlueprintPreferenceEntrySchema.optional(),
})

export const BlueprintPreferenceListRequestSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z.string().min(1).max(2048).optional(),
  })
  .strict()

export const BlueprintPreferenceListResponseSchema = z.object({
  items: z.array(BlueprintPreferenceListItemSchema),
  nextCursor: z.string().min(1).max(2048).optional(),
})

export const BlueprintPreferenceMutationResponseSchema = BlueprintPreferenceStateSchema.extend({
  requestId: UUIDSchema,
})

export type BlueprintPreferenceKind = z.infer<typeof BlueprintPreferenceKindSchema>
export type BlueprintPreferenceMutation = z.infer<typeof BlueprintPreferenceMutationSchema>
export type BlueprintPreferenceState = z.infer<typeof BlueprintPreferenceStateSchema>

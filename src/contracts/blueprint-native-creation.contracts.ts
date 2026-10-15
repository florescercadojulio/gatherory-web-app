import { z } from 'zod'
import {
  BlueprintCaptureSelectionSchema,
  BlueprintEventCaptureSourceSchema,
} from './blueprint-capture.contracts'
import { BlueprintDraftContentSchema } from './blueprint-authoring.contracts'
import { OpaqueIdentifierSchema, UUIDSchema, characterString } from './content-primitives'

const Sha256Schema = z
  .string()
  .length(64)
  .regex(/^[0-9a-f]{64}$/)
const NameSchema = characterString(1, 120)
const NativeUuidSchema = UUIDSchema.transform((id) => id.toLowerCase())
const NativeSelectionSchema = BlueprintCaptureSelectionSchema.transform((selection) => ({
  ...selection,
  childIds: selection.childIds.map((id) => id.toLowerCase()),
  ideaIds: selection.ideaIds.map((id) => id.toLowerCase()),
  instructionIds: selection.instructionIds.map((id) => id.toLowerCase()),
}))

export const BlueprintNativeCreationSourceRequestSchema = z
  .object({ action: z.literal('source'), eventId: NativeUuidSchema })
  .strict()
export const BlueprintNativeCreationReviewRequestSchema = z
  .object({
    action: z.literal('review'),
    eventId: NativeUuidSchema,
    selection: NativeSelectionSchema,
    expectedSourceHash: Sha256Schema,
    name: NameSchema,
    discoverable: z.boolean().default(false),
  })
  .strict()
export const BlueprintNativeCreationCreateRequestSchema = z
  .object({
    action: z.literal('create'),
    eventId: NativeUuidSchema,
    selection: NativeSelectionSchema,
    expectedSourceHash: Sha256Schema,
    name: NameSchema,
    // Older clients selected an owned destination. New native clients omit it.
    organizationId: OpaqueIdentifierSchema.optional(),
    requestId: NativeUuidSchema,
    expectedReviewHash: Sha256Schema,
    discoverable: z.boolean().default(false),
  })
  .strict()
export const BlueprintNativeCreationWorkspaceRequestSchema = z
  .object({ action: z.literal('workspace'), eventId: NativeUuidSchema })
  .strict()

export const BlueprintNativeCreationRequestSchema = z.discriminatedUnion('action', [
  BlueprintNativeCreationSourceRequestSchema,
  BlueprintNativeCreationReviewRequestSchema,
  BlueprintNativeCreationCreateRequestSchema,
  BlueprintNativeCreationWorkspaceRequestSchema,
])

export const BlueprintNativeCreationWorkspaceSchema = z
  .object({ id: OpaqueIdentifierSchema, name: characterString(1, 160), personal: z.boolean() })
  .strict()
export const BlueprintNativeCreationSourceResponseSchema = z
  .object({
    source: BlueprintEventCaptureSourceSchema,
    sourceHash: Sha256Schema,
    workspaces: z.array(BlueprintNativeCreationWorkspaceSchema),
  })
  .strict()
export const BlueprintNativeCreationReviewResponseSchema = z
  .object({
    content: BlueprintDraftContentSchema,
    sourceHash: Sha256Schema,
    reviewHash: Sha256Schema,
    discoverable: z.boolean().optional(),
  })
  .strict()
export const BlueprintNativeCreationResultResponseSchema = z
  .object({ templateId: UUIDSchema, revision: z.number().int().positive() })
  .strict()
export const BlueprintNativeCreationWorkspaceResponseSchema = z
  .object({ workspaces: z.array(BlueprintNativeCreationWorkspaceSchema) })
  .strict()
export const BlueprintNativeCreationResponseSchema = z.union([
  BlueprintNativeCreationSourceResponseSchema,
  BlueprintNativeCreationReviewResponseSchema,
  BlueprintNativeCreationResultResponseSchema,
  BlueprintNativeCreationWorkspaceResponseSchema,
])

export type BlueprintNativeCreationRequest = z.infer<typeof BlueprintNativeCreationRequestSchema>
export type BlueprintNativeCreationSourceRequest = z.infer<
  typeof BlueprintNativeCreationSourceRequestSchema
>
export type BlueprintNativeCreationReviewRequest = z.infer<
  typeof BlueprintNativeCreationReviewRequestSchema
>
export type BlueprintNativeCreationCreateRequest = z.infer<
  typeof BlueprintNativeCreationCreateRequestSchema
>
export type BlueprintNativeCreationWorkspaceRequest = z.infer<
  typeof BlueprintNativeCreationWorkspaceRequestSchema
>
export type BlueprintNativeCreationSourceResponse = z.infer<
  typeof BlueprintNativeCreationSourceResponseSchema
>
export type BlueprintNativeCreationReviewResponse = z.infer<
  typeof BlueprintNativeCreationReviewResponseSchema
>
export type BlueprintNativeCreationResultResponse = z.infer<
  typeof BlueprintNativeCreationResultResponseSchema
>
export type BlueprintNativeCreationWorkspaceResponse = z.infer<
  typeof BlueprintNativeCreationWorkspaceResponseSchema
>
export type BlueprintNativeCreationResponse = z.infer<typeof BlueprintNativeCreationResponseSchema>

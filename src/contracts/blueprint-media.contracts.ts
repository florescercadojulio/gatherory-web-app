import { z } from 'zod'

export const BLUEPRINT_COVER_MAX_BYTES = 20 * 1024 * 1024

export const BlueprintCoverVariantSchema = z.enum(['thumbnail', 'card', 'hero'])
export type BlueprintCoverVariant = z.infer<typeof BlueprintCoverVariantSchema>

export const PrepareBlueprintCoverUploadInputSchema = z.object({
  mediaAssetId: z.uuid().transform((value) => value.toLowerCase()),
  contentType: z.literal('image/jpeg'),
  byteSize: z.number().int().positive().max(BLUEPRINT_COVER_MAX_BYTES),
  originalFilename: z.string().trim().min(1).max(255),
})

export const FinalizeBlueprintCoverUploadInputSchema = z.object({
  mediaAssetId: z.uuid().transform((value) => value.toLowerCase()),
})

export const GetBlueprintCoverUrlInputSchema = z
  .object({
    mediaAssetId: z.uuid().transform((value) => value.toLowerCase()),
    catalogKey: z.string().trim().min(1).max(100).optional(),
    revision: z.number().int().positive().optional(),
    shareToken: z.string().min(20).max(200).optional(),
    variant: BlueprintCoverVariantSchema.default('hero'),
  })
  .refine((input) => (input.catalogKey === undefined) === (input.revision === undefined), {
    message: 'catalogKey and revision must be provided together',
  })

export type PrepareBlueprintCoverUploadInput = z.infer<
  typeof PrepareBlueprintCoverUploadInputSchema
>
export type FinalizeBlueprintCoverUploadInput = z.infer<
  typeof FinalizeBlueprintCoverUploadInputSchema
>
export type GetBlueprintCoverUrlInput = z.infer<typeof GetBlueprintCoverUrlInputSchema>

export type BlueprintCoverUploadReceipt = {
  mediaAssetId: string
  uploadUrl: string
  method: 'PUT'
  requiredHeaders: Record<string, string>
  expiresAt: string
}

export type BlueprintCoverReadyReceipt = {
  mediaAssetId: string
  status: 'ready'
  url: string
  width: number
  height: number
  variants: Record<BlueprintCoverVariant, { width: number; height: number }>
}

export type BlueprintCoverUrlReceipt = {
  mediaAssetId: string
  url: string
  variant: BlueprintCoverVariant
  expiresAt: string
}

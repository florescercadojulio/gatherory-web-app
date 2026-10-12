import { z } from "zod"

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024

// Foundation's JSONEncoder serializes UUID values in uppercase. PostgreSQL
// returns uuid columns in lowercase, so native media must canonicalize ids at
// the boundary before using them in both R2 object metadata and persistence.
const nativeUUIDSchema = z.uuid().transform((value) => value.toLowerCase())

export const supportedImageContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const

export const PrepareEventMediaUploadInputSchema = z.object({
  eventId: z.uuid(),
  originalFilename: z.string().trim().min(1).max(255),
  displayName: z.string().trim().min(1).max(120).optional(),
  contentType: z.enum(supportedImageContentTypes),
  byteSize: z.number().int().positive().max(MAX_IMAGE_BYTES),
  role: z.enum(["cover", "background", "gallery"]),
})

export type PrepareEventMediaUploadInput = z.infer<
  typeof PrepareEventMediaUploadInputSchema
>

export const FinalizeEventMediaUploadInputSchema = z.object({
  mediaAssetId: z.uuid(),
})

export type FinalizeEventMediaUploadInput = z.infer<
  typeof FinalizeEventMediaUploadInputSchema
>

export const GetEventMediaUrlInputSchema = z.object({
  mediaAssetId: z.uuid(),
})

/**
 * Native clients upload bytes independently from their JSON replication
 * envelopes. The client-generated asset id makes retries idempotent: asking
 * for another signed URL never creates a second R2 object or metadata row.
 */
export const PrepareNativeMediaUploadInputSchema = z.object({
  scopeId: nativeUUIDSchema,
  mediaAssetId: nativeUUIDSchema,
  originalFilename: z.string().trim().min(1).max(255),
  contentType: z.enum(supportedImageContentTypes),
  byteSize: z.number().int().positive().max(MAX_IMAGE_BYTES),
})

export type PrepareNativeMediaUploadInput = z.infer<
  typeof PrepareNativeMediaUploadInputSchema
>

export const NativeMediaAssetInputSchema = z.object({
  mediaAssetId: nativeUUIDSchema,
})

export type NativeMediaAssetInput = z.infer<
  typeof NativeMediaAssetInputSchema
>

import { z } from "zod"

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024

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

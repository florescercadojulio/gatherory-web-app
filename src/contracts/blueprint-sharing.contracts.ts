import { z } from 'zod'
import { UUIDSchema } from './content-primitives'

/** A bearer credential, never a catalog/discovery key. */
export const BlueprintShareTokenSchema = z
  .string()
  .length(64)
  .regex(/^[0-9a-f]{64}$/)
export const BlueprintShareListInputSchema = z.object({ templateId: UUIDSchema }).strict()
export const BlueprintShareCreateInputSchema = BlueprintShareListInputSchema.extend({
  revision: z.number().int().positive(),
}).strict()
export const BlueprintShareRevokeInputSchema = BlueprintShareListInputSchema.extend({
  linkId: UUIDSchema,
}).strict()
export const BlueprintShareResolveInputSchema = z
  .object({ token: BlueprintShareTokenSchema })
  .strict()
export type BlueprintShareCreateInput = z.infer<typeof BlueprintShareCreateInputSchema>
export type BlueprintShareRevokeInput = z.infer<typeof BlueprintShareRevokeInputSchema>
export type BlueprintShareLink = {
  id: string
  revision: number
  createdAt: string
  revokedAt: string | null
}

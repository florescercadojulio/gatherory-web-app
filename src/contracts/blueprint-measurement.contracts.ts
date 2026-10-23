import { z } from 'zod'
import { UUIDSchema } from './content-primitives'

export const BlueprintMeasurementSettingsSchema = z.object({ enabled: z.boolean() })

export const BlueprintMeasurementSettingsMutationSchema = z
  .object({ requestId: UUIDSchema, enabled: z.boolean() })
  .strict()

export const BlueprintMeasurementSignalSchema = z
  .object({
    requestId: UUIDSchema,
    exposureId: UUIDSchema,
    kind: z.enum(['impression', 'open']),
  })
  .strict()

export const BlueprintDiscoveryContextSchema = z.object({
  exposureId: UUIDSchema,
  expiresAt: z.iso.datetime().min(20).max(40),
})

export type BlueprintMeasurementSignal = z.infer<typeof BlueprintMeasurementSignalSchema>

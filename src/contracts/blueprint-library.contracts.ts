import { z } from 'zod'
import { characterString, UUIDSchema } from './content-primitives'
import { BlueprintStableKeySchema } from './blueprint-install.contracts'

export const BlueprintLibraryInstallationSchema = z
  .object({
    installationID: UUIDSchema,
    scopeID: UUIDSchema,
    catalogKey: BlueprintStableKeySchema,
    revision: z.number().int().positive(),
    templateName: characterString(1, 160),
    eventName: characterString(1, 120),
    installedAt: z.iso.datetime().max(29),
  })
  .strict()

export const BlueprintLibraryResponseSchema = z
  .object({
    installations: z.array(BlueprintLibraryInstallationSchema).max(200),
  })
  .strict()

export type BlueprintLibraryInstallation = z.infer<typeof BlueprintLibraryInstallationSchema>
export type BlueprintLibraryResponse = z.infer<typeof BlueprintLibraryResponseSchema>

import { z } from 'zod'

export const SaveAppleTokenInput = z
  .object({
    authorizationCode: z.string().min(1).max(4096),
  })
  .strict()

export type SaveAppleTokenInput = z.infer<typeof SaveAppleTokenInput>

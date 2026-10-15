import { z } from 'zod'
import { characterString, UUIDSchema } from './content-primitives'
import { BlueprintShareTokenSchema } from './blueprint-sharing.contracts'

const eventScope = { eventId: UUIDSchema }
const templateScope = { ...eventScope, templateId: UUIDSchema }

/** Native commands carry an explicit source event, never activeOrganizationId. */
export const BlueprintLinkManagementInputSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('templates'), ...eventScope }).strict(),
  z.object({ action: z.literal('list'), ...templateScope }).strict(),
  z
    .object({
      action: z.literal('create'),
      ...templateScope,
      revision: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      action: z.literal('listing'),
      ...templateScope,
      revision: z.number().int().positive().nullable(),
    })
    .strict(),
  z.object({ action: z.literal('revoke'), ...templateScope, linkId: UUIDSchema }).strict(),
])
export const BlueprintManagedTemplateSchema = z
  .object({
    id: UUIDSchema,
    title: characterString(1, 120),
    publishedRevision: z.number().int().positive().nullable(),
    listedRevision: z.number().int().positive().nullable().optional(),
    retired: z.boolean(),
  })
  .strict()
export const BlueprintManagedShareLinkSchema = z
  .object({
    id: UUIDSchema,
    revision: z.number().int().positive(),
    createdAt: z.iso.datetime().max(40),
    revokedAt: z.iso.datetime().max(40).nullable(),
  })
  .strict()
export const BlueprintLinkManagementResponseSchema = z.union([
  z.object({ templates: z.array(BlueprintManagedTemplateSchema) }).strict(),
  z.object({ links: z.array(BlueprintManagedShareLinkSchema) }).strict(),
  z.object({ link: BlueprintManagedShareLinkSchema, token: BlueprintShareTokenSchema }).strict(),
  z.object({ revoked: z.literal(true) }).strict(),
  z.object({ listedRevision: z.number().int().positive().nullable() }).strict(),
])
export type BlueprintLinkManagementInput = z.infer<typeof BlueprintLinkManagementInputSchema>
export type BlueprintLinkManagementResponse = z.infer<typeof BlueprintLinkManagementResponseSchema>
export type BlueprintManagedTemplate = z.infer<typeof BlueprintManagedTemplateSchema>

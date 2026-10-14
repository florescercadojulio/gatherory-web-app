import { z } from 'zod'

const stableKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9_]*$/)

const permissionSchema = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/)

const moduleConfigurationSchema = z.record(z.string(), z.unknown())

export const ExperienceModuleSchema = z.object({
  key: stableKeySchema,
  type: stableKeySchema,
  version: z.number().int().positive(),
  required: z.boolean().default(false),
  config: moduleConfigurationSchema,
})

export const ExperienceBlueprintSchema = z
  .object({
    $schema: z.url(),
    kind: z.literal('experience_blueprint'),
    schemaVersion: z.literal(1),
    blueprint: z.object({
      id: z.string().trim().min(1).max(160),
      revision: z.number().int().positive(),
      name: z.string().trim().min(1).max(160),
    }),
    experienceDefaults: z.object({
      type: stableKeySchema,
      timeZone: z.string().trim().min(1).max(100).optional(),
    }),
    roles: z
      .array(
        z.object({
          key: stableKeySchema,
          permissions: z.array(permissionSchema).max(100),
        })
      )
      .max(50),
    modules: z.array(ExperienceModuleSchema).max(100),
    presentation: z
      .object({
        theme: stableKeySchema.optional(),
        coverAssetId: z.uuid().nullable().optional(),
        moduleOrder: z.array(stableKeySchema).max(100).optional(),
      })
      .optional(),
  })
  .superRefine((blueprint, context) => {
    reportDuplicateKeys(
      blueprint.roles.map((role) => role.key),
      'roles',
      context
    )
    reportDuplicateKeys(
      blueprint.modules.map((module) => module.key),
      'modules',
      context
    )

    const moduleKeys = new Set(blueprint.modules.map((module) => module.key))
    blueprint.presentation?.moduleOrder?.forEach((key, index) => {
      if (moduleKeys.has(key)) return
      context.addIssue({
        code: 'custom',
        message: `Unknown module key: ${key}`,
        path: ['presentation', 'moduleOrder', index],
      })
    })
  })

export const ContributionVisibilitySchema = z.discriminatedUnion('scope', [
  z.object({ scope: z.literal('author_only') }),
  z.object({
    scope: z.literal('participant_group'),
    groupId: z.string().trim().min(1).max(160),
  }),
  z.object({ scope: z.literal('experience_participants') }),
  z.object({ scope: z.literal('experience_managers') }),
  z.object({ scope: z.literal('resource_community') }),
  z.object({ scope: z.literal('external_public') }),
])

const moneySchema = z.object({
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
})

export const ServicePackageSchema = z
  .object({
    $schema: z.url(),
    kind: z.literal('service_package'),
    schemaVersion: z.literal(1),
    id: z.string().trim().min(1).max(160),
    revision: z.number().int().positive(),
    businessId: z.string().trim().min(1).max(160),
    name: z.string().trim().min(1).max(160),
    blueprint: z.object({
      id: z.string().trim().min(1).max(160),
      revision: z.number().int().positive(),
    }),
    destination: z
      .object({
        countryCode: z.string().regex(/^[A-Z]{2}$/),
        region: z.string().trim().min(1).max(160).optional(),
        city: z.string().trim().min(1).max(160).optional(),
        timeZone: z.string().trim().min(1).max(100),
      })
      .optional(),
    capacity: z
      .object({
        minimumGuests: z.number().int().nonnegative().optional(),
        includedGuests: z.number().int().nonnegative().optional(),
        maximumGuests: z.number().int().positive().optional(),
      })
      .optional(),
    pricing: z.object({
      starting: moneySchema,
      model: z.enum(['fixed', 'starting_at', 'base_plus_guest', 'custom_quote']),
      additionalGuest: moneySchema.optional(),
    }),
    includedServices: z.array(
      z.object({
        serviceId: z.string().trim().min(1).max(160),
        quantity: z.number().positive(),
        unit: z.string().trim().min(1).max(60).optional(),
        required: z.boolean(),
      })
    ),
    addOns: z.array(
      z.object({
        serviceId: z.string().trim().min(1).max(160),
        starting: moneySchema.optional(),
      })
    ),
  })
  .superRefine((servicePackage, context) => {
    const capacity = servicePackage.capacity
    if (
      capacity?.minimumGuests != null &&
      capacity.maximumGuests != null &&
      capacity.minimumGuests > capacity.maximumGuests
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Minimum guest capacity cannot exceed the maximum.',
        path: ['capacity', 'minimumGuests'],
      })
    }
    if (
      capacity?.includedGuests != null &&
      ((capacity.minimumGuests != null && capacity.includedGuests < capacity.minimumGuests) ||
        (capacity.maximumGuests != null && capacity.includedGuests > capacity.maximumGuests))
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Included guests must fit within the package capacity.',
        path: ['capacity', 'includedGuests'],
      })
    }

    const perGuest = servicePackage.pricing.additionalGuest
    if (servicePackage.pricing.model === 'base_plus_guest' && !perGuest) {
      context.addIssue({
        code: 'custom',
        message: 'Base-plus-guest pricing requires an additional guest price.',
        path: ['pricing', 'additionalGuest'],
      })
    }
    if (
      perGuest?.currency !== undefined &&
      perGuest.currency !== servicePackage.pricing.starting.currency
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Package prices must use one currency.',
        path: ['pricing', 'additionalGuest', 'currency'],
      })
    }
  })

export type ExperienceBlueprint = z.infer<typeof ExperienceBlueprintSchema>
export type ExperienceModule = z.infer<typeof ExperienceModuleSchema>
export type ContributionVisibility = z.infer<typeof ContributionVisibilitySchema>
export type ServicePackage = z.infer<typeof ServicePackageSchema>

function reportDuplicateKeys(keys: string[], path: 'roles' | 'modules', context: z.RefinementCtx) {
  const seen = new Set<string>()
  keys.forEach((key, index) => {
    if (!seen.has(key)) {
      seen.add(key)
      return
    }
    context.addIssue({
      code: 'custom',
      message: `Duplicate ${path} key: ${key}`,
      path: [path, index, 'key'],
    })
  })
}

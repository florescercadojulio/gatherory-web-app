import { z } from 'zod'
import {
  characterString,
  ContentNameSchema,
  ModuleConfigurationSchema,
  MoneySchema,
  OpaqueIdentifierSchema,
  PermissionKeySchema,
  SchemaUrlSchema,
  StableKeySchema,
  TimeZoneNameSchema,
  UUIDSchema,
} from './content-primitives'

export const ExperienceModuleSchema = z.object({
  key: StableKeySchema,
  type: StableKeySchema,
  version: z.number().int().positive(),
  required: z.boolean().default(false),
  config: ModuleConfigurationSchema,
})

export const ExperienceBlueprintSchema = z
  .object({
    $schema: SchemaUrlSchema,
    kind: z.literal('experience_blueprint'),
    schemaVersion: z.literal(1),
    blueprint: z.object({
      id: OpaqueIdentifierSchema,
      revision: z.number().int().positive(),
      name: ContentNameSchema,
    }),
    experienceDefaults: z.object({
      type: StableKeySchema,
      timeZone: TimeZoneNameSchema.optional(),
    }),
    roles: z
      .array(
        z.object({
          key: StableKeySchema,
          permissions: z.array(PermissionKeySchema).max(100),
        })
      )
      .max(50),
    modules: z.array(ExperienceModuleSchema).max(100),
    presentation: z
      .object({
        theme: StableKeySchema.optional(),
        coverAssetId: UUIDSchema.nullable().optional(),
        moduleOrder: z.array(StableKeySchema).max(100).optional(),
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
    groupId: OpaqueIdentifierSchema,
  }),
  z.object({ scope: z.literal('experience_participants') }),
  z.object({ scope: z.literal('experience_managers') }),
  z.object({ scope: z.literal('resource_community') }),
  z.object({ scope: z.literal('external_public') }),
])

export const ServicePackageSchema = z
  .object({
    $schema: SchemaUrlSchema,
    kind: z.literal('service_package'),
    schemaVersion: z.literal(1),
    id: OpaqueIdentifierSchema,
    revision: z.number().int().positive(),
    businessId: OpaqueIdentifierSchema,
    name: ContentNameSchema,
    blueprint: z.object({
      id: OpaqueIdentifierSchema,
      revision: z.number().int().positive(),
    }),
    destination: z
      .object({
        countryCode: z
          .string()
          .length(2)
          .regex(/^[A-Z]{2}$/),
        region: ContentNameSchema.optional(),
        city: ContentNameSchema.optional(),
        timeZone: TimeZoneNameSchema,
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
      starting: MoneySchema,
      model: z.enum(['fixed', 'starting_at', 'base_plus_guest', 'custom_quote']),
      additionalGuest: MoneySchema.optional(),
    }),
    includedServices: z.array(
      z.object({
        serviceId: OpaqueIdentifierSchema,
        quantity: z.number().positive(),
        unit: characterString(1, 60).optional(),
        required: z.boolean(),
      })
    ),
    addOns: z.array(
      z.object({
        serviceId: OpaqueIdentifierSchema,
        starting: MoneySchema.optional(),
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

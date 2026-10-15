import { z } from 'zod'

/** Unicode code points, matching JSON Schema; not bytes, UTF-16 units or graphemes. */
export function characterString(minChars: number, maxChars: number, trim = true) {
  const schema = trim ? z.string().trim() : z.string()
  return characterLimits(schema, minChars, maxChars, trim)
}

function characterLimits<T extends z.ZodType<string>>(
  schema: T,
  minChars: number,
  maxChars: number,
  trim = false
) {
  return schema
    .superRefine((value, context) => {
      const chars = Array.from(value).length
      if (chars < minChars || chars > maxChars) {
        context.addIssue({
          code: 'custom',
          message: `Expected ${minChars}–${maxChars} Unicode characters.`,
        })
      }
    })
    .meta({
      minLength: minChars,
      maxLength: maxChars,
      description: `${minChars}–${maxChars} Unicode code points${trim ? '; surrounding whitespace is trimmed before validation' : ''}.`,
    })
}

export const CONTENT_LIMITS = {
  identifierChars: 160,
  nameChars: 160,
  stableKeyChars: 100,
  permissionChars: 120,
  timeZoneChars: 100,
  schemaUrlChars: 2_048,
  configurationStringChars: 5_000,
  amountMinorDigits: 20,
} as const

export const StableKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(CONTENT_LIMITS.stableKeyChars)
  .regex(/^[a-z][a-z0-9_]*$/)
export const PermissionKeySchema = z
  .string()
  .trim()
  .min(3)
  .max(CONTENT_LIMITS.permissionChars)
  .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/)
export const OpaqueIdentifierSchema = characterString(1, CONTENT_LIMITS.identifierChars)
export const ContentNameSchema = characterString(1, CONTENT_LIMITS.nameChars)
export const TimeZoneNameSchema = characterString(1, CONTENT_LIMITS.timeZoneChars)
export const SchemaUrlSchema = characterLimits(z.url(), 1, CONTENT_LIMITS.schemaUrlChars)
export const UUIDSchema = z.uuid().length(36)

/** Nonnegative prices. Signed adjustments/refunds need their own explicit contract. */
export const MoneySchema = z
  .object({
    amountMinor: z
      .string()
      .min(1)
      .max(CONTENT_LIMITS.amountMinorDigits)
      .regex(/^(0|[1-9][0-9]*)$(?![\s\S])/)
      .meta({
        description:
          'Nonnegative integer minor units as a canonical digit string. Never a decimal amount or JSON number. Interpret using the currency exponent.',
        examples: ['0', '1', '100', '10000'],
      }),
    currency: z
      .string()
      .length(3)
      .regex(/^[A-Z]{3}$/)
      .describe(
        'Uppercase ISO 4217 currency code. Shape validation only; operations must validate supported currencies.'
      ),
  })
  .strict()

type ConfigurationValue =
  string | number | boolean | null | ConfigurationValue[] | { [key: string]: ConfigurationValue }

// Unknown optional modules remain portable JSON, but cannot bypass string limits.
const configurationValueSchema: z.ZodType<ConfigurationValue> = z.lazy(() =>
  z.union([
    characterString(0, CONTENT_LIMITS.configurationStringChars, false),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(configurationValueSchema),
    z.record(characterString(1, CONTENT_LIMITS.identifierChars, false), configurationValueSchema),
  ])
)

export const ModuleConfigurationSchema = z.record(
  characterString(1, CONTENT_LIMITS.identifierChars, false),
  configurationValueSchema
)

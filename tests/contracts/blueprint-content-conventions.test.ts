import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { z } from 'zod'
import {
  characterString,
  MoneySchema,
  ModuleConfigurationSchema,
} from '@/contracts/content-primitives'
import { BlueprintDiscoverySchema } from '@/contracts/blueprint-discovery.contracts'
import {
  BlueprintCatalogDefinitionSchema,
  BlueprintExecutableModuleSchema,
  BlueprintInstallInputSchema,
  BlueprintPlannedIdeaSchema,
  BlueprintPlannedInstructionSchema,
} from '@/contracts/blueprint-install.contracts'
import { ExperienceBlueprintSchema, ServicePackageSchema } from '@/contracts/experience.contracts'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'

const textCases: [string, z.ZodType<string>, number, number][] = [
  ['blueprint name', ExperienceBlueprintSchema.shape.blueprint.shape.name, 1, 160],
  ['event name', BlueprintInstallInputSchema.shape.mainEvent.shape.name, 1, 120],
  ['idea title', BlueprintPlannedIdeaSchema.shape.title, 1, 120],
  ['idea notes', BlueprintPlannedIdeaSchema.shape.notes.unwrap(), 0, 2_000],
  ['instruction body', BlueprintPlannedInstructionSchema.shape.body, 1, 5_000],
  ['discovery summary', BlueprintDiscoverySchema.shape.summary, 0, 500],
  ['discovery tag', BlueprintDiscoverySchema.shape.tags.element, 1, 100],
]

test.each(textCases)(
  '%s enforces exact Unicode character boundaries and exports them',
  (_, schema, min, max) => {
    expect(schema.safeParse('a'.repeat(min)).success).toBe(true)
    expect(schema.safeParse('😀'.repeat(max)).success).toBe(true)
    expect(schema.safeParse('a'.repeat(max + 1)).success).toBe(false)
    expect(schema.safeParse('😀'.repeat(max + 1)).success).toBe(false)
    if (min > 0) expect(schema.safeParse('').success).toBe(false)
    expect(z.toJSONSchema(schema)).toMatchObject({ minLength: min, maxLength: max })
  }
)

test('code points are not bytes, UTF-16 units, or grapheme clusters; trimming is explicit', () => {
  expect(characterString(1, 1).parse(' 😀 ')).toBe('😀')
  expect(characterString(1, 1).safeParse('e\u0301').success).toBe(false)
  expect(characterString(1, 1).safeParse('é').success).toBe(true)
  expect(characterString(1, 1).safeParse('  ').success).toBe(false)
  expect(characterString(0, 3, false).parse(' a ')).toBe(' a ')
})

test('opaque module content and property names have recursive character limits without trimming', () => {
  expect(ModuleConfigurationSchema.parse({ label: '  authored content  ' })).toEqual({
    label: '  authored content  ',
  })
  expect(
    ModuleConfigurationSchema.safeParse({ nested: [{ text: '😀'.repeat(5_000) }] }).success
  ).toBe(true)
  expect(
    ModuleConfigurationSchema.safeParse({ nested: [{ text: 'a'.repeat(5_001) }] }).success
  ).toBe(false)
  expect(ModuleConfigurationSchema.safeParse({ nested: { ['a'.repeat(161)]: true } }).success).toBe(
    false
  )
})

test('known executable modules cannot bypass their tighter limits through the opaque fallback', () => {
  const module = {
    key: 'ideas',
    type: 'ideas',
    version: 2,
    required: false,
    config: {
      categoryOrder: [],
      ideas: [
        {
          key: 'idea',
          title: 'x'.repeat(121),
          category: 'venue',
          target: { kind: 'main' },
          configuration: { version: 1 },
        },
      ],
    },
  }
  expect(BlueprintExecutableModuleSchema.safeParse(module).success).toBe(false)
  const schema = z.toJSONSchema(BlueprintExecutableModuleSchema)
  expect(schema.anyOf?.at(-1)).toMatchObject({
    not: {
      anyOf: expect.arrayContaining([
        {
          properties: { type: { const: 'ideas' }, version: { const: 2 } },
          required: ['type', 'version'],
        },
      ]),
    },
  })
  expect(BlueprintCatalogDefinitionSchema.parse(weddingBlueprintV1.definition)).toEqual(
    weddingBlueprintV1.definition
  )
})

test.each(['0', '1', '100', '10000', '100000', '9007199254740993', '9'.repeat(20)])(
  'money preserves exact minor-unit string %s',
  (amountMinor) => {
    expect(MoneySchema.parse({ amountMinor, currency: 'USD' })).toEqual({
      amountMinor,
      currency: 'USD',
    })
  }
)

test.each([
  '',
  '01',
  '-1',
  '+1',
  '1.00',
  '1e2',
  ' 100',
  '100 ',
  '100\n',
  '100\r\n',
  '１',
  '9'.repeat(21),
  100,
  null,
])('money rejects noncanonical amount %s', (amountMinor) => {
  expect(MoneySchema.safeParse({ amountMinor, currency: 'USD' }).success).toBe(false)
  const schema = z.toJSONSchema(MoneySchema.shape.amountMinor)
  if (typeof amountMinor === 'string' && amountMinor.length <= 20) {
    expect(new RegExp(schema.pattern!).test(amountMinor)).toBe(false)
  }
})

test('currency and the explicit money envelope are required; no ambiguous legacy amount field', () => {
  for (const currency of ['usd', 'US', 'USDD', 'U$D', '', null]) {
    expect(MoneySchema.safeParse({ amountMinor: '100', currency }).success).toBe(false)
  }
  expect(MoneySchema.safeParse({ amountMinor: '100' }).success).toBe(false)
  expect(MoneySchema.safeParse({ amount: '1.00', currency: 'USD' }).success).toBe(false)
  expect(
    MoneySchema.safeParse({ amountMinor: '100', amount: '1.00', currency: 'USD' }).success
  ).toBe(false)
})

test('every package price uses the new money contract, including optional add-ons', () => {
  const example = JSON.parse(
    readFileSync('contracts/examples/destination-wedding-package.v1.json', 'utf8')
  )
  expect(ServicePackageSchema.safeParse(example).success).toBe(true)
  for (const branch of ['starting', 'additionalGuest', 'addOn']) {
    const invalid = structuredClone(example)
    const money = branch === 'addOn' ? invalid.addOns[0].starting : invalid.pricing[branch]
    money.amountMinor = '100.00'
    expect(ServicePackageSchema.safeParse(invalid).success).toBe(false)
  }
})

test('all exported blueprint/API content strings declare lengths or a finite set of values', () => {
  for (const file of [
    'experience-blueprint',
    'blueprint-starter',
    'blueprint-install',
    'blueprint-plan',
    'blueprint-catalog',
    'blueprint-catalog-page-input',
    'blueprint-preference-mutation',
    'blueprint-preference-response',
    'blueprint-preference-mutation-response',
    'blueprint-measurement-settings',
    'blueprint-measurement-settings-mutation',
    'blueprint-measurement-signal',
    'blueprint-schedule',
    'blueprint-schedule-input',
    'service-package',
    'money',
    'contribution-visibility',
  ]) {
    const schema: unknown = JSON.parse(
      readFileSync(`contracts/schemas/${file}.v1.schema.json`, 'utf8')
    )
    assertBoundedStrings(schema, file)
  }
})

function assertBoundedStrings(value: unknown, path: string) {
  if (Array.isArray(value)) {
    value.forEach((child, i) => assertBoundedStrings(child, `${path}[${i}]`))
    return
  }
  if (!value || typeof value !== 'object') return
  const node = value as Record<string, unknown>
  if (node.type === 'string' && !('enum' in node) && !('const' in node)) {
    expect(node.minLength, `${path}.minLength`).toBeTypeOf('number')
    expect(node.maxLength, `${path}.maxLength`).toBeTypeOf('number')
  }
  Object.entries(node).forEach(([key, child]) => assertBoundedStrings(child, `${path}.${key}`))
}

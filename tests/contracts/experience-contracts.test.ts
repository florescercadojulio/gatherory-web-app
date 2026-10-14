import { readFile } from 'node:fs/promises'
import { expect, test } from 'vitest'

import {
  ContributionVisibilitySchema,
  ExperienceBlueprintSchema,
  ServicePackageSchema,
} from '@/contracts/experience.contracts'

async function fixture(name: string) {
  return JSON.parse(
    await readFile(new URL(`../../contracts/examples/${name}`, import.meta.url), 'utf8')
  )
}

test('destination wedding and cabin stay use one portable blueprint contract', async () => {
  const wedding = ExperienceBlueprintSchema.parse(await fixture('destination-wedding.v1.json'))
  const cabin = ExperienceBlueprintSchema.parse(await fixture('family-cabin-stay.v1.json'))

  expect(wedding.experienceDefaults.type).toBe('wedding')
  expect(cabin.experienceDefaults.type).toBe('property_stay')
  expect(cabin.modules.at(-1)?.type).toBe('private_journal')
})

test('service packages reference an immutable blueprint revision', async () => {
  const servicePackage = ServicePackageSchema.parse(
    await fixture('destination-wedding-package.v1.json')
  )

  expect(servicePackage.blueprint).toEqual({
    id: 'destination-wedding',
    revision: 1,
  })
  expect(servicePackage.pricing.starting.amount).toBe('18500.00')
})

test('service packages reject inconsistent capacity and pricing', async () => {
  const servicePackage = await fixture('destination-wedding-package.v1.json')
  servicePackage.capacity.minimumGuests = 120
  servicePackage.pricing.additionalGuest.currency = 'MXN'

  const result = ServicePackageSchema.safeParse(servicePackage)
  expect(result.success).toBe(false)
  if (result.success) return
  expect(result.error.issues.some((issue) => issue.path[0] === 'capacity')).toBeTruthy()
  expect(result.error.issues.some((issue) => issue.path[0] === 'pricing')).toBeTruthy()
})

test('participant-group visibility requires an explicit group', () => {
  expect(
    ContributionVisibilitySchema.safeParse({
      scope: 'participant_group',
    }).success
  ).toBe(false)
  expect(
    ContributionVisibilitySchema.safeParse({
      scope: 'participant_group',
      groupId: 'family_flores',
    }).success
  ).toBe(true)
})

test('blueprints reject duplicate module keys and unknown presentation order', async () => {
  const blueprint = await fixture('family-cabin-stay.v1.json')
  blueprint.modules.push({ ...blueprint.modules[0] })
  blueprint.presentation.moduleOrder.push('missing_module')

  const result = ExperienceBlueprintSchema.safeParse(blueprint)
  expect(result.success).toBe(false)
  if (result.success) return
  expect(result.error.issues.some((issue) => issue.path[0] === 'modules')).toBeTruthy()
  expect(result.error.issues.some((issue) => issue.path[0] === 'presentation')).toBeTruthy()
})

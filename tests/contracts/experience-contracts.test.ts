import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'

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

  assert.equal(wedding.experienceDefaults.type, 'wedding')
  assert.equal(cabin.experienceDefaults.type, 'property_stay')
  assert.equal(cabin.modules.at(-1)?.type, 'private_journal')
})

test('service packages reference an immutable blueprint revision', async () => {
  const servicePackage = ServicePackageSchema.parse(
    await fixture('destination-wedding-package.v1.json')
  )

  assert.deepEqual(servicePackage.blueprint, {
    id: 'destination-wedding',
    revision: 1,
  })
  assert.equal(servicePackage.pricing.starting.amount, '18500.00')
})

test('service packages reject inconsistent capacity and pricing', async () => {
  const servicePackage = await fixture('destination-wedding-package.v1.json')
  servicePackage.capacity.minimumGuests = 120
  servicePackage.pricing.additionalGuest.currency = 'MXN'

  const result = ServicePackageSchema.safeParse(servicePackage)
  assert.equal(result.success, false)
  if (result.success) return
  assert.ok(result.error.issues.some((issue) => issue.path[0] === 'capacity'))
  assert.ok(result.error.issues.some((issue) => issue.path[0] === 'pricing'))
})

test('participant-group visibility requires an explicit group', () => {
  assert.equal(
    ContributionVisibilitySchema.safeParse({
      scope: 'participant_group',
    }).success,
    false
  )
  assert.equal(
    ContributionVisibilitySchema.safeParse({
      scope: 'participant_group',
      groupId: 'family_flores',
    }).success,
    true
  )
})

test('blueprints reject duplicate module keys and unknown presentation order', async () => {
  const blueprint = await fixture('family-cabin-stay.v1.json')
  blueprint.modules.push({ ...blueprint.modules[0] })
  blueprint.presentation.moduleOrder.push('missing_module')

  const result = ExperienceBlueprintSchema.safeParse(blueprint)
  assert.equal(result.success, false)
  if (result.success) return
  assert.ok(result.error.issues.some((issue) => issue.path[0] === 'modules'))
  assert.ok(result.error.issues.some((issue) => issue.path[0] === 'presentation'))
})

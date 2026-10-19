import { Effect } from 'effect'
import { expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ seedBlueprintCatalogEntries: vi.fn() }))
vi.mock('@/db', async () => ({ PgClientLive: (await import('effect')).Layer.empty }))
vi.mock('@/server/blueprints/repos/seed-blueprint-catalog', () => mocks)

import { seedCuratedBlueprints } from '@/db/seeds/curated-blueprints'
import { blueprintStarters } from '@/server/blueprints/catalog/starters'
import { developmentBlueprints } from '@/db/seeds/development-blueprints'

test('the development reset seeds production starters and the richer development catalog together', async () => {
  const inserted = blueprintStarters.length + developmentBlueprints.length
  mocks.seedBlueprintCatalogEntries.mockReturnValue(Effect.succeed({ inserted }))
  await expect(seedCuratedBlueprints()).resolves.toEqual({ inserted })
  expect(mocks.seedBlueprintCatalogEntries).toHaveBeenCalledExactlyOnceWith([
    ...blueprintStarters,
    ...developmentBlueprints,
  ])
})

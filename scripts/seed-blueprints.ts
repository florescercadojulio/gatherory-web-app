import { Effect } from 'effect'
import { PgClientLive } from '../src/db'
import { seedBlueprintCatalog } from '../src/server/blueprints/repos/seed-blueprint-catalog'
import { blueprintStarters } from '../src/server/blueprints/catalog/starters'
import imageAssignments from '../src/server/blueprints/catalog/seed-image-assignments.json'
import imageAssets from '../src/server/blueprints/catalog/seed-image-assets.json'
import { assertSeedImageCoverage } from '../src/server/blueprints/catalog/seed-image-registry'
import { assertCuratedBlueprintSeedImageFiles } from '../src/db/seeds/curated-blueprints'

// Uses only explicit DATABASE_URL, never loads .env or imports the dev seed/reset.
assertSeedImageCoverage(blueprintStarters, imageAssignments, imageAssets, {
  allowUnmatchedAssignments: true,
})
assertCuratedBlueprintSeedImageFiles()
await Effect.runPromise(seedBlueprintCatalog.pipe(Effect.provide(PgClientLive))).then((result) =>
  console.log(`Blueprint catalog: ${result.inserted} revision inserted.`)
)

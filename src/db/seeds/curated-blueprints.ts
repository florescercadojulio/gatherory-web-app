import { Effect } from 'effect'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'

import { PgClientLive } from '@/db'
import { seedBlueprintCatalogEntries } from '@/server/blueprints/repos/seed-blueprint-catalog'
import { blueprintStarters } from '@/server/blueprints/catalog/starters'
import { developmentBlueprints } from './development-blueprints'
import imageAssignments from '@/server/blueprints/catalog/seed-image-assignments.json'
import imageAssets from '@/server/blueprints/catalog/seed-image-assets.json'
import {
  assertSeedImageCoverage,
  SeedImageAssetsSchema,
} from '@/server/blueprints/catalog/seed-image-registry'

/** Validate both catalog scopes before any reset seed writes occur. */
export function assertCuratedBlueprintSeedImageCoverage() {
  assertCuratedBlueprintSeedImageFiles()
  assertSeedImageCoverage(blueprintStarters, imageAssignments, imageAssets, {
    allowUnmatchedAssignments: true,
  })
  assertSeedImageCoverage(developmentBlueprints, imageAssignments, imageAssets, {
    allowUnmatchedAssignments: true,
  })
}

/** Check bundled originals before any destructive reset or catalog insert. */
export function assertCuratedBlueprintSeedImageFiles() {
  const assets = SeedImageAssetsSchema.parse(imageAssets)
  const root = resolve(process.cwd())
  for (const [assetKey, asset] of Object.entries(assets)) {
    const path = resolve(root, asset.file)
    const rel = relative(root, path)
    if (isAbsolute(asset.file) || rel.startsWith('..') || isAbsolute(rel)) {
      throw new Error(`Seed image ${assetKey} points outside the workspace.`)
    }
    const actual = createHash('sha256').update(readFileSync(path)).digest('hex')
    if (actual !== asset.fileChecksum) {
      throw new Error(`Seed image ${assetKey} does not match its checked-in file checksum.`)
    }
  }
}

/** Repopulates immutable public starter revisions after the development reset. */
export function seedCuratedBlueprints() {
  assertCuratedBlueprintSeedImageCoverage()
  return Effect.runPromise(
    seedBlueprintCatalogEntries([...blueprintStarters, ...developmentBlueprints]).pipe(
      Effect.provide(PgClientLive)
    )
  )
}

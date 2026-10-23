import { describe, expect, test } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import imageAssignments from '@/server/blueprints/catalog/seed-image-assignments.json'
import imageAssets from '@/server/blueprints/catalog/seed-image-assets.json'
import { developmentEventImages } from '@/db/seeds/development-event-images'
import { reviewWorkspaceIds } from '@/db/review-workspace-fixture'
import { blueprintStarters } from '@/server/blueprints/catalog/starters'
import { developmentBlueprints } from '@/db/seeds/development-blueprints'
import { cottageDraftContent } from '@/db/seeds/cottage-template'
import { draftDefinition } from '@/contracts/blueprint-authoring.contracts'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'
import { assertSeedImageCoverage } from '@/server/blueprints/catalog/seed-image-registry'

describe('curated seed image assignments', () => {
  test('covers every production root, child event, and idea with its pinned revision', () => {
    expect(() =>
      assertSeedImageCoverage(blueprintStarters, imageAssignments, imageAssets, {
        allowUnmatchedAssignments: true,
      })
    ).not.toThrow()
  })

  test('covers every development root, child event, and idea with its pinned revision', () => {
    expect(() =>
      assertSeedImageCoverage(developmentBlueprints, imageAssignments, imageAssets, {
        allowUnmatchedAssignments: true,
      })
    ).not.toThrow()
  })

  test('covers the private cottage root, child events, and ideas', () => {
    const definition = draftDefinition(cottageDraftContent, 'seed_private_cottage', 1)
    expect(() =>
      assertSeedImageCoverage(
        [
          {
            catalogKey: 'seed_private_cottage',
            revision: 1,
            contentHash: blueprintHash(definition),
            definition,
          },
        ],
        imageAssignments,
        imageAssets,
        { allowUnmatchedAssignments: true }
      )
    ).not.toThrow()
  })

  test('does not reuse one source asset for every target in a blueprint', () => {
    for (const entry of [...blueprintStarters, ...developmentBlueprints]) {
      const assignment = imageAssignments[entry.catalogKey as keyof typeof imageAssignments]
      expect(assignment).toBeDefined()
      const targetKeys = [
        assignment.root,
        ...Object.values(assignment.children),
        ...Object.values(assignment.ideas),
      ]
      expect(new Set(targetKeys).size).toBeGreaterThan(1)
    }
  })

  test('keeps every authored asset local, file-checksum-pinned, and licensed from an accepted source', () => {
    for (const [assetKey, asset] of Object.entries(imageAssets)) {
      const filePath = resolve(process.cwd(), asset.file)
      expect(existsSync(filePath), `${assetKey}: ${asset.file}`).toBe(true)
      const bytes = readFileSync(filePath)
      expect(createHash('sha256').update(bytes).digest('hex'), assetKey).toBe(asset.fileChecksum)
      expect(asset.manifest.source.checksum).toMatch(/^[a-f0-9]{64}$/)
      const licenseHost = new URL(asset.license.url).hostname
      const sourceHost = new URL(asset.license.sourceURL).hostname
      expect(['unsplash.com', 'www.pexels.com']).toContain(licenseHost)
      expect(['unsplash.com', 'www.pexels.com']).toContain(sourceHost)
      expect(asset.license.photographer.trim().length).toBeGreaterThan(0)
      expect(asset.license.photoID.trim().length).toBeGreaterThan(0)
      expect(asset.license.checkedAt).toMatch(/^2026-\d\d-\d\dT/)
    }
  })

  test('covers the review workspace root, every child event, and every seeded idea', () => {
    const workspace = developmentEventImages.filter((image) => image.entityType === 'workspace')
    const events = developmentEventImages.filter((image) => image.entityType === 'event')
    const ideas = developmentEventImages.filter((image) => image.entityType === 'idea')
    expect(workspace).toHaveLength(1)
    expect(events).toHaveLength(6)
    expect(ideas).toHaveLength(13)
    expect(workspace.map((image) => image.entityID)).toEqual([reviewWorkspaceIds.events.main])
    expect(new Set(events.map((image) => image.entityID))).toEqual(
      new Set(Object.values(reviewWorkspaceIds.events).filter((id) => id !== reviewWorkspaceIds.events.main))
    )
    const expectedIdeaIds = Object.entries(reviewWorkspaceIds.planning)
      .filter(([key]) => key.endsWith('Idea'))
      .map(([, id]) => id)
    expect(new Set(ideas.map((image) => image.entityID))).toEqual(new Set(expectedIdeaIds))
    expect(
      developmentEventImages
        .filter((image) => image.entityType === 'registry_item')
        .map((image) => image.entityID)
    ).toEqual([reviewWorkspaceIds.planning.registryItem])
    for (const image of developmentEventImages) {
      expect(existsSync(resolve(process.cwd(), image.file)), image.key).toBe(true)
      expect(image.sourceURL).toMatch(/^https:\/\/unsplash\.com\/photos\//)
      expect(image.photographer.trim()).not.toBe('')
      expect(image.photoID.trim()).not.toBe('')
    }
  })
})

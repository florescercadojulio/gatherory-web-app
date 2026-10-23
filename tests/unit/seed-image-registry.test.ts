import { describe, expect, it } from 'vitest'
import {
  BlueprintExperienceTreeModuleSchema,
  BlueprintIdeasModuleSchema,
} from '@/contracts/blueprint-install.contracts'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import manifest from '@/server/blueprints/catalog/cover-manifests/garden-wedding.json'
import {
  assertSeedImageCoverage,
  resolveSeedImageTargets,
  SeedImageAssetsSchema,
  SeedImageAssignmentsSchema,
  seedImageCardURL,
} from '@/server/blueprints/catalog/seed-image-registry'
import { BlueprintDiscoverySchema } from '@/contracts/blueprint-discovery.contracts'

const entry = weddingBlueprintV1
const childModule = BlueprintExperienceTreeModuleSchema.parse(
  entry.definition.modules.find((module) => module.type === 'experience_tree')
)
const ideaModule = BlueprintIdeasModuleSchema.parse(
  entry.definition.modules.find((module) => module.type === 'ideas')
)
const asset = {
  manifest,
  license: {
    name: 'Unsplash License',
    url: 'https://unsplash.com/license',
    sourceURL: 'https://unsplash.com/photos/garden-wedding-example',
    photographer: 'Example Photographer',
    photoID: 'example-photo',
    checkedAt: '2026-10-22T12:00:00Z',
  },
  file: 'scripts/seed/blueprint-assets/garden-wedding.jpg',
  fileChecksum: 'a'.repeat(64),
}
const assignments = {
  [entry.catalogKey]: {
    revision: entry.revision,
    contentHash: entry.contentHash,
    root: 'garden-wedding',
    children: Object.fromEntries(
      childModule.config.children.map((child) => child.key).map((key) => [key, 'garden-wedding'])
    ),
    ideas: Object.fromEntries(
      ideaModule.config.ideas.map((idea) => idea.key).map((key) => [key, 'garden-wedding'])
    ),
  },
}
const assets = { 'garden-wedding': asset }

describe('seeded Blueprint image registry', () => {
  it('requires a complete mapping pinned to each immutable source revision', () => {
    expect(() => assertSeedImageCoverage([entry], assignments, assets)).not.toThrow()
    expect(() =>
      assertSeedImageCoverage(
        [entry],
        { ...assignments, wedding: { ...assignments.wedding, contentHash: 'a'.repeat(64) } },
        assets
      )
    ).toThrow(/content hash/)
  })

  it('exposes only exact-revision target mappings and canonical card URLs', () => {
    const parsedAssignments = SeedImageAssignmentsSchema.parse(assignments)
    const parsedAssets = SeedImageAssetsSchema.parse(assets)
    const resolved = resolveSeedImageTargets({
      entry,
      assignments: parsedAssignments,
      assets: parsedAssets,
    })
    expect(resolved?.root?.assetKey).toBe('garden-wedding')
    expect(Object.keys(resolved?.children ?? {})).toHaveLength(childModule.config.children.length)
    expect(Object.keys(resolved?.ideas ?? {})).toHaveLength(ideaModule.config.ideas.length)
    expect(seedImageCardURL(resolved!.root!.manifest)).toBe(
      'https://cdn.gatherory.com/explore/covers/garden-wedding/d168d90dbd69f719b04301fe1c173a01aa57102ac86737dc4ceb8bc6ce9e3750/card.jpg'
    )
    expect(
      resolveSeedImageTargets({
        entry: { ...entry, contentHash: 'a'.repeat(64) },
        assignments: parsedAssignments,
        assets: parsedAssets,
      })
    ).toBeUndefined()
  })

  it('rejects unmapped and unknown targets before seed writes', () => {
    expect(() =>
      assertSeedImageCoverage([entry], { wedding: { ...assignments.wedding, ideas: {} } }, assets)
    ).toThrow(/missing idea/)
    expect(() =>
      assertSeedImageCoverage(
        [entry],
        {
          wedding: {
            ...assignments.wedding,
            children: { ...assignments.wedding.children, rogue: 'garden-wedding' },
          },
        },
        assets
      )
    ).toThrow(/unknown child/)
  })

  it('accepts only bounded canonical URLs in per-target discovery metadata', () => {
    const cardURL = seedImageCardURL(
      SeedImageAssetsSchema.parse(assets)['garden-wedding']!.manifest
    )
    const discovery = {
      categories: ['weddings'],
      tags: ['wedding'],
      summary: '',
      coverImages: { children: { rehearsal: cardURL }, ideas: { flowers: cardURL } },
    }
    expect(BlueprintDiscoverySchema.parse(discovery).coverImages).toEqual(discovery.coverImages)
    expect(
      BlueprintDiscoverySchema.safeParse({
        ...discovery,
        coverImages: { children: { rehearsal: 'https://example.com/image.jpg' }, ideas: {} },
      }).success
    ).toBe(false)
    expect(
      BlueprintDiscoverySchema.safeParse({
        ...discovery,
        coverImages: {
          children: Object.fromEntries(
            Array.from({ length: 51 }, (_, index) => [`child_${index}`, cardURL])
          ),
          ideas: {},
        },
      }).success
    ).toBe(false)
  })
})

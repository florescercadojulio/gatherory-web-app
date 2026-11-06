import { expect, test } from 'vitest'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import {
  buildBlueprintCatalog,
  publicBlueprintCatalog,
  rankBlueprintIdeaSearch,
} from '@/server/blueprints/services/blueprint-discovery'
import { discoverBlueprintIdeas } from '@/server/blueprints/services/blueprint-idea-discovery'
import { BlueprintIdeaDiscoveryItemSchema } from '@/contracts/blueprint-idea-discovery.contracts'
import { BlueprintIdeasModuleSchema } from '@/contracts/blueprint-install.contracts'

const catalog = publicBlueprintCatalog(buildBlueprintCatalog([weddingBlueprintV1]))

test('discovers individual ideas and preserves only their source-scoped published cover reference', () => {
  const result = discoverBlueprintIdeas(catalog, { q: 'photography', limit: 10 })
  expect(result.ideas).toHaveLength(1)
  expect(result.ideas[0]).toMatchObject({
    id: 'wedding:1:photography',
    sourceBlueprintId: 'wedding',
    sourceVersion: 1,
    idea: { key: 'photography', category: 'photography', title: 'Photography' },
  })
  expect(result.ideas[0]).not.toHaveProperty('coverAssetId')
  expect(result.ideas[0]?.coverImageURL).toMatch(
    /^https:\/\/cdn\.gatherory\.com\/explore\/covers\//
  )
})

test('retains a valid source-published cover asset reference at item level', () => {
  const source = structuredClone(weddingBlueprintV1)
  source.definition.modules = source.definition.modules.map((candidate) => {
    const parsed = BlueprintIdeasModuleSchema.safeParse(candidate)
    if (!parsed.success) return candidate
    return {
      ...parsed.data,
      config: {
        ...parsed.data.config,
        ideas: parsed.data.config.ideas.map((idea) =>
          idea.key === 'photography'
            ? { ...idea, coverAssetId: '550e8400-e29b-41d4-a716-446655440000' }
            : idea
        ),
      },
    }
  })
  const sourceCatalog = publicBlueprintCatalog(buildBlueprintCatalog([source]))
  const result = discoverBlueprintIdeas(sourceCatalog, { q: 'photography', limit: 10 })
  expect(result.ideas[0]?.coverAssetId).toBe('550e8400-e29b-41d4-a716-446655440000')
  expect(result.ideas[0]?.idea).not.toHaveProperty('coverAssetId')
  expect(JSON.stringify(result)).not.toContain('storage')
  expect(JSON.stringify(result)).not.toContain('signed')
})

test('orders idea phrase matches and binds pagination cursors to the query', () => {
  const first = discoverBlueprintIdeas(catalog, { q: '', limit: 2 })
  expect(first.ideas).toHaveLength(2)
  expect(first.nextCursor).toBeDefined()
  const second = discoverBlueprintIdeas(catalog, { q: '', cursor: first.nextCursor, limit: 2 })
  expect(second.ideas).toHaveLength(2)
  expect(second.ideas[0]?.id).not.toBe(first.ideas[0]?.id)
  expect(() =>
    discoverBlueprintIdeas(catalog, { q: 'food', cursor: first.nextCursor, limit: 2 })
  ).toThrow()
  expect(() =>
    discoverBlueprintIdeas(catalog, {
      q: '',
      cursor: Buffer.from(JSON.stringify({ v: 1, q: 'tampered', s: 'stale', o: 3 })).toString(
        'base64url'
      ),
      limit: 2,
    })
  ).toThrow()
})

test('reuses related-term and unique typo matching over individual idea title and notes', () => {
  const result = discoverBlueprintIdeas(catalog, { q: 'photograhy', limit: 10 })
  expect(result.ideas[0]?.idea.title).toBe('Photography')
  expect(rankBlueprintIdeaSearch('wedding', [{ title: 'Bridal shower' }])[0]).toBeDefined()
  expect(rankBlueprintIdeaSearch('wedding', [{ title: 'Venue' }])[0]).toBeUndefined()
})

test('pages every idea across a large catalog without losing or duplicating results', () => {
  const many = Array.from({ length: 8 }, (_, index) => {
    const id = `wedding_variant_${index}`
    const definition = structuredClone(weddingBlueprintV1.definition)
    definition.blueprint.id = id
    definition.blueprint.name = `Celebration ${index}`
    return {
      ...weddingBlueprintV1,
      catalogKey: id,
      contentHash: String(index).padStart(64, 'a'),
      definition,
      revision: 1,
    }
  })
  const largeCatalog = publicBlueprintCatalog(buildBlueprintCatalog(many))
  const ids: string[] = []
  let cursor: string | undefined
  do {
    const page = discoverBlueprintIdeas(largeCatalog, { q: '', cursor, limit: 11 })
    ids.push(...page.ideas.map(({ id }) => id))
    cursor = page.nextCursor
  } while (cursor)
  expect(ids).toHaveLength(40)
  expect(new Set(ids).size).toBe(40)
})

test('rejects a continuation cursor after the public idea snapshot changes', () => {
  const first = discoverBlueprintIdeas(catalog, { q: '', limit: 2 })
  const expanded = publicBlueprintCatalog(
    buildBlueprintCatalog([
      weddingBlueprintV1,
      {
        ...weddingBlueprintV1,
        catalogKey: 'wedding_extra',
        contentHash: 'e'.repeat(64),
        definition: {
          ...structuredClone(weddingBlueprintV1.definition),
          blueprint: {
            ...weddingBlueprintV1.definition.blueprint,
            id: 'wedding_extra',
            name: 'Wedding Extras',
          },
        },
      },
    ])
  )
  expect(() =>
    discoverBlueprintIdeas(expanded, { q: '', cursor: first.nextCursor, limit: 2 })
  ).toThrow()
})

test('public response contract rejects private asset fields and uncurated media URLs', () => {
  const item = discoverBlueprintIdeas(catalog, { q: 'photography', limit: 1 }).ideas[0]!
  expect(() =>
    BlueprintIdeaDiscoveryItemSchema.parse({
      ...item,
      idea: { ...item.idea, coverAssetId: 'private-asset-id' },
    })
  ).toThrow()
  expect(() =>
    BlueprintIdeaDiscoveryItemSchema.parse({
      ...item,
      coverImageURL: 'https://private-bucket.example/object.jpg',
    })
  ).toThrow()
  expect(() =>
    BlueprintIdeaDiscoveryItemSchema.parse({
      ...item,
      idea: { ...item.idea, configuration: { version: 1, privateURL: 'https://private.example' } },
    })
  ).toThrow()
})

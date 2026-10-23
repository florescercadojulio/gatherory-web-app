import { expect, it } from 'vitest'
import { blueprintStarters } from '@/server/blueprints/catalog/starters'
import {
  curatedExploreCoverAssetId,
  resolveCuratedExploreCover,
} from '@/server/blueprints/catalog/explore-cover-import'

const wedding = blueprintStarters.find((starter) => starter.catalogKey === 'wedding')!

it('resolves a curated cover only for its exact checked-in starter revision and hash', () => {
  const resolved = resolveCuratedExploreCover({
    catalogKey: wedding.catalogKey,
    revision: wedding.revision,
    contentHash: wedding.contentHash,
  })
  expect(resolved?.status).toBe('available')
  expect(resolved?.status === 'available' && resolved.manifest.variants).toContainEqual(
    expect.objectContaining({
      name: 'card',
      url: 'https://cdn.gatherory.com/explore/covers/garden-wedding/d168d90dbd69f719b04301fe1c173a01aa57102ac86737dc4ceb8bc6ce9e3750/card.jpg',
    })
  )

  expect(
    resolveCuratedExploreCover({
      catalogKey: wedding.catalogKey,
      revision: wedding.revision + 1,
      contentHash: wedding.contentHash,
    })
  ).toBeUndefined()
  expect(
    resolveCuratedExploreCover({
      catalogKey: wedding.catalogKey,
      revision: wedding.revision,
      contentHash: '0'.repeat(64),
    })
  ).toBeUndefined()
})

it('scopes import asset IDs to actor, idempotency request, source revision, and hero digest', () => {
  const input = {
    actorUserId: 'actor-a',
    requestId: '10000000-0000-4000-8000-000000000001',
    catalogKey: wedding.catalogKey,
    revision: wedding.revision,
    contentHash: wedding.contentHash,
    heroChecksum: 'a'.repeat(64),
  }
  const assetId = curatedExploreCoverAssetId(input)
  expect(curatedExploreCoverAssetId(input)).toBe(assetId)
  expect(curatedExploreCoverAssetId({ ...input, actorUserId: 'actor-b' })).not.toBe(assetId)
  expect(curatedExploreCoverAssetId({ ...input, actorUserId: 'Actor-A' })).not.toBe(assetId)
  expect(curatedExploreCoverAssetId({ ...input, revision: input.revision + 1 })).not.toBe(assetId)
  expect(curatedExploreCoverAssetId({ ...input, contentHash: 'b'.repeat(64) })).not.toBe(assetId)
  expect(curatedExploreCoverAssetId({ ...input, heroChecksum: 'c'.repeat(64) })).not.toBe(assetId)
})

import { Effect } from 'effect'
import { expect, it } from 'vitest'

import seedImageAssets from '@/server/blueprints/catalog/seed-image-assets.json'
import exploreCoverManifests from '@/server/blueprints/catalog/explore-cover-manifests.json'
import { blueprintSeedImageTestSource } from '../fixtures/blueprint-seed-image-source'

it('recreates checked-in seed and Explore cover variants with their manifest checksums', async () => {
  const urls = [
    ...Object.values(seedImageAssets).flatMap((asset) =>
      asset.manifest.variants.map((variant) => variant.url)
    ),
    ...Object.values(exploreCoverManifests).flatMap((manifest) =>
      manifest.variants.map((variant) => variant.url)
    ),
  ]
  const uniqueUrls = [...new Set(urls)]
  const downloaded = await Effect.runPromise(
    Effect.forEach(
      uniqueUrls,
      (url) => blueprintSeedImageTestSource.download({ url, maxBytes: 20 * 1024 * 1024 }),
      { concurrency: 4 }
    )
  )

  expect(downloaded).toHaveLength(uniqueUrls.length)
  expect(downloaded.every((image) => image.contentType === 'image/jpeg')).toBe(true)
})

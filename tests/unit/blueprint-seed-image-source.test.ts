import { createHash } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Effect } from 'effect'
import sharp from 'sharp'
import { expect, it } from 'vitest'

import seedImageAssets from '@/server/blueprints/catalog/seed-image-assets.json'
import exploreCoverManifests from '@/server/blueprints/catalog/explore-cover-manifests.json'
import {
  blueprintSeedImageTestSource,
  createBlueprintSeedImageTestSource,
} from '../fixtures/blueprint-seed-image-source'

const manifests = [
  ...Object.values(seedImageAssets).map((asset) => asset.manifest),
  ...Object.values(exploreCoverManifests),
]
const variants = manifests.flatMap((manifest) => manifest.variants)

it('serves exact checked-in bytes for every seed and Explore manifest variant', async () => {
  const uniqueVariants = [...new Map(variants.map((variant) => [variant.url, variant])).values()]
  const results = await Promise.all(
    uniqueVariants.map(async (variant) => {
      const result = await Effect.runPromise(
        blueprintSeedImageTestSource.download({ url: variant.url, maxBytes: 20 * 1024 * 1024 })
      )
      const checksum = createHash('sha256').update(result.bytes).digest('hex')
      const metadata = await sharp(result.bytes).metadata()
      return { variant, result, checksum, metadata }
    })
  )

  expect(results).toHaveLength(uniqueVariants.length)
  for (const { variant, result, checksum, metadata } of results) {
    expect(result.contentType).toBe('image/jpeg')
    expect(checksum).toBe(variant.checksum)
    expect(metadata.format).toBe('jpeg')
    expect(metadata.width).toBe(variant.width)
    expect(metadata.height).toBe(variant.height)
  }
})

it('rejects unknown URLs and variants larger than the requested download limit', async () => {
  const variant = variants[0]
  if (!variant) throw new Error('Expected a checked-in Blueprint manifest variant')

  await expect(
    Effect.runPromise(
      blueprintSeedImageTestSource.download({
        url: 'https://example.test/unknown.jpg',
        maxBytes: 100,
      })
    )
  ).rejects.toThrow('No local fixture')
  await expect(
    Effect.runPromise(blueprintSeedImageTestSource.download({ url: variant.url, maxBytes: 1 }))
  ).rejects.toThrow('download limit')
})

it('rejects missing and corrupt variant fixtures instead of claiming their manifest hash', async () => {
  const variant = variants[0]
  if (!variant) throw new Error('Expected a checked-in Blueprint manifest variant')
  const directory = await mkdtemp(join(tmpdir(), 'blueprint-seed-fixtures-'))
  try {
    const source = createBlueprintSeedImageTestSource(directory)
    await expect(
      Effect.runPromise(source.download({ url: variant.url, maxBytes: 20 * 1024 * 1024 }))
    ).rejects.toThrow()

    await writeFile(
      join(directory, `${variant.checksum}.jpg`),
      Buffer.from('corrupt fixture bytes')
    )
    await expect(
      Effect.runPromise(source.download({ url: variant.url, maxBytes: 20 * 1024 * 1024 }))
    ).rejects.toThrow(`Local fixture bytes do not match the checked-in ${variant.name} checksum`)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

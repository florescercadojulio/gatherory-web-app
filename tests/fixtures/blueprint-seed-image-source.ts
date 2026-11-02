import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { Effect } from 'effect'
import sharp from 'sharp'

import seedImageAssets from '@/server/blueprints/catalog/seed-image-assets.json'
import exploreCoverManifests from '@/server/blueprints/catalog/explore-cover-manifests.json'
import type { BlueprintCoverSourceShape } from '@/server/blueprint-media/connectors/blueprint-cover-source.con'

/** Recreates checked-in CDN variants locally for Blueprint installation tests. */
export const blueprintSeedImageTestSource: BlueprintCoverSourceShape = {
  download: ({ url }) =>
    Effect.tryPromise({
      try: async () => {
        const seedAssets = Object.values(seedImageAssets)
        const seedMatch = seedAssets.find((asset) =>
          asset.manifest.variants.some((variant) => variant.url === url)
        )
        const exploreMatch = Object.values(exploreCoverManifests).find((manifest) =>
          manifest.variants.some((variant) => variant.url === url)
        )
        const imageAsset =
          seedMatch ??
          (exploreMatch
            ? seedAssets.find(
                (asset) => asset.manifest.source.checksum === exploreMatch.source.checksum
              )
            : undefined)
        const manifest = seedMatch?.manifest ?? exploreMatch
        const variant = manifest?.variants.find((item) => item.url === url)
        if (!imageAsset || !variant) throw new Error(`No local fixture for ${url}`)

        const source = await readFile(imageAsset.file)
        const normalized = await sharp(source, {
          limitInputPixels: 40_000_000,
          failOn: 'error',
        })
          .rotate()
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer()
        const targetEdge = { thumbnail: 320, card: 960, hero: 1600 }[variant.name]
        const bytes = await sharp(normalized)
          .resize({
            width: targetEdge,
            height: targetEdge,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:2:0' })
          .toBuffer()
        const checksum = createHash('sha256').update(bytes).digest('hex')
        if (checksum !== variant.checksum)
          throw new Error(
            `Local fixture bytes do not match the checked-in ${variant.name} checksum.`
          )
        return { bytes, contentType: 'image/jpeg' }
      },
      catch: (cause) => cause,
    }),
}

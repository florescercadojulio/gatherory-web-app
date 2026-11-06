import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Effect } from 'effect'

import seedImageAssets from '@/server/blueprints/catalog/seed-image-assets.json'
import exploreCoverManifests from '@/server/blueprints/catalog/explore-cover-manifests.json'
import type { BlueprintCoverSourceShape } from '@/server/blueprint-media/connectors/blueprint-cover-source.con'

const fixtureDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'blueprint-seed-image-variants'
)

/** Reads exact, checked-in CDN variant bytes for offline Blueprint tests. */
export function createBlueprintSeedImageTestSource(
  variantsDirectory = fixtureDirectory
): BlueprintCoverSourceShape {
  return {
    download: ({ url, maxBytes }) =>
      Effect.tryPromise({
        try: async () => {
          const seedMatch = Object.values(seedImageAssets).find((asset) =>
            asset.manifest.variants.some((variant) => variant.url === url)
          )
          const exploreMatch = Object.values(exploreCoverManifests).find((manifest) =>
            manifest.variants.some((variant) => variant.url === url)
          )
          const manifest = seedMatch?.manifest ?? exploreMatch
          const variant = manifest?.variants.find((item) => item.url === url)
          if (!variant) throw new Error(`No local fixture for ${url}`)

          const bytes = await readFile(resolve(variantsDirectory, `${variant.checksum}.jpg`))
          const checksum = createHash('sha256').update(bytes).digest('hex')
          if (checksum !== variant.checksum)
            throw new Error(
              `Local fixture bytes do not match the checked-in ${variant.name} checksum.`
            )
          if (bytes.byteLength > maxBytes)
            throw new Error(`Local fixture exceeds the ${maxBytes} byte download limit.`)
          return { bytes, contentType: 'image/jpeg' }
        },
        catch: (cause) => cause,
      }),
  }
}

export const blueprintSeedImageTestSource = createBlueprintSeedImageTestSource()

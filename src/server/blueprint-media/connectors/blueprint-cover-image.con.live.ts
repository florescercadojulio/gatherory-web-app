import sharp from 'sharp'
import { Effect, Layer } from 'effect'

import type { BlueprintCoverVariant } from '@/contracts/blueprint-media.contracts'
import { BlueprintCoverImage } from './blueprint-cover-image.con'

export const BlueprintCoverImageLive = Layer.succeed(BlueprintCoverImage, {
  normalizeJpeg: (bytes, input) =>
    Effect.tryPromise({
      try: async () => {
        const source = Buffer.from(bytes)
        const image = sharp(source, {
          failOn: 'error',
          limitInputPixels: input.maxPixels,
          animated: false,
        })
        const metadata = await image.metadata()
        if (
          metadata.format !== 'jpeg' ||
          !metadata.width ||
          !metadata.height ||
          metadata.width * metadata.height > input.maxPixels
        )
          throw new Error('The image is not a bounded JPEG.')
        const oriented = await image
          .rotate()
          .jpeg({ quality: 88, mozjpeg: true })
          .toBuffer({ resolveWithObject: true })
        const width = oriented.info.width
        const height = oriented.info.height
        const variants = {} as Record<
          BlueprintCoverVariant,
          { bytes: Uint8Array; width: number; height: number }
        >
        for (const [variant, targetWidth] of [
          ['thumbnail', 320],
          ['card', 960],
          ['hero', 1600],
        ] as const) {
          const result = await sharp(oriented.data)
            .resize({
              width: targetWidth,
              height: targetWidth,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality: variant === 'thumbnail' ? 78 : 84, mozjpeg: true })
            .toBuffer({ resolveWithObject: true })
          variants[variant] = {
            bytes: result.data,
            width: result.info.width,
            height: result.info.height,
          }
        }
        return { original: oriented.data, width, height, variants }
      },
      catch: (cause) => cause,
    }),
  inspectJpeg: (bytes, input) =>
    Effect.tryPromise({
      try: async () => {
        const metadata = await sharp(Buffer.from(bytes), {
          failOn: 'error',
          limitInputPixels: input.maxPixels,
          animated: false,
        }).metadata()
        return { format: metadata.format, width: metadata.width, height: metadata.height }
      },
      catch: (cause) => cause,
    }),
})

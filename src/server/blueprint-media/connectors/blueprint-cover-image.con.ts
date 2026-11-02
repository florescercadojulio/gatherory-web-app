import { Context, Effect } from 'effect'

import type { BlueprintCoverVariant } from '@/contracts/blueprint-media.contracts'

export type BlueprintCoverImageVariant = { bytes: Uint8Array; width: number; height: number }
export type BlueprintCoverImageShape = {
  readonly normalizeJpeg: (
    bytes: Uint8Array,
    input: { maxPixels: number }
  ) => Effect.Effect<
    {
      original: Uint8Array
      width: number
      height: number
      variants: Record<BlueprintCoverVariant, BlueprintCoverImageVariant>
    },
    unknown
  >
  readonly inspectJpeg: (
    bytes: Uint8Array,
    input: { maxPixels: number }
  ) => Effect.Effect<{ format?: string; width?: number; height?: number }, unknown>
}

/** Provider-neutral decoding and rendition port for Blueprint cover images. */
export class BlueprintCoverImage extends Context.Service<
  BlueprintCoverImage,
  BlueprintCoverImageShape
>()('BlueprintCoverImage') {}

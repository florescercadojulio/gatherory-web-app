import { z } from 'zod'
import { BlueprintPublicCoverURLSchema } from '@/contracts/blueprint-discovery.contracts'

const checksum = z.string().regex(/^[a-f0-9]{64}$/)
const variantLimits = { thumbnail: 320, card: 960, hero: 1600 } as const

/** Checked-in publication metadata, shared by attachment tooling and private import. */
export const ExploreCoverManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    label: z.string().trim().min(1).max(1000),
    source: z.object({
      width: z.number().int().positive().max(40_000_000),
      height: z.number().int().positive().max(40_000_000),
      checksum,
    }),
    bucket: z.literal('gatherory-public'),
    processingVersion: z.literal('explore-cover-jpeg-v1'),
    variants: z
      .array(
        z.object({
          name: z.enum(['thumbnail', 'card', 'hero']),
          width: z.number().int().positive(),
          height: z.number().int().positive(),
          checksum,
          bucket: z.literal('gatherory-public'),
          key: z.string(),
          url: z.string().url(),
        })
      )
      .length(3),
  })
  .superRefine((manifest, context) => {
    const invalid = (message: string) => context.addIssue({ code: 'custom', message })
    if (manifest.source.width * manifest.source.height > 40_000_000) {
      invalid('Source exceeds the image pixel limit.')
    }
    const card = manifest.variants.find(({ name }) => name === 'card')
    if (!card || !BlueprintPublicCoverURLSchema.safeParse(card.url).success) {
      invalid('A canonical card URL is required.')
      return
    }
    if (new Set(manifest.variants.map(({ name }) => name)).size !== 3) {
      invalid('Each display variant must occur exactly once.')
    }
    const prefix = card.url.slice(0, -'card.jpg'.length)
    for (const variant of manifest.variants) {
      const url = new URL(variant.url)
      if (
        variant.url !== `${prefix}${variant.name}.jpg` ||
        variant.key !== url.pathname.slice(1) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      ) {
        invalid('Variants must use the same canonical immutable cover path.')
      }
      const limit = variantLimits[variant.name]
      if (variant.width > limit || variant.height > limit) {
        invalid(`${variant.name} exceeds its display dimension limit.`)
      }
    }
  })

export type ExploreCoverManifest = z.infer<typeof ExploreCoverManifestSchema>

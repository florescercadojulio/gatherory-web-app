import { Effect } from 'effect'
import type { ExploreCoverManifest } from '@/server/blueprints/catalog/explore-cover-manifest'
import { BlueprintCoverService } from '../services/blueprint-cover.service'

export type MaterializeCuratedSeedImagesInput = {
  actorUserId: string
  requestId: string
  catalogKey: string
  revision: number
  contentHash: string
  images: Array<{ assetKey: string; manifest: ExploreCoverManifest }>
}

export const materializeCuratedSeedImagesWorkflow = (input: MaterializeCuratedSeedImagesInput) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintCoverService).materializeCuratedSeedImages(input)
  })

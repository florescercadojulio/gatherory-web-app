import { Effect } from 'effect'
import { BlueprintCoverService } from '@/server/blueprint-media/services/blueprint-cover.service'
import type { BlueprintCoverCallbacks } from '../repos/blueprint-cover-callbacks'

/**
 * Adapts the media use-case service to the narrow callbacks used by atomic
 * persistence engines. The callbacks are lazy: creating this value performs no
 * storage work, so the engine still controls idempotency and transaction order.
 */
export const blueprintCoverCallbacksWorkflow = (): Effect.Effect<
  BlueprintCoverCallbacks,
  never,
  BlueprintCoverService
> =>
  Effect.gen(function* () {
    const service = yield* BlueprintCoverService
    return {
      validateReferences: (input) => service.validateReferences(input),
      cloneAssets: (input) => service.cloneAssets(input),
      materializeCuratedExploreCover: (input) => service.materializeCuratedExploreCover(input),
      materializeCuratedSeedImages: (input) => service.materializeCuratedSeedImages(input),
    } satisfies BlueprintCoverCallbacks
  })

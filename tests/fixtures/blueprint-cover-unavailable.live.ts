import { Effect, Layer } from 'effect'

import { BlueprintCoverService } from '@/server/blueprint-media/services/blueprint-cover.service'
import { blueprintCoverCallbacksWorkflow } from '@/server/blueprints/workflows/blueprint-cover-callbacks.workflow'

/**
 * No-media database fixtures get a loudly failing service when a test starts
 * depending on cover behavior without opting into the real cover graph.
 */
export const BlueprintCoverUnavailableTestLive = Layer.succeed(BlueprintCoverService, {
  validateReferences: () => Effect.die('unexpected Blueprint cover reference validation'),
  prepareUpload: () => Effect.die('unexpected Blueprint cover prepare'),
  finalizeUpload: () => Effect.die('unexpected Blueprint cover finalize'),
  getUrl: () => Effect.die('unexpected Blueprint cover URL'),
  cloneAssets: () => Effect.die('unexpected Blueprint cover clone'),
  materializeCuratedExploreCover: () => Effect.die('unexpected curated Blueprint cover'),
  materializeCuratedSeedImages: () => Effect.die('unexpected curated Blueprint seed cover'),
})

/** Callback bundle for direct persistence tests that intentionally have no covers. */
export const BlueprintCoverUnavailableCallbacks = Effect.runSync(
  blueprintCoverCallbacksWorkflow().pipe(Effect.provide(BlueprintCoverUnavailableTestLive))
)

import { Effect } from 'effect'

import { BlueprintCoverDomainLive } from './blueprint-media.layers.live'
import { cloneBlueprintCoverAssetsWorkflow as cloneProgram } from './workflows/clone-blueprint-cover-assets.workflow'
import { finalizeBlueprintCoverUploadWorkflow as finalizeProgram } from './workflows/finalize-blueprint-cover-upload.workflow'
import { getBlueprintCoverUrlWorkflow as getUrlProgram } from './workflows/get-blueprint-cover-url.workflow'
import { materializeCuratedExploreCoverWorkflow as exploreCoverProgram } from './workflows/materialize-curated-explore-cover.workflow'
import { materializeCuratedSeedImagesWorkflow as seedImagesProgram } from './workflows/materialize-curated-seed-images.workflow'
import { prepareBlueprintCoverUploadWorkflow as prepareProgram } from './workflows/prepare-blueprint-cover-upload.workflow'
import { validateBlueprintCoverReferencesWorkflow as validateProgram } from './workflows/validate-blueprint-cover-references.workflow'

/** Production bindings for the injectable Blueprint cover use cases. */
export const prepareBlueprintCoverUpload = (...args: Parameters<typeof prepareProgram>) =>
  prepareProgram(...args).pipe(Effect.provide(BlueprintCoverDomainLive))
export const finalizeBlueprintCoverUpload = (...args: Parameters<typeof finalizeProgram>) =>
  finalizeProgram(...args).pipe(Effect.provide(BlueprintCoverDomainLive))
export const getBlueprintCoverUrl = (...args: Parameters<typeof getUrlProgram>) =>
  getUrlProgram(...args).pipe(Effect.provide(BlueprintCoverDomainLive))
export const validateBlueprintCoverReferences = (...args: Parameters<typeof validateProgram>) =>
  validateProgram(...args).pipe(Effect.provide(BlueprintCoverDomainLive))
export const cloneBlueprintCoverAssets = (...args: Parameters<typeof cloneProgram>) =>
  cloneProgram(...args).pipe(Effect.provide(BlueprintCoverDomainLive))
export const materializeCuratedExploreCover = (...args: Parameters<typeof exploreCoverProgram>) =>
  exploreCoverProgram(...args).pipe(Effect.provide(BlueprintCoverDomainLive))
export const materializeCuratedSeedImages = (...args: Parameters<typeof seedImagesProgram>) =>
  seedImagesProgram(...args).pipe(Effect.provide(BlueprintCoverDomainLive))

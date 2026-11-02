import { Effect, Layer } from 'effect'
import { scheduleBlueprintWorkflow } from './schedule-blueprint.workflow'
import type { BlueprintCatalogPageInput } from '../services/blueprint-discovery'
import { BlueprintRepoLive } from '../repos/blueprint.repo.live'
import { BlueprintDiscoveryActionsRepoLive } from '../repos/blueprint-discovery-actions.repo.live'
import { BlueprintInstallCheckpoint } from '../contracts/blueprint-runtime.contracts'
import { BetterAuthWorkspaceConLive } from '@/server/workspaces/connectors/better-auth.con.live'
import {
  installBlueprintWorkflow as install,
  previewBlueprintWorkflow as preview,
  blueprintStatusWorkflow as status,
} from './install-blueprint.workflow'
import { BlueprintCoverDomainLive } from '@/server/blueprint-media/blueprint-media.layers.live'
import {
  blueprintCatalogWorkflow,
  blueprintCatalogPageWorkflow,
} from './blueprint-catalog.workflow'

const BlueprintRepoPersistenceLive = BlueprintRepoLive.pipe(
  Layer.provide(Layer.succeed(BlueprintInstallCheckpoint, { afterProjection: () => Effect.void }))
)
export const BlueprintPersistenceLive = Layer.mergeAll(
  BlueprintRepoPersistenceLive,
  BlueprintCoverDomainLive
)
const BlueprintInstallLive = Layer.mergeAll(BlueprintPersistenceLive, BetterAuthWorkspaceConLive)
const BlueprintCatalogLive = Layer.mergeAll(
  BlueprintPersistenceLive,
  BlueprintDiscoveryActionsRepoLive
)
export const scheduleBlueprint = (...args: Parameters<typeof scheduleBlueprintWorkflow>) =>
  scheduleBlueprintWorkflow(...args).pipe(Effect.provide(BlueprintPersistenceLive))
export const installBlueprint = (...args: Parameters<typeof install>) =>
  install(...args).pipe(Effect.provide(BlueprintInstallLive))
export const previewBlueprint = (...args: Parameters<typeof preview>) =>
  preview(...args).pipe(Effect.provide(BlueprintPersistenceLive))
export const blueprintStatus = (...args: Parameters<typeof status>) =>
  status(...args).pipe(Effect.provide(BlueprintPersistenceLive))
export const blueprintCatalog = (actorId: string) =>
  blueprintCatalogWorkflow(actorId).pipe(Effect.provide(BlueprintCatalogLive))

export const blueprintCatalogPage = (actorId: string, request: BlueprintCatalogPageInput) =>
  blueprintCatalogPageWorkflow(actorId, request, {
    recommendationBaselineEnabled:
      process.env.BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED !== 'false',
    personalLikeRankingEnabled: process.env.BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED !== 'false',
  }).pipe(Effect.provide(BlueprintCatalogLive))

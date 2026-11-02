import { Effect, Layer } from 'effect'
import { BlueprintDiscoveryActionsRepoLive } from '../repos/blueprint-discovery-actions.repo.live'
import {
  enrichBlueprintCatalog as enrich,
  listBlueprintPreferences as listPreferences,
  updateBlueprintPreference as updatePreference,
  getBlueprintMeasurementSettings as getMeasurementSettings,
  updateBlueprintMeasurementSettings as updateMeasurementSettings,
  recordBlueprintDiscoverySignal as recordSignal,
  enrichBlueprintCatalogPage as enrichPage,
} from './blueprint-discovery-actions.workflow'
import type { BlueprintCatalogPageInput } from '../services/blueprint-discovery'

const DiscoveryActionsLive = Layer.mergeAll(BlueprintDiscoveryActionsRepoLive)
const provideDiscovery = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(Effect.provide(DiscoveryActionsLive))

export const enrichBlueprintCatalog = (...args: Parameters<typeof enrich>) =>
  provideDiscovery(enrich(...args))
export const listBlueprintPreferences = (...args: Parameters<typeof listPreferences>) =>
  provideDiscovery(listPreferences(...args))
export const updateBlueprintPreference = (...args: Parameters<typeof updatePreference>) =>
  provideDiscovery(updatePreference(...args))
export const getBlueprintMeasurementSettings = (
  ...args: Parameters<typeof getMeasurementSettings>
) => provideDiscovery(getMeasurementSettings(...args))
export const updateBlueprintMeasurementSettings = (
  ...args: Parameters<typeof updateMeasurementSettings>
) => provideDiscovery(updateMeasurementSettings(...args))
export const recordBlueprintDiscoverySignal = (...args: Parameters<typeof recordSignal>) =>
  provideDiscovery(recordSignal(...args))
export const enrichBlueprintCatalogPage = (
  actorId: string,
  catalogEntries: Parameters<typeof enrichPage>[1],
  request: BlueprintCatalogPageInput
) =>
  provideDiscovery(
    enrichPage(actorId, catalogEntries, request, {
      recommendationBaselineEnabled:
        process.env.BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED !== 'false',
      personalLikeRankingEnabled: process.env.BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED !== 'false',
    })
  )

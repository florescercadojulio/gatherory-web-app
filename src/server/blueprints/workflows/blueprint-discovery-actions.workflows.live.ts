import { Effect, Layer } from 'effect'
import {
  BlueprintPreferenceListRequestSchema,
  BlueprintPreferenceListResponseSchema,
  BlueprintPreferenceMutationResponseSchema,
} from '@/contracts/blueprint-preferences.contracts'
import { BlueprintMeasurementSettingsSchema } from '@/contracts/blueprint-measurement.contracts'
import { InvalidInputError } from '@/lib/domain-errors'
import { BlueprintDiscoveryActionsRepoLive } from '../repos/blueprint-discovery-actions.repo.live'
import { BlueprintDiscoveryActionsRepo } from '../repos/blueprint-discovery-actions.repo'
import {
  applyBlueprintViewerPreferences,
  buildBlueprintCatalog,
  blueprintLikeAffinityLikes,
  blueprintLikeAffinitySources,
  pageBlueprintCatalog,
  publicBlueprintCatalog,
} from '../services/blueprint-discovery'
import { buildBlueprintLikeAffinity } from '../services/blueprint-like-affinity'
import type { BlueprintCatalogPageInput } from '../services/blueprint-discovery'

const DiscoveryActionsLive = Layer.mergeAll(BlueprintDiscoveryActionsRepoLive)

export const enrichBlueprintCatalog = (
  actorId: string,
  catalogEntries: Parameters<typeof buildBlueprintCatalog>[0]
) =>
  Effect.gen(function* () {
    const repo = yield* BlueprintDiscoveryActionsRepo
    const catalog = buildBlueprintCatalog(catalogEntries)
    const stateMap = yield* repo.getPreferenceStates(
      actorId,
      catalog.entries.map((entry) => entry.catalogKey)
    )
    return publicBlueprintCatalog({
      ...catalog,
      entries: applyBlueprintViewerPreferences(catalog.entries, stateMap, false),
    })
  }).pipe(Effect.provide(DiscoveryActionsLive))

export const listBlueprintPreferences = (
  actorId: string,
  input: unknown,
  catalogEntries: Parameters<typeof buildBlueprintCatalog>[0]
) =>
  Effect.gen(function* () {
    const request = yield* Effect.try({
      try: () => BlueprintPreferenceListRequestSchema.parse(input),
      catch: () =>
        new InvalidInputError({
          category: 'validation',
          code: 'BLUEPRINT_PREFERENCE_INPUT_INVALID',
          userMessageKey: 'serverErrors.VALIDATION',
        }),
    })
    const repo = yield* BlueprintDiscoveryActionsRepo
    const page = yield* repo.listPreferences(actorId, request)
    const catalog = buildBlueprintCatalog(catalogEntries)
    const byKey = new Map(catalog.entries.map((entry) => [entry.catalogKey, entry]))
    return BlueprintPreferenceListResponseSchema.parse({
      items: page.items.map((row) => {
        // Hidden management also needs the current public title so people can
        // identify which Blueprint to show again. Never retain private labels.
        const current = byKey.get(row.catalogKey)
        return {
          catalogKey: row.catalogKey,
          revision: row.bookmarkRevision ?? row.revision,
          contentHash: row.bookmarkContentHash ?? row.contentHash,
          liked: row.liked,
          bookmarked: row.bookmarked,
          notInterested: row.notInterested,
          bookmarkAvailability: current ? 'available' : 'unavailable',
          likeAvailability: current ? 'available' : 'unavailable',
          notInterestedAvailability: current ? 'available' : 'unavailable',
          likeRevision: row.likeRevision,
          likeContentHash: row.likeContentHash,
          bookmarkRevision: row.bookmarkRevision,
          bookmarkContentHash: row.bookmarkContentHash,
          notInterestedRevision: row.notInterestedRevision,
          notInterestedContentHash: row.notInterestedContentHash,
          ...(current
            ? {
                entry: {
                  catalogKey: current.catalogKey,
                  revision: current.revision,
                  contentHash: current.contentHash,
                  name: current.definition.blueprint.name,
                  ...(current.discovery.coverImageURL
                    ? { coverImageURL: current.discovery.coverImageURL }
                    : {}),
                  ...(current.creator?.displayName
                    ? { creatorName: current.creator.displayName }
                    : {}),
                },
              }
            : {}),
        }
      }),
      ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}),
    })
  }).pipe(Effect.provide(DiscoveryActionsLive))

export const updateBlueprintPreference = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    const repo = yield* BlueprintDiscoveryActionsRepo
    return BlueprintPreferenceMutationResponseSchema.parse(
      yield* repo.updatePreference(actorId, input as never)
    )
  }).pipe(Effect.provide(DiscoveryActionsLive))

export const getBlueprintMeasurementSettings = (actorId: string) =>
  Effect.gen(function* () {
    const repo = yield* BlueprintDiscoveryActionsRepo
    return BlueprintMeasurementSettingsSchema.parse(yield* repo.getMeasurementSettings(actorId))
  }).pipe(Effect.provide(DiscoveryActionsLive))

export const updateBlueprintMeasurementSettings = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    const repo = yield* BlueprintDiscoveryActionsRepo
    return BlueprintMeasurementSettingsSchema.parse(
      yield* repo.updateMeasurementSettings(actorId, input as never)
    )
  }).pipe(Effect.provide(DiscoveryActionsLive))

export const recordBlueprintDiscoverySignal = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    const repo = yield* BlueprintDiscoveryActionsRepo
    return yield* repo.recordSignal(actorId, input as never)
  }).pipe(Effect.provide(DiscoveryActionsLive))

export const enrichBlueprintCatalogPage = (
  actorId: string,
  catalogEntries: Parameters<typeof buildBlueprintCatalog>[0],
  request: BlueprintCatalogPageInput
) =>
  Effect.gen(function* () {
    const repo = yield* BlueprintDiscoveryActionsRepo
    const catalog = buildBlueprintCatalog(catalogEntries)
    const stateMap = yield* repo.getPreferenceStates(
      actorId,
      catalog.entries.map((entry) => entry.catalogKey)
    )
    const personalizedCatalog = {
      ...catalog,
      entries: applyBlueprintViewerPreferences(
        catalog.entries,
        stateMap,
        !Boolean(request.q.trim())
      ),
    }
    let personalLikes: ReturnType<typeof buildBlueprintLikeAffinity> | undefined
    if (
      request.ranking === 'baseline_v1' &&
      process.env.BLUEPRINT_PERSONAL_LIKE_RANKING_ENABLED !== 'false'
    ) {
      try {
        personalLikes = buildBlueprintLikeAffinity(
          blueprintLikeAffinitySources(catalog),
          blueprintLikeAffinityLikes(Object.values(stateMap))
        )
      } catch {
        // On affinity failure, retain the existing deterministic baseline order.
        personalLikes = undefined
      }
    }
    // Apply suppression before paging and scope cursors to this account. A hide or
    // unhide changes the catalog digest, so continuation restarts consistently.
    const result = pageBlueprintCatalog(personalizedCatalog, request, actorId, {
      enabled: process.env.BLUEPRINT_RECOMMENDATION_BASELINE_ENABLED !== 'false',
      ...(personalLikes ? { personalLikes: { enabled: true, affinity: personalLikes } } : {}),
    })
    if (!result.ok) return result
    const eligibleEntries = result.page.entries
    const exposures = yield* repo.issueExposures(
      actorId,
      eligibleEntries.map((entry, index) => ({
        catalogKey: entry.catalogKey,
        revision: entry.revision,
        contentHash: entry.contentHash,
        surface: request.q ? 'search' : request.category ? 'category' : 'browse',
        rank: result.offset + index + 1,
        snapshotId: result.snapshotId,
        rankingContext: result.rankingContext,
      }))
    )
    const exposureMap = new Map(exposures.map((exposure) => [exposure.catalogKey, exposure]))
    return {
      ok: true as const,
      page: {
        ...result.page,
        entries: eligibleEntries.map((entry) => {
          const exposure = exposureMap.get(entry.catalogKey)
          return {
            ...entry,
            ...(exposure
              ? {
                  discoveryContext: {
                    exposureId: exposure.exposureId,
                    expiresAt: exposure.expiresAt.toISOString(),
                  },
                }
              : {}),
          }
        }),
      },
    }
  }).pipe(Effect.provide(DiscoveryActionsLive))

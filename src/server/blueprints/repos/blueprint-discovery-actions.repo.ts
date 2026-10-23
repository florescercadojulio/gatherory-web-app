import { Context, type Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'
import type {
  BlueprintPreferenceMutation,
  BlueprintPreferenceState,
} from '@/contracts/blueprint-preferences.contracts'
import type { BlueprintMeasurementSignal } from '@/contracts/blueprint-measurement.contracts'

export type BlueprintRankingContext = {
  mode: 'baseline_v1' | 'catalog'
  algorithmVersion: string
  configurationVersion: string
  configurationDigest: string
  asOf: string
}

export type BlueprintPreferencePage = {
  items: Array<
    BlueprintPreferenceState & {
      likeRevision: number | null
      likeContentHash: string | null
      bookmarkRevision: number | null
      bookmarkContentHash: string | null
      notInterestedRevision: number | null
      notInterestedContentHash: string | null
    }
  >
  nextCursor?: string
}

/** Internal ranking fields; route/workflow boundaries must strip these. */
export type BlueprintDiscoveryPreferenceState = BlueprintPreferenceState & {
  likeRevision: number | null
  likeContentHash: string | null
}

export class BlueprintDiscoveryActionsRepo extends Context.Service<
  BlueprintDiscoveryActionsRepo,
  {
    listPreferences: (
      actorId: string,
      input: { limit: number; cursor?: string }
    ) => Effect.Effect<BlueprintPreferencePage, DomainError>
    getPreferenceStates: (
      actorId: string,
      catalogKeys: string[]
    ) => Effect.Effect<Record<string, BlueprintDiscoveryPreferenceState>, DomainError>
    updatePreference: (
      actorId: string,
      input: BlueprintPreferenceMutation
    ) => Effect.Effect<BlueprintPreferenceState & { requestId: string }, DomainError>
    getMeasurementSettings: (actorId: string) => Effect.Effect<{ enabled: boolean }, DomainError>
    updateMeasurementSettings: (
      actorId: string,
      input: { requestId: string; enabled: boolean }
    ) => Effect.Effect<{ enabled: boolean }, DomainError>
    issueExposures: (
      actorId: string,
      input: Array<{
        catalogKey: string
        revision: number
        contentHash: string
        surface: 'browse' | 'category' | 'search'
        rank: number
        snapshotId?: string
        rankingContext?: BlueprintRankingContext
      }>
    ) => Effect.Effect<
      Array<{ catalogKey: string; exposureId: string; expiresAt: Date }>,
      DomainError
    >
    recordSignal: (
      actorId: string,
      input: BlueprintMeasurementSignal
    ) => Effect.Effect<{ accepted: true }, DomainError>
    cleanupExpiredMeasurement: (limit: number) => Effect.Effect<{ deleted: number }, DomainError>
  }
>()('BlueprintDiscoveryActionsRepo') {}

import { Context, Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'
import type {
  BlueprintCatalogDefinition,
  BlueprintExpandedPlan,
  BlueprintInstallInput,
} from '@/contracts/blueprint-install.contracts'

export type BlueprintActor = { id: string; name: string; email: string }
export type BlueprintManifest = {
  events: Record<string, string>
  ideas: Record<string, string>
  guides: Record<string, string>
  personID: string
  participations: Record<string, string>
}
export type BlueprintInstallResult = {
  installationID: string
  organizationID: string
  scopeID: string
  manifest: BlueprintManifest
}
export type CatalogRevision = {
  id: string
  catalogKey: string
  revision: number
  contentHash: string
  definition: BlueprintCatalogDefinition
  description?: string
}
export type InstallationRecord = {
  id: string
  requestHash: string
  state: string
  plan: BlueprintExpandedPlan
  provisioningSlug: string
  organizationId: string | null
  result: BlueprintInstallResult | null
}
export class BlueprintRepo extends Context.Service<
  BlueprintRepo,
  {
    catalog: (actorId: string) => Effect.Effect<CatalogRevision[], DomainError>
    revision: (
      catalogKey: string,
      revision: number,
      actorId: string,
      shareToken?: string
    ) => Effect.Effect<CatalogRevision, DomainError>
    status: (
      actorId: string,
      requestId: string
    ) => Effect.Effect<InstallationRecord | null, DomainError>
    claim: (input: {
      actor: BlueprintActor
      request: BlueprintInstallInput
      hash: string
      plan: BlueprintExpandedPlan
      revision: CatalogRevision
      token: string
    }) => Effect.Effect<InstallationRecord, DomainError>
    acquire: (
      actorId: string,
      requestId: string,
      hash: string,
      token: string
    ) => Effect.Effect<InstallationRecord, DomainError>
    recoverWorkspace: (
      actorId: string,
      installationId: string
    ) => Effect.Effect<string | null, DomainError>
    provisioned: (
      actorId: string,
      installationId: string,
      token: string,
      organizationId: string
    ) => Effect.Effect<void, DomainError>
    complete: (
      actor: BlueprintActor,
      installationId: string,
      token: string
    ) => Effect.Effect<BlueprintInstallResult, DomainError>
    release: (
      actorId: string,
      installationId: string,
      token: string
    ) => Effect.Effect<void, DomainError>
  }
>()('BlueprintRepo') {}

/** Fault seam at the last write boundary; production is a no-op. */
export class BlueprintInstallCheckpoint extends Context.Service<
  BlueprintInstallCheckpoint,
  {
    afterProjection: () => Effect.Effect<void, DomainError>
  }
>()('BlueprintInstallCheckpoint') {}

import { Effect, Layer } from 'effect'
import { scheduleBlueprintWorkflow } from './schedule-blueprint.workflow'
import type { BlueprintCatalogPageInput } from '../services/blueprint-discovery'
import { ConflictError, InvalidInputError } from '@/lib/domain-errors'
import { BlueprintRepoLive } from '../repos/blueprint.repo.live'
import { BlueprintInstallCheckpoint, BlueprintRepo } from '../contracts/blueprint-runtime.contracts'
import { BetterAuthWorkspaceConLive } from '@/server/workspaces/connectors/better-auth.con.live'
import {
  installBlueprintWorkflow as install,
  previewBlueprintWorkflow as preview,
  blueprintStatusWorkflow as status,
} from './install-blueprint.workflow'
import { BlueprintCoverStorageLive } from '@/server/blueprint-media/blueprint-cover.storage.live'
import {
  enrichBlueprintCatalog,
  enrichBlueprintCatalogPage,
} from './blueprint-discovery-actions.workflows.live'

export const BlueprintPersistenceLive = BlueprintRepoLive.pipe(
  Layer.provide(
    Layer.mergeAll(
      Layer.succeed(BlueprintInstallCheckpoint, { afterProjection: () => Effect.void }),
      BlueprintCoverStorageLive
    )
  )
)
const BlueprintInstallLive = Layer.mergeAll(BlueprintPersistenceLive, BetterAuthWorkspaceConLive)
export const scheduleBlueprint = (...args: Parameters<typeof scheduleBlueprintWorkflow>) =>
  scheduleBlueprintWorkflow(...args).pipe(Effect.provide(BlueprintPersistenceLive))
export const installBlueprint = (...args: Parameters<typeof install>) =>
  install(...args).pipe(Effect.provide(BlueprintInstallLive))
export const previewBlueprint = (...args: Parameters<typeof preview>) =>
  preview(...args).pipe(Effect.provide(BlueprintPersistenceLive))
export const blueprintStatus = (...args: Parameters<typeof status>) =>
  status(...args).pipe(Effect.provide(BlueprintPersistenceLive))
export const blueprintCatalog = (actorId: string) =>
  Effect.gen(function* () {
    return yield* enrichBlueprintCatalog(actorId, yield* (yield* BlueprintRepo).catalog(actorId))
  }).pipe(Effect.provide(BlueprintPersistenceLive))

export const blueprintCatalogPage = (actorId: string, request: BlueprintCatalogPageInput) =>
  Effect.gen(function* () {
    const catalogEntries = yield* (yield* BlueprintRepo).catalog(actorId)
    const result = yield* enrichBlueprintCatalogPage(actorId, catalogEntries, request)
    if (!result.ok) {
      return yield* Effect.fail(
        result.reason === 'invalid_cursor'
          ? new InvalidInputError({
              category: 'validation',
              code: 'BLUEPRINT_CATALOG_CURSOR_INVALID',
              userMessageKey: 'serverErrors.VALIDATION',
            })
          : new ConflictError({
              category: 'conflict',
              code: 'BLUEPRINT_CATALOG_CURSOR_STALE',
              userMessageKey: 'serverErrors.CONFLICT',
            })
      )
    }
    return result.page
  }).pipe(Effect.provide(BlueprintPersistenceLive))

import { Effect, Layer } from 'effect'
import { scheduleBlueprintWorkflow } from './schedule-blueprint.workflow'
import { buildBlueprintCatalog } from '../services/blueprint-discovery'
import { BlueprintRepoLive } from '../repos/blueprint.repo.live'
import { BlueprintInstallCheckpoint, BlueprintRepo } from '../contracts/blueprint-runtime.contracts'
import { BetterAuthWorkspaceConLive } from '@/server/workspaces/connectors/better-auth.con.live'
import {
  installBlueprintWorkflow as install,
  previewBlueprintWorkflow as preview,
  blueprintStatusWorkflow as status,
} from './install-blueprint.workflow'

export const BlueprintPersistenceLive = BlueprintRepoLive.pipe(
  Layer.provide(Layer.succeed(BlueprintInstallCheckpoint, { afterProjection: () => Effect.void }))
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
    return buildBlueprintCatalog(yield* (yield* BlueprintRepo).catalog(actorId))
  }).pipe(Effect.provide(BlueprintPersistenceLive))

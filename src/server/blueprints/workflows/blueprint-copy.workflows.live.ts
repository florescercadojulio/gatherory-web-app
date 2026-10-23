import { Effect, Layer } from 'effect'
import { BlueprintPersonalRepoLive } from '../repos/blueprint-personal.repo.live'
import { BlueprintAuthoringRepoLive } from '../repos/blueprint-authoring.repo.live'
import { BetterAuthWorkspaceConLive } from '@/server/workspaces/connectors/better-auth.con.live'
import { createBlueprintCopyWorkflow } from './blueprint-copy.workflow'
import { BlueprintPersistenceLive } from './blueprint.workflows.live'
import { BlueprintCoverStorageLive } from '@/server/blueprint-media/blueprint-cover.storage.live'

const BlueprintCopyLive = Layer.mergeAll(
  BlueprintPersonalRepoLive,
  BlueprintAuthoringRepoLive,
  BetterAuthWorkspaceConLive,
  BlueprintPersistenceLive,
  BlueprintCoverStorageLive
)

export const createBlueprintCopy = (...args: Parameters<typeof createBlueprintCopyWorkflow>) =>
  createBlueprintCopyWorkflow(...args).pipe(Effect.provide(BlueprintCopyLive))

import { Effect, Layer } from 'effect'
import * as workflows from './blueprint-authoring.workflow'
import { BlueprintAuthoringRepoLive } from '../repos/blueprint-authoring.repo.live'
import { BlueprintPersistenceLive } from './blueprint.workflows.live'
import { BetterAuthWorkspaceConLive } from '@/server/workspaces/connectors/better-auth.con.live'

export const BlueprintAuthoringLive = Layer.mergeAll(
  BlueprintAuthoringRepoLive,
  BlueprintPersistenceLive
)
export const getBlueprintAuthoringContext = (
  ...args: Parameters<typeof workflows.getBlueprintAuthoringContextWorkflow>
) =>
  workflows
    .getBlueprintAuthoringContextWorkflow(...args)
    .pipe(Effect.provide(BlueprintAuthoringLive))
export const listBlueprintTemplates = (
  ...args: Parameters<typeof workflows.listBlueprintTemplatesWorkflow>
) => workflows.listBlueprintTemplatesWorkflow(...args).pipe(Effect.provide(BlueprintAuthoringLive))
export const getBlueprintDraft = (
  ...args: Parameters<typeof workflows.getBlueprintDraftWorkflow>
) => workflows.getBlueprintDraftWorkflow(...args).pipe(Effect.provide(BlueprintAuthoringLive))
export const getBlueprintStarter = (
  ...args: Parameters<typeof workflows.getBlueprintStarterWorkflow>
) => workflows.getBlueprintStarterWorkflow(...args).pipe(Effect.provide(BlueprintAuthoringLive))
export const createBlueprintDraft = (
  ...args: Parameters<typeof workflows.createBlueprintDraftWorkflow>
) => workflows.createBlueprintDraftWorkflow(...args).pipe(Effect.provide(BlueprintAuthoringLive))
export const saveBlueprintDraft = (
  ...args: Parameters<typeof workflows.saveBlueprintDraftWorkflow>
) => workflows.saveBlueprintDraftWorkflow(...args).pipe(Effect.provide(BlueprintAuthoringLive))
export const publishBlueprintDraft = (
  ...args: Parameters<typeof workflows.publishBlueprintDraftWorkflow>
) => workflows.publishBlueprintDraftWorkflow(...args).pipe(Effect.provide(BlueprintAuthoringLive))
export const retireBlueprintTemplate = (
  ...args: Parameters<typeof workflows.retireBlueprintTemplateWorkflow>
) => workflows.retireBlueprintTemplateWorkflow(...args).pipe(Effect.provide(BlueprintAuthoringLive))
export const deleteBlueprintDraft = (
  ...args: Parameters<typeof workflows.deleteBlueprintDraftWorkflow>
) => workflows.deleteBlueprintDraftWorkflow(...args).pipe(Effect.provide(BlueprintAuthoringLive))
export const previewBlueprintDraft = (
  ...args: Parameters<typeof workflows.previewBlueprintDraftWorkflow>
) => workflows.previewBlueprintDraftWorkflow(...args).pipe(Effect.provide(BlueprintAuthoringLive))
export const createBlueprintAuthoringWorkspace = (
  ...args: Parameters<typeof workflows.createBlueprintAuthoringWorkspaceWorkflow>
) =>
  workflows
    .createBlueprintAuthoringWorkspaceWorkflow(...args)
    .pipe(Effect.provide(Layer.mergeAll(BlueprintAuthoringLive, BetterAuthWorkspaceConLive)))

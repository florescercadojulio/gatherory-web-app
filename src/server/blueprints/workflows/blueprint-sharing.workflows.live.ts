import { Effect } from 'effect'
import { BlueprintSharingRepoLive } from '../repos/blueprint-sharing.repo.live'
import * as workflow from './blueprint-sharing.workflow'

export const listBlueprintShareLinks = (
  ...args: Parameters<typeof workflow.listBlueprintShareLinksWorkflow>
) =>
  workflow.listBlueprintShareLinksWorkflow(...args).pipe(Effect.provide(BlueprintSharingRepoLive))
export const createBlueprintShareLink = (
  ...args: Parameters<typeof workflow.createBlueprintShareLinkWorkflow>
) =>
  workflow.createBlueprintShareLinkWorkflow(...args).pipe(Effect.provide(BlueprintSharingRepoLive))
export const revokeBlueprintShareLink = (
  ...args: Parameters<typeof workflow.revokeBlueprintShareLinkWorkflow>
) =>
  workflow.revokeBlueprintShareLinkWorkflow(...args).pipe(Effect.provide(BlueprintSharingRepoLive))
export const resolveBlueprintShareLink = (
  ...args: Parameters<typeof workflow.resolveBlueprintShareLinkWorkflow>
) =>
  workflow.resolveBlueprintShareLinkWorkflow(...args).pipe(Effect.provide(BlueprintSharingRepoLive))

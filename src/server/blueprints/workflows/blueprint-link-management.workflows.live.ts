import { Effect } from 'effect'
import { BlueprintLinkManagementRepoLive } from '../repos/blueprint-link-management.repo.live'
import { manageBlueprintLinksWorkflow } from './blueprint-link-management.workflow'

export const manageBlueprintLinks = (...args: Parameters<typeof manageBlueprintLinksWorkflow>) =>
  manageBlueprintLinksWorkflow(...args).pipe(Effect.provide(BlueprintLinkManagementRepoLive))

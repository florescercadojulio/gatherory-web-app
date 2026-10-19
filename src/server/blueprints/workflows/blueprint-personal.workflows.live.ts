import { Effect } from 'effect'
import { BlueprintPersonalRepoLive } from '../repos/blueprint-personal.repo.live'
import { managePersonalBlueprintsWorkflow } from './blueprint-personal.workflow'

export const managePersonalBlueprints = (
  ...args: Parameters<typeof managePersonalBlueprintsWorkflow>
) => managePersonalBlueprintsWorkflow(...args).pipe(Effect.provide(BlueprintPersonalRepoLive))

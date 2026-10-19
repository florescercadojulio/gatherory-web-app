import { Effect } from 'effect'
import { BlueprintLibraryRepoLive } from '../repos/blueprint-library.repo.live'
import { listUsedBlueprintsWorkflow as program } from './blueprint-library.workflow'

const BlueprintLibraryLive = BlueprintLibraryRepoLive

export const listUsedBlueprints = (actorId: string) =>
  program(actorId).pipe(Effect.provide(BlueprintLibraryLive))

import { Effect, Layer } from 'effect'
import { BlueprintPersonalRepoLive } from '../repos/blueprint-personal.repo.live'
import { managePersonalBlueprintsWorkflow } from './blueprint-personal.workflow'
import { BlueprintCoverDomainLive } from '@/server/blueprint-media/blueprint-media.layers.live'

const BlueprintPersonalLive = Layer.mergeAll(BlueprintPersonalRepoLive, BlueprintCoverDomainLive)

export const managePersonalBlueprints = (
  ...args: Parameters<typeof managePersonalBlueprintsWorkflow>
) => managePersonalBlueprintsWorkflow(...args).pipe(Effect.provide(BlueprintPersonalLive))

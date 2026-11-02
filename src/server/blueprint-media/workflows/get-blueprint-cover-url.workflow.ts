import { Effect } from 'effect'
import type { GetBlueprintCoverUrlInput } from '@/contracts/blueprint-media.contracts'
import { BlueprintCoverService } from '../services/blueprint-cover.service'

export const getBlueprintCoverUrlWorkflow = (input: {
  actorUserId: string | null
  cover: GetBlueprintCoverUrlInput
}) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintCoverService).getUrl(input)
  })

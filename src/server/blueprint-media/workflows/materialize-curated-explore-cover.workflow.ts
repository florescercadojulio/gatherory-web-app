import { Effect } from 'effect'
import { BlueprintCoverService } from '../services/blueprint-cover.service'

export type MaterializeCuratedExploreCoverInput = {
  actorUserId: string
  requestId: string
  catalogKey: string
  revision: number
  contentHash: string
}

export const materializeCuratedExploreCoverWorkflow = (
  input: MaterializeCuratedExploreCoverInput
) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintCoverService).materializeCuratedExploreCover(input)
  })

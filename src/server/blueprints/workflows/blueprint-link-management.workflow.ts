import { Effect } from 'effect'
import { BlueprintLinkManagementInputSchema } from '@/contracts/blueprint-link-management.contracts'
import { validateInput } from '@/server/validation'
import { BlueprintLinkManagementRepo } from '../repos/blueprint-link-management.repo'

export const manageBlueprintLinksWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    const request = yield* validateInput(BlueprintLinkManagementInputSchema, input)
    return yield* (yield* BlueprintLinkManagementRepo).execute(actorId, request)
  })

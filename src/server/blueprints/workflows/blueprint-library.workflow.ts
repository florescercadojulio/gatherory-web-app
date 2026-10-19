import { Effect } from 'effect'
import { BlueprintLibraryResponseSchema } from '@/contracts/blueprint-library.contracts'
import { serverOperationError } from '@/lib/domain-errors'
import { BlueprintLibraryRepo } from '../repos/blueprint-library.repo'

export const listUsedBlueprintsWorkflow = (actorId: string) =>
  Effect.gen(function* () {
    const installations = yield* (yield* BlueprintLibraryRepo).listUsed(actorId)
    return yield* Effect.try({
      try: () => BlueprintLibraryResponseSchema.parse({ installations }),
      catch: (cause) =>
        serverOperationError(cause, {
          category: 'system',
          code: 'BLUEPRINT_LIBRARY_RESPONSE_INVALID',
          userMessageKey: 'serverErrors.SYSTEM',
        }),
    })
  })

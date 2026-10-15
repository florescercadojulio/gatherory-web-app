import { Effect } from 'effect'
import { BlueprintScheduleInputSchema } from '@/contracts/blueprint-schedule.contracts'
import { ConflictError, InvalidInputError } from '@/lib/domain-errors'
import { validateInput } from '@/server/validation'
import { BlueprintRepo } from '../contracts/blueprint-runtime.contracts'
import { suggestBlueprintSchedule } from '../planning/suggest-blueprint-schedule.server'

/** Read-only suggestions. Confirmation is a separate client action. */
export const scheduleBlueprintWorkflow = (input: unknown, actorId: string) =>
  Effect.gen(function* () {
    const request = yield* validateInput(BlueprintScheduleInputSchema, input)
    const repo = yield* BlueprintRepo
    const revision = yield* repo.revision(request.catalogKey, request.revision, actorId)
    if (revision.contentHash !== request.contentHash)
      return yield* Effect.fail(
        new ConflictError({
          category: 'conflict',
          code: 'BLUEPRINT_REVISION_CHANGED',
          userMessageKey: 'serverErrors.CONFLICT',
        })
      )
    return yield* Effect.try({
      try: () => suggestBlueprintSchedule(request, revision.definition),
      catch: (cause) =>
        new InvalidInputError({
          category: 'validation',
          code: 'INVALID_BLUEPRINT_SCHEDULE',
          userMessageKey: 'serverErrors.VALIDATION',
          cause,
        }),
    })
  })

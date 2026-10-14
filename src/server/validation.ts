import { Effect } from 'effect'
import { z } from 'zod'
import { InvalidInputError } from './effect-utils'

export function validateInput<T extends z.ZodType>(schema: T, input: unknown) {
  return Effect.gen(function* () {
    const parsed = yield* Effect.try({
      try: () => schema.safeParse(input),
      catch: (cause) =>
        new InvalidInputError({
          category: 'validation',
          code: 'INVALID_INPUT',
          userMessageKey: 'serverErrors.VALIDATION',
          cause,
        }),
    })
    if (!parsed.success)
      return yield* Effect.fail(
        new InvalidInputError({
          category: 'validation',
          code: 'INVALID_INPUT',
          userMessageKey: 'serverErrors.VALIDATION',
          cause: parsed.error,
        })
      )
    return parsed.data
  })
}

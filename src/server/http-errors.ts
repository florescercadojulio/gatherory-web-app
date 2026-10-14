import { Effect } from 'effect'
import { ForbiddenError, InvalidInputError, tryServerOperation } from './effect-utils'
import { nativeSyncUser } from './sync/handlers/native-sync-auth.handler'
export { validateInput } from './validation'

export function requestUser(request: Request) {
  return tryServerOperation(
    {
      category: 'system',
      code: 'SESSION_LOOKUP_FAILED',
      userMessageKey: 'serverErrors.SESSION_LOOKUP_FAILED',
    },
    () => nativeSyncUser(request)
  ).pipe(
    Effect.flatMap((user) =>
      user
        ? Effect.succeed(user)
        : Effect.fail(
            new ForbiddenError({
              category: 'authorization',
              code: 'UNAUTHORIZED',
              httpStatus: 401,
              userMessageKey: 'serverErrors.UNAUTHORIZED',
            })
          )
    )
  )
}

export function requestJson(request: Request) {
  return Effect.tryPromise({
    try: () => request.json(),
    catch: (cause) =>
      new InvalidInputError({
        category: 'validation',
        code: 'INVALID_JSON',
        userMessageKey: 'serverErrors.VALIDATION',
        debugMessage: 'The request body was not valid JSON.',
        cause,
      }),
  })
}

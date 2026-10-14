import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { ForbiddenError, runServerResponse } from '@/server/effect-utils'
import { requestJson, requestUser, validateInput } from '@/server/http-errors'
import { SaveAppleTokenInput } from '../contracts/apple-token.contract'
import { saveAppleTokenWorkflow } from '../workflows/apple-token.workflows.live'

export function handleAppleTokenRequest(request: Request) {
  return runServerResponse(
    Effect.gen(function* () {
      if (!/^Bearer \S+$/i.test(request.headers.get('authorization') ?? '')) {
        return yield* Effect.fail(
          new ForbiddenError({
            category: 'authorization',
            code: 'UNAUTHORIZED',
            userMessageKey: 'serverErrors.UNAUTHORIZED',
            httpStatus: 401,
          })
        )
      }
      const user = yield* requestUser(request)
      const input = yield* validateInput(SaveAppleTokenInput, yield* requestJson(request))
      return yield* saveAppleTokenWorkflow(input, user.id).pipe(Effect.provide(PgClientLive))
    }),
    { headers: request.headers, successEnvelope: false, legacyErrorCode: true }
  )
}

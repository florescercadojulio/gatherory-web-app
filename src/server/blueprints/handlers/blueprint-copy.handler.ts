import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { BlueprintCopyResponseSchema } from '@/contracts/blueprint-copy.contracts'
import { runServerResponse } from '@/server/effect-utils'
import { requestJson, requestUser } from '@/server/http-errors'
import { createBlueprintCopy } from '../workflows/blueprint-copy.workflows.live'

export async function handleBlueprintCopyRequest(request: Request) {
  const response = await runServerResponse(
    Effect.gen(function* () {
      const user = yield* requestUser(request)
      // Better Auth returns the complete session user. Keep the copy workflow
      // actor explicit, as in native blueprint creation, so auth-only fields
      // do not fail its strict { id, name } contract.
      const result = yield* createBlueprintCopy(
        { id: user.id, name: user.name },
        yield* requestJson(request)
      )
      return BlueprintCopyResponseSchema.parse(result)
    }).pipe(Effect.provide(PgClientLive)),
    {
      headers: request.headers,
      operation: 'blueprints.copy.create',
      successEnvelope: false,
      legacyErrorCode: true,
    }
  )
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  return response
}

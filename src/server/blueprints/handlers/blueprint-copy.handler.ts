import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { BlueprintCopyResponseSchema } from '@/contracts/blueprint-copy.contracts'
import { runServerResponse } from '@/server/effect-utils'
import { requestJson, requestUser } from '@/server/http-errors'
import { createBlueprintCopy } from '../workflows/blueprint-copy.workflows.live'

export async function handleBlueprintCopyRequest(request: Request) {
  const response = await runServerResponse(
    Effect.gen(function* () {
      const actor = yield* requestUser(request)
      const result = yield* createBlueprintCopy(actor, yield* requestJson(request))
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

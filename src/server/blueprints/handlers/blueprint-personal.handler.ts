import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { requestJson, requestUser } from '@/server/http-errors'
import { runServerResponse } from '@/server/effect-utils'
import { managePersonalBlueprints } from '../workflows/blueprint-personal.workflows.live'

export const handlePersonalBlueprintRequest = async (request: Request) => {
  const response = await runServerResponse(
    Effect.gen(function* () {
      const actor = yield* requestUser(request)
      return yield* managePersonalBlueprints(actor.id, yield* requestJson(request))
    }).pipe(Effect.provide(PgClientLive)),
    {
      headers: request.headers,
      operation: 'blueprints.personal.manage',
      successEnvelope: false,
      legacyErrorCode: true,
    }
  )
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}

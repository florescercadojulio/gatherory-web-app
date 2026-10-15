import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { requestJson, requestUser } from '@/server/http-errors'
import { runServerResponse } from '@/server/effect-utils'
import { manageBlueprintLinks } from '../workflows/blueprint-link-management.workflows.live'

export async function handleBlueprintLinkManagementRequest(request: Request) {
  const response = await runServerResponse(
    Effect.gen(function* () {
      const actor = yield* requestUser(request)
      return yield* manageBlueprintLinks(actor.id, yield* requestJson(request))
    }).pipe(Effect.provide(PgClientLive)),
    {
      headers: request.headers,
      operation: 'blueprint.sharing.manage',
      successEnvelope: false,
      legacyErrorCode: true,
    }
  )
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  return response
}

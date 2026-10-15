import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { runServerResponse } from '@/server/effect-utils'
import { resolveBlueprintShareLink } from '../workflows/blueprint-sharing.workflows.live'

export async function handleBlueprintShareRequest(request: Request, token: string) {
  const response = await runServerResponse(
    resolveBlueprintShareLink({ token }).pipe(Effect.provide(PgClientLive)),
    {
      headers: request.headers,
      operation: 'blueprint.sharing.resolve',
      successEnvelope: false,
      legacyErrorCode: true,
    }
  )
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  return response
}

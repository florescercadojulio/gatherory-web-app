import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { requestUser } from '@/server/http-errors'
import { runServerResponse } from '@/server/effect-utils'
import { listUsedBlueprints } from '../workflows/blueprint-library.workflows.live'

export function handleBlueprintLibraryRequest(request: Request) {
  return runServerResponse(
    Effect.gen(function* () {
      const actor = yield* requestUser(request)
      return yield* listUsedBlueprints(actor.id)
    }).pipe(Effect.provide(PgClientLive)),
    {
      headers: request.headers,
      operation: 'blueprints.library.list',
      successEnvelope: false,
      legacyErrorCode: true,
    }
  )
}

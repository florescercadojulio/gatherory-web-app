import { Effect } from 'effect'
import { z } from 'zod'
import { PgClientLive } from '@/db'
import { runServerResponse } from '@/server/effect-utils'
import { requestJson, requestUser, validateInput } from '@/server/http-errors'
import {
  blueprintCatalog,
  blueprintStatus,
  installBlueprint,
  previewBlueprint,
  scheduleBlueprint,
} from '../workflows/blueprint.workflows.live'

export function handleBlueprintRequest(
  request: Request,
  action: 'catalog' | 'preview' | 'install' | 'status' | 'schedule',
  requestId?: string
) {
  return runServerResponse(
    Effect.gen(function* () {
      const actor = yield* requestUser(request)
      switch (action) {
        case 'schedule':
          return yield* scheduleBlueprint(yield* requestJson(request), actor.id)
        case 'catalog':
          return yield* blueprintCatalog(actor.id)
        case 'preview':
          return yield* previewBlueprint(yield* requestJson(request), actor.id)
        case 'install':
          return yield* installBlueprint(actor, yield* requestJson(request))
        case 'status':
          return yield* blueprintStatus(actor.id, yield* validateInput(z.uuid(), requestId))
      }
    }).pipe(Effect.provide(PgClientLive)),
    {
      headers: request.headers,
      operation: `blueprint.${action}`,
      successEnvelope: false,
      legacyErrorCode: true,
    }
  )
}

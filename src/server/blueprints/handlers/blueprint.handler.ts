import { Effect } from 'effect'
import { z } from 'zod'
import { BlueprintCatalogPageRequestSchema } from '@/contracts/blueprint-discovery.contracts'
import { PgClientLive } from '@/db'
import { runServerResponse } from '@/server/effect-utils'
import { requestJson, requestUser, validateInput } from '@/server/http-errors'
import {
  blueprintCatalog,
  blueprintCatalogPage,
  blueprintStatus,
  installBlueprint,
  previewBlueprint,
  scheduleBlueprint,
} from '../workflows/blueprint.workflows.live'
import {
  BLUEPRINT_DISCOVERY_CONTEXT_HEADER,
  parseBlueprintDiscoverySessionContext,
} from '../services/blueprint-discovery'

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
        case 'catalog': {
          const params = new URL(request.url).searchParams
          const isPageRequest = ['limit', 'cursor', 'category', 'q', 'ranking'].some((key) =>
            params.has(key)
          )
          if (!isPageRequest) return yield* blueprintCatalog(actor.id)

          const input = yield* validateInput(BlueprintCatalogPageRequestSchema, {
            ...(params.has('limit') ? { limit: params.get('limit') } : {}),
            ...(params.has('cursor') ? { cursor: params.get('cursor') } : {}),
            ...(params.has('category') ? { category: params.get('category') } : {}),
            ...(params.has('q') ? { q: params.get('q') } : {}),
            ...(params.has('ranking') ? { ranking: params.get('ranking') } : {}),
          })
          const rawDiscoveryContext = request.headers.get(BLUEPRINT_DISCOVERY_CONTEXT_HEADER)
          const discoverySession =
            input.q.trim().length === 0 && rawDiscoveryContext !== null
              ? yield* validateInput(
                  z.string().transform((raw, context) => {
                    const parsed = parseBlueprintDiscoverySessionContext(raw)
                    if (!parsed) {
                      context.addIssue({
                        code: 'custom',
                        message: 'Invalid discovery session context',
                      })
                      return z.NEVER
                    }
                    return parsed
                  }),
                  rawDiscoveryContext
                )
              : undefined
          return yield* blueprintCatalogPage(actor.id, {
            ...input,
            ...(discoverySession ? { discoverySession } : {}),
          })
        }
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

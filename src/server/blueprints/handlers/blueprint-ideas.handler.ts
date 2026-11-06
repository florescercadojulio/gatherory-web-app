import { Effect } from 'effect'
import { BlueprintIdeaDiscoveryRequestSchema } from '@/contracts/blueprint-idea-discovery.contracts'
import { PgClientLive } from '@/db'
import { InvalidInputError } from '@/lib/domain-errors'
import { runServerResponse } from '@/server/effect-utils'
import { requestUser, validateInput } from '@/server/http-errors'
import { blueprintCatalog } from '../workflows/blueprint.workflows.live'
import { discoverBlueprintIdeas } from '../services/blueprint-idea-discovery'

export function handleBlueprintIdeasRequest(request: Request) {
  return runServerResponse(
    Effect.gen(function* () {
      const actor = yield* requestUser(request)
      const params = new URL(request.url).searchParams
      const input = yield* validateInput(BlueprintIdeaDiscoveryRequestSchema, {
        ...(params.has('q') ? { q: params.get('q') } : {}),
        ...(params.has('cursor') ? { cursor: params.get('cursor') } : {}),
        ...(params.has('limit') ? { limit: params.get('limit') } : {}),
      })
      const catalog = yield* blueprintCatalog(actor.id)
      return yield* Effect.try({
        try: () => discoverBlueprintIdeas(catalog, input),
        catch: () =>
          new InvalidInputError({
            category: 'validation',
            code: 'BLUEPRINT_IDEA_CURSOR_INVALID',
            userMessageKey: 'serverErrors.VALIDATION',
          }),
      })
    }).pipe(Effect.provide(PgClientLive)),
    {
      headers: request.headers,
      operation: 'blueprints.ideas.discover',
      successEnvelope: false,
      legacyErrorCode: true,
    }
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { Effect } from 'effect'
import { z } from 'zod'
import { EntityNotFoundError, runServerResponse } from '@/server/effect-utils'
import { requestUser, validateInput } from '@/server/http-errors'
import { pullNativeSync } from '@/server/sync/workflows/native-sync.workflows.live'
import { hasBlueprintGuidesCapability } from '@/server/sync/native-sync-compatibility'

const querySchema = z.object({
  scopeID: z.uuid(),
  after: z.coerce.number().int().nonnegative().default(0),
})

export const Route = createFileRoute('/api/sync/pull')({
  server: {
    handlers: {
      GET: ({ request }) =>
        runServerResponse(
          Effect.gen(function* () {
            const user = yield* requestUser(request)
            const url = new URL(request.url)
            const input = yield* validateInput(querySchema, {
              scopeID: url.searchParams.get('scopeID'),
              after: url.searchParams.get('after') ?? 0,
            })
            const page = yield* pullNativeSync({
              userId: user.id,
              scopeId: input.scopeID,
              after: input.after,
              supportsBlueprintGuides: hasBlueprintGuidesCapability(request.headers),
            })
            if (!page)
              return yield* Effect.fail(
                new EntityNotFoundError({
                  category: 'not_found',
                  code: 'SYNC_SCOPE_NOT_FOUND',
                  userMessageKey: 'serverErrors.SYNC_SCOPE_NOT_FOUND',
                  debugMessage: `No accessible planning snapshot; scope=${input.scopeID}`,
                })
              )
            return page
          }),
          {
            headers: request.headers,
            operation: 'sync.pull',
            successEnvelope: false,
            legacyErrorCode: true,
          }
        ),
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'
import { Effect } from 'effect'
import { runServerResponse } from '@/server/effect-utils'
import { requestUser } from '@/server/http-errors'
import {
  hasBlueprintGuidesCapability,
  hasTodosCapability,
} from '@/server/sync/native-sync-compatibility'
import { bootstrapNativeSync } from '@/server/sync/workflows/native-sync.workflows.live'

export const Route = createFileRoute('/api/sync/bootstrap')({
  server: {
    handlers: {
      GET: ({ request }) =>
        runServerResponse(
          Effect.gen(function* () {
            const user = yield* requestUser(request)
            return yield* bootstrapNativeSync({
              userId: user.id,
              supportsBlueprintGuides: hasBlueprintGuidesCapability(request.headers),
              supportsTodos: hasTodosCapability(request.headers),
            })
          }),
          {
            headers: request.headers,
            operation: 'sync.bootstrap',
            successEnvelope: false,
            legacyErrorCode: true,
          }
        ),
    },
  },
})

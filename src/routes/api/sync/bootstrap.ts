import { createFileRoute } from '@tanstack/react-router'
import { Effect } from 'effect'
import { runServerResponse } from '@/server/effect-utils'
import { requestUser } from '@/server/http-errors'
import { NativeSyncRepoLive } from '@/server/sync/repos/native-sync.repo.live'
import { bootstrapNativeSync } from '@/server/sync/workflows/native-sync-bootstrap.workflow'

export const Route = createFileRoute('/api/sync/bootstrap')({
  server: {
    handlers: {
      GET: ({ request }) =>
        runServerResponse(
          Effect.gen(function* () {
            const user = yield* requestUser(request)
            return yield* bootstrapNativeSync(user.id).pipe(Effect.provide(NativeSyncRepoLive))
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

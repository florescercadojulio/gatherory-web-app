import { createFileRoute } from '@tanstack/react-router'
import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { runServerResponse } from '@/server/effect-utils'
import { requestJson, requestUser, validateInput } from '@/server/http-errors'
import { NativeMediaAssetInputSchema } from '@/server/media/contracts/media.contracts'
import { finalizeNativeMediaUploadWorkflow } from '@/server/media/workflows/media.workflows'

export const Route = createFileRoute('/api/media/native/finalize')({
  server: {
    handlers: {
      POST: ({ request }) =>
        runServerResponse(
          Effect.gen(function* () {
            const user = yield* requestUser(request)
            const input = yield* validateInput(
              NativeMediaAssetInputSchema,
              yield* requestJson(request)
            )
            return yield* finalizeNativeMediaUploadWorkflow({ userId: user.id, media: input })
          }).pipe(Effect.provide(PgClientLive)),
          { headers: request.headers, operation: 'media.finalize' }
        ),
    },
  },
})

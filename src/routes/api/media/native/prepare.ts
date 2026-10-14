import { createFileRoute } from '@tanstack/react-router'
import { Effect } from 'effect'
import { provideMediaLayers } from '@/server/media/media.layers'
import { runServerResponse } from '@/server/effect-utils'
import { requestJson, requestUser, validateInput } from '@/server/http-errors'
import { PrepareNativeMediaUploadInputSchema } from '@/server/media/contracts/media.contracts'
import { prepareNativeMediaUploadWorkflow } from '@/server/media/workflows/media.workflows'

export const Route = createFileRoute('/api/media/native/prepare')({
  server: {
    handlers: {
      POST: ({ request }) =>
        runServerResponse(
          provideMediaLayers(
            Effect.gen(function* () {
              const user = yield* requestUser(request)
              const input = yield* validateInput(
                PrepareNativeMediaUploadInputSchema,
                yield* requestJson(request)
              )
              return yield* prepareNativeMediaUploadWorkflow({ userId: user.id, media: input })
            })
          ),
          { headers: request.headers, operation: 'media.prepare' }
        ),
    },
  },
})

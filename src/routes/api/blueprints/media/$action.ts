import { createFileRoute } from '@tanstack/react-router'
import { Effect, Layer } from 'effect'

import { PgClientLive } from '@/db'
import { InvalidInputError } from '@/lib/domain-errors'
import {
  FinalizeBlueprintCoverUploadInputSchema,
  GetBlueprintCoverUrlInputSchema,
  PrepareBlueprintCoverUploadInputSchema,
} from '@/contracts/blueprint-media.contracts'
import { runServerResponse } from '@/server/effect-utils'
import { nativeSyncUser } from '@/server/sync/handlers/native-sync-auth.handler'
import { requestJson, requestUser, validateInput } from '@/server/http-errors'
import {
  finalizeBlueprintCoverUpload,
  getBlueprintCoverUrl,
  prepareBlueprintCoverUpload,
} from '@/server/blueprint-media/blueprint-cover.service'
import { BlueprintCoverStorageLive } from '@/server/blueprint-media/blueprint-cover.storage.live'

const coverMediaLayer = Layer.mergeAll(PgClientLive, BlueprintCoverStorageLive)

export const Route = createFileRoute('/api/blueprints/media/$action')({
  server: {
    handlers: {
      POST: ({ request, params }) => {
        const action = params.action
        return runServerResponse(
          Effect.gen(function* () {
            const body = yield* requestJson(request)
            if (action === 'prepare') {
              const user = yield* requestUser(request)
              const cover = yield* validateInput(PrepareBlueprintCoverUploadInputSchema, body)
              return yield* prepareBlueprintCoverUpload({ actorUserId: user.id, cover })
            }
            if (action === 'finalize') {
              const user = yield* requestUser(request)
              const cover = yield* validateInput(FinalizeBlueprintCoverUploadInputSchema, body)
              return yield* finalizeBlueprintCoverUpload({ actorUserId: user.id, cover })
            }
            if (action === 'url') {
              const cover = yield* validateInput(GetBlueprintCoverUrlInputSchema, body)
              const user = yield* Effect.tryPromise({
                try: () => nativeSyncUser(request),
                catch: (cause) => cause,
              }).pipe(Effect.catch(() => Effect.succeed(null)))
              return yield* getBlueprintCoverUrl({ actorUserId: user?.id ?? null, cover })
            }
            return yield* Effect.fail(
              new InvalidInputError({
                category: 'validation',
                code: 'INVALID_BLUEPRINT_MEDIA_ACTION',
                userMessageKey: 'serverErrors.VALIDATION',
              })
            )
          }).pipe(Effect.provide(coverMediaLayer)),
          { headers: request.headers, operation: `blueprint.media.${action}` }
        )
      },
    },
  },
})

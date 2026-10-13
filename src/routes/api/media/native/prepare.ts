import { createFileRoute } from "@tanstack/react-router"
import { Effect } from "effect"
import { PgClientLive } from "@/db"
import { runServerResponse } from "@/server/effect-utils"
import { requestJson, requestUser, validateInput } from "@/server/http-errors"
import { PrepareNativeMediaUploadInputSchema } from "@/server/media/contracts/media.contracts"
import { prepareNativeMediaUploadWorkflow } from "@/server/media/workflows/media.workflows"

export const Route = createFileRoute("/api/media/native/prepare")({
  server: { handlers: {
    POST: ({ request }) => runServerResponse(Effect.gen(function* () {
      const user = yield* requestUser(request)
      const input = yield* validateInput(PrepareNativeMediaUploadInputSchema, yield* requestJson(request))
      return yield* prepareNativeMediaUploadWorkflow({ userId: user.id, media: input })
    }).pipe(Effect.provide(PgClientLive)), { headers: request.headers }),
  } },
})

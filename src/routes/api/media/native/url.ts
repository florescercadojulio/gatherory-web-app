import { createFileRoute } from "@tanstack/react-router"
import { Effect } from "effect"
import { PgClientLive } from "@/db"
import { runServerResponse } from "@/server/effect-utils"
import { requestUser, validateInput } from "@/server/http-errors"
import { NativeMediaAssetInputSchema } from "@/server/media/contracts/media.contracts"
import { getNativeMediaUrlWorkflow } from "@/server/media/workflows/media.workflows"

export const Route = createFileRoute("/api/media/native/url")({
  server: { handlers: {
    GET: ({ request }) => runServerResponse(Effect.gen(function* () {
      const user = yield* requestUser(request)
      const input = yield* validateInput(NativeMediaAssetInputSchema, { mediaAssetId: new URL(request.url).searchParams.get("mediaAssetId") })
      return yield* getNativeMediaUrlWorkflow({ userId: user.id, mediaAssetId: input.mediaAssetId })
    }).pipe(Effect.provide(PgClientLive)), { headers: request.headers }),
  } },
})

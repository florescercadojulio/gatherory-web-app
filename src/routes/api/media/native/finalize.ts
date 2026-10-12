import { createFileRoute } from "@tanstack/react-router"
import { Effect } from "effect"

import { PgClientLive } from "@/db"
import { runServerEffect } from "@/server/effect"
import { NativeMediaAssetInputSchema } from "@/server/media/contracts/media.contracts"
import { mediaError } from "@/server/media/handlers/media.handlers"
import { finalizeNativeMediaUploadWorkflow } from "@/server/media/workflows/media.workflows"
import { nativeSyncUser, syncJSON } from "@/server/sync/native-sync-auth"

export const Route = createFileRoute("/api/media/native/finalize")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await nativeSyncUser(request)
        if (!user) return syncJSON({ error: "UNAUTHORIZED" }, 401)

        const parsed = NativeMediaAssetInputSchema.safeParse(await request.json())
        if (!parsed.success) {
          return syncJSON({ error: "INVALID_MEDIA_REQUEST" }, 400)
        }

        const result = await runServerEffect(
          finalizeNativeMediaUploadWorkflow({
            userId: user.id,
            media: parsed.data,
          }).pipe(Effect.mapError(mediaError), Effect.provide(PgClientLive)),
        )
        return syncJSON(result, result.ok ? 200 : 400)
      },
    },
  },
})

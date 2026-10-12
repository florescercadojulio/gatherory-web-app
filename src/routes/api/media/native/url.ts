import { createFileRoute } from "@tanstack/react-router"
import { Effect } from "effect"

import { PgClientLive } from "@/db"
import { runServerEffect } from "@/server/effect"
import { NativeMediaAssetInputSchema } from "@/server/media/contracts/media.contracts"
import { mediaError } from "@/server/media/handlers/media.handlers"
import { getNativeMediaUrlWorkflow } from "@/server/media/workflows/media.workflows"
import { nativeSyncUser, syncJSON } from "@/server/sync/native-sync-auth"

export const Route = createFileRoute("/api/media/native/url")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await nativeSyncUser(request)
        if (!user) return syncJSON({ error: "UNAUTHORIZED" }, 401)

        const parsed = NativeMediaAssetInputSchema.safeParse({
          mediaAssetId: new URL(request.url).searchParams.get("mediaAssetId"),
        })
        if (!parsed.success) {
          return syncJSON({ error: "INVALID_MEDIA_REQUEST" }, 400)
        }

        const result = await runServerEffect(
          getNativeMediaUrlWorkflow({
            userId: user.id,
            mediaAssetId: parsed.data.mediaAssetId,
          }).pipe(Effect.mapError(mediaError), Effect.provide(PgClientLive)),
        )
        return syncJSON(result, result.ok ? 200 : 404)
      },
    },
  },
})

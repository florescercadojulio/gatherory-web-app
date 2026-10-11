import { createFileRoute } from "@tanstack/react-router"

import {
  applyNativeMutations,
  pushRequestSchema,
} from "@/server/sync/native-sync"
import { nativeSyncUser, syncJSON } from "@/server/sync/native-sync-auth"

export const Route = createFileRoute("/api/sync/push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await nativeSyncUser(request)
          if (!user) return syncJSON({ error: "UNAUTHORIZED" }, 401)

          const parsed = pushRequestSchema.safeParse(await request.json())
          if (!parsed.success) {
            const payloadTooLarge = parsed.error.issues.some(
              (issue) =>
                issue.code === "too_big" && issue.path.at(-1) === "payload",
            )
            return syncJSON(
              {
                error: payloadTooLarge
                  ? "SYNC_PAYLOAD_TOO_LARGE"
                  : "INVALID_SYNC_REQUEST",
                details: parsed.error.issues,
              },
              payloadTooLarge ? 413 : 400,
            )
          }

          return syncJSON(
            await applyNativeMutations({
              userId: user.id,
              mutations: parsed.data.mutations,
            }),
          )
        } catch (error) {
          console.error("Native sync push failed", error)
          return syncJSON({ error: "SYNC_PUSH_FAILED" }, 500)
        }
      },
    },
  },
})

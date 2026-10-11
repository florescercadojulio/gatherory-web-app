import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { pullNativeChanges } from "@/server/sync/native-sync"
import { nativeSyncUser, syncJSON } from "@/server/sync/native-sync-auth"

const querySchema = z.object({
  scopeID: z.uuid(),
  after: z.coerce.number().int().nonnegative().default(0),
})

export const Route = createFileRoute("/api/sync/pull")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await nativeSyncUser(request)
          if (!user) return syncJSON({ error: "UNAUTHORIZED" }, 401)

          const url = new URL(request.url)
          const parsed = querySchema.safeParse({
            scopeID: url.searchParams.get("scopeID"),
            after: url.searchParams.get("after") ?? 0,
          })
          if (!parsed.success) {
            return syncJSON({ error: "INVALID_SYNC_CURSOR" }, 400)
          }

          const page = await pullNativeChanges({
            userId: user.id,
            scopeId: parsed.data.scopeID,
            after: parsed.data.after,
          })
          return page
            ? syncJSON(page)
            : syncJSON({ error: "SYNC_SCOPE_NOT_FOUND" }, 404)
        } catch (error) {
          console.error("Native sync pull failed", error)
          return syncJSON({ error: "SYNC_PULL_FAILED" }, 500)
        }
      },
    },
  },
})

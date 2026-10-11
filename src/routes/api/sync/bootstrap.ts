import { createFileRoute } from "@tanstack/react-router"

import { listNativeWorkspaceSnapshots } from "@/server/sync/native-sync"
import { nativeSyncUser, syncJSON } from "@/server/sync/native-sync-auth"

export const Route = createFileRoute("/api/sync/bootstrap")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await nativeSyncUser(request)
          if (!user) return syncJSON({ error: "UNAUTHORIZED" }, 401)
          return syncJSON(await listNativeWorkspaceSnapshots(user.id))
        } catch (error) {
          console.error("Native sync bootstrap failed", error)
          return syncJSON({ error: "SYNC_BOOTSTRAP_FAILED" }, 500)
        }
      },
    },
  },
})

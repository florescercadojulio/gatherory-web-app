import { createFileRoute } from "@tanstack/react-router"
import { Effect } from "effect"
import { runServerResponse, tryServerOperation } from "@/server/effect-utils"
import { requestUser } from "@/server/http-errors"
import { listNativeWorkspaceSnapshots } from "@/server/sync/native-sync"

export const Route = createFileRoute("/api/sync/bootstrap")({ server: { handlers: {
  GET: ({ request }) => runServerResponse(Effect.gen(function* () {
    const user = yield* requestUser(request)
    return yield* tryServerOperation({ category: "system", code: "SYNC_BOOTSTRAP_FAILED", userMessageKey: "serverErrors.SYNC_BOOTSTRAP_FAILED" }, () => listNativeWorkspaceSnapshots(user.id))
  }), { headers: request.headers, successEnvelope: false, legacyErrorCode: true }),
} } })

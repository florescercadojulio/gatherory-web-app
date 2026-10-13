import { createFileRoute } from "@tanstack/react-router"
import { Effect } from "effect"
import { z } from "zod"
import { EntityNotFoundError, runServerResponse, tryServerOperation } from "@/server/effect-utils"
import { requestUser, validateInput } from "@/server/http-errors"
import { pullNativeChanges } from "@/server/sync/native-sync"

const querySchema = z.object({ scopeID: z.uuid(), after: z.coerce.number().int().nonnegative().default(0) })

export const Route = createFileRoute("/api/sync/pull")({ server: { handlers: {
  GET: ({ request }) => runServerResponse(Effect.gen(function* () {
    const user = yield* requestUser(request)
    const url = new URL(request.url)
    const input = yield* validateInput(querySchema, { scopeID: url.searchParams.get("scopeID"), after: url.searchParams.get("after") ?? 0 })
    const page = yield* tryServerOperation({ category: "system", code: "SYNC_PULL_FAILED", userMessageKey: "serverErrors.SYNC_PULL_FAILED" }, () => pullNativeChanges({ userId: user.id, scopeId: input.scopeID, after: input.after }))
    if (!page) return yield* Effect.fail(new EntityNotFoundError({ category: "not_found", code: "SYNC_SCOPE_NOT_FOUND", userMessageKey: "serverErrors.SYNC_SCOPE_NOT_FOUND" }))
    return page
  }), { headers: request.headers, successEnvelope: false, legacyErrorCode: true }),
} } })

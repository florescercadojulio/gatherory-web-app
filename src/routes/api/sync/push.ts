import { createFileRoute } from "@tanstack/react-router"
import { Effect } from "effect"
import { InvalidInputError, runServerResponse, tryServerOperation } from "@/server/effect-utils"
import { requestJson, requestUser } from "@/server/http-errors"
import { applyNativeMutations, pushRequestSchema } from "@/server/sync/native-sync"

export const Route = createFileRoute("/api/sync/push")({ server: { handlers: {
  POST: ({ request }) => runServerResponse(Effect.gen(function* () {
    const user = yield* requestUser(request)
    const parsed = pushRequestSchema.safeParse(yield* requestJson(request))
    if (!parsed.success) {
      const oversized = parsed.error.issues.some(issue => issue.code === "too_big" && issue.path.at(-1) === "payload")
      return yield* Effect.fail(new InvalidInputError({
        category: "validation", code: oversized ? "SYNC_PAYLOAD_TOO_LARGE" : "INVALID_SYNC_REQUEST",
        userMessageKey: oversized ? "serverErrors.SYNC_PAYLOAD_TOO_LARGE" : "serverErrors.INVALID_SYNC_REQUEST",
        httpStatus: oversized ? 413 : 400, cause: parsed.error,
      }))
    }
    return yield* tryServerOperation({ category: "system", code: "SYNC_PUSH_FAILED", userMessageKey: "serverErrors.SYNC_PUSH_FAILED" }, () => applyNativeMutations({ userId: user.id, mutations: parsed.data.mutations }))
  }), { headers: request.headers, operation: "sync.push", successEnvelope: false, legacyErrorCode: true }),
} } })

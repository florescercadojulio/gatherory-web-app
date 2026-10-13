import { createFileRoute } from "@tanstack/react-router"
import { Effect } from "effect"
import { z } from "zod"

import { ForbiddenError, runServerResponse, tryServerOperation } from "@/server/effect-utils"
import { requestJson, requestUser, validateInput } from "@/server/http-errors"
import { saveNativeAppleRevocationToken } from "@/server/auth/apple-tokens"

const input = z.object({ authorizationCode: z.string().min(1).max(4096) }).strict()

export const Route = createFileRoute("/api/auth/apple-token")({ server: { handlers: {
  POST: ({ request }) => runServerResponse(Effect.gen(function* () {
    // The code can only be attached to the bearer user's verified Apple identity.
    if (!/^Bearer \S+$/i.test(request.headers.get("authorization") ?? "")) {
      return yield* Effect.fail(new ForbiddenError({ category: "authorization", code: "UNAUTHORIZED",
        userMessageKey: "serverErrors.UNAUTHORIZED", httpStatus: 401 }))
    }
    const user = yield* requestUser(request)
    const { authorizationCode } = yield* validateInput(input, yield* requestJson(request))
    yield* tryServerOperation({ category: "external", code: "APPLE_CODE_EXCHANGE_FAILED",
      userMessageKey: "serverErrors.EXTERNAL" }, () => saveNativeAppleRevocationToken(user.id, authorizationCode))
    return { saved: true }
  }), { headers: request.headers, successEnvelope: false, legacyErrorCode: true }),
} } })

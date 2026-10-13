import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { Effect } from "effect"
import { PgClientLive } from "@/db"
import { auth } from "@/lib/auth"
import { ForbiddenError, runServerEffect, tryServerOperation } from "@/server/effect"
import { requireModerator } from "./moderation.repo"

export const moderatorAccess = createServerFn({ method: "GET" }).handler(async () =>
  runServerEffect(Effect.gen(function* () {
    const session = yield* tryServerOperation({ category: "system", code: "SESSION_LOOKUP_FAILED", userMessageKey: "serverErrors.SESSION_LOOKUP_FAILED" }, () => auth.api.getSession({ headers: getRequestHeaders() }))
    if (!session?.user.emailVerified) return yield* Effect.fail(new ForbiddenError({ category: "authorization", code: "MODERATOR_SESSION_REQUIRED", userMessageKey: "serverErrors.MODERATOR_SESSION_REQUIRED" }))
    yield* requireModerator(session.user.id)
    return { authorized: true }
  }).pipe(Effect.provide(PgClientLive))),
)

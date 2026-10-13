import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { Effect } from "effect"
import { PgClientLive } from "@/db"
import { auth } from "@/lib/auth"
import { ForbiddenError, runServerEffect } from "@/server/effect"
import { requireModerator } from "./moderation.repo"

export const moderatorAccess = createServerFn({ method: "GET" }).handler(async () =>
  runServerEffect(Effect.gen(function* () {
    const session = yield* Effect.tryPromise(() => auth.api.getSession({ headers: getRequestHeaders() }))
    if (!session?.user.emailVerified) return yield* Effect.fail(new ForbiddenError({ category: "authorization", code: "MODERATOR_SESSION_REQUIRED", userMessage: "Sign in with a designated moderator account." }))
    yield* requireModerator(session.user.id)
    return { authorized: true }
  }).pipe(Effect.provide(PgClientLive))),
)

import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { Effect } from "effect"

import { auth } from "@/lib/auth"
import { requireSessionMiddleware } from "@/lib/auth.middleware"
import { runServerEffect, tryServerOperation } from "@/server/effect"

/** Returns the current cookie-backed session without requiring authentication. */
export const getSession = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(
    tryServerOperation(
      {
        category: "external",
        code: "SESSION_LOOKUP_FAILED",
        userMessage: "Your session could not be checked. Try again.",
      },
      () => auth.api.getSession({ headers: getRequestHeaders() }),
    ),
  ),
)

/**
 * Route-level navigation guard. Individual server functions must still apply
 * their own session and event authorization middleware.
 */
export const ensureSession = createServerFn({ method: "GET" })
  .middleware([requireSessionMiddleware])
  .handler(({ context }) => runServerEffect(Effect.succeed(context)))

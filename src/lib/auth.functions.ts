import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"

import { auth } from "@/lib/auth"
import { requireSessionMiddleware } from "@/lib/auth.middleware"

/** Returns the current cookie-backed session without requiring authentication. */
export const getSession = createServerFn({ method: "GET" }).handler(() =>
  auth.api.getSession({ headers: getRequestHeaders() }),
)

/**
 * Route-level navigation guard. Individual server functions must still apply
 * their own session and event authorization middleware.
 */
export const ensureSession = createServerFn({ method: "GET" })
  .middleware([requireSessionMiddleware])
  .handler(({ context }) => context)

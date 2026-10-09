import { redirect } from "@tanstack/react-router"
import { createMiddleware } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"

import { auth } from "@/lib/auth"

/**
 * Establishes identity for a server function. Event membership and capability
 * checks belong to event-scoped authorization middleware, not this middleware.
 */
export const requireSessionMiddleware = createMiddleware({ type: "function" })
  .server(async ({ next }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })

    if (!session) {
      throw redirect({
        to: "/auth/$path",
        params: { path: "sign-in" },
      })
    }

    return next({
      context: {
        session: session.session,
        user: session.user,
      },
    })
  })

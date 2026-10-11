import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { getContext } from "./integrations/tanstack-query/root-provider"
import { PageSkeleton } from "./components/page-skeleton"
import { RouteErrorFallback } from "./components/route-feedback"

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PageSkeleton,
    defaultPendingMs: 0,
    defaultPendingMinMs: 300,
    defaultErrorComponent: RouteErrorFallback,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}

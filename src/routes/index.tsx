import { createFileRoute, redirect } from "@tanstack/react-router"

import { getSession } from "@/lib/auth.functions"

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: "/auth/$path",
        params: { path: "sign-in" },
        replace: true,
      })
    }

    throw redirect({
      to: "/workspaces",
      replace: true,
    })
  },
})

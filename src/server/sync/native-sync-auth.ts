import { auth } from "@/lib/auth"

export async function nativeSyncUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  // Authenticate identity only. Native requests carry an explicit event/scope
  // whose organization and permissions must be resolved by the operation.
  // activeOrganizationId is session UI context, not a tenant override for an
  // offline outbox item that may belong to a different open workspace.
  return session?.user ?? null
}

export function syncJSON(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  })
}

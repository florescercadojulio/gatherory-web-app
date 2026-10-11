import { auth } from "@/lib/auth"

export async function nativeSyncUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  return session?.user ?? null
}

export function syncJSON(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  })
}

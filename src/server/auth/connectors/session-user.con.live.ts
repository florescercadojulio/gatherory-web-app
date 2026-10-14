import { auth } from '@/lib/auth'

/** Better Auth's Promise boundary; transport adapters decide how to expose failures. */
export async function sessionUser(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  return session?.user ?? null
}

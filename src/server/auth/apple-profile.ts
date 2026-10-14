import { APIError } from "better-auth/api"

type SavedAppleProfile = { email: string; emailVerified: boolean; name: string }

/** Called by Better Auth only after Apple token verification. Never use a
 * client-supplied email to resolve an identity or link an existing account. */
export async function mapAppleProfile(
  profile: { sub: string; email?: string },
  findLinkedProfile: (subject: string) => Promise<SavedAppleProfile | undefined>,
): Promise<Partial<SavedAppleProfile>> {
  if (profile.email?.trim()) return {}
  const saved = profile.sub ? await findLinkedProfile(profile.sub) : undefined
  if (saved?.email) return saved

  // Deleted or first-time accounts have no trustworthy email to recover.
  // Do not resurrect deleted data or create a verified placeholder identity.
  throw new APIError("BAD_REQUEST", {
    code: "APPLE_EMAIL_REQUIRED",
    message: "Apple did not share an email address. In Settings > your name > Sign in with Apple, remove Gatherory, then try again and share your email or choose Hide My Email.",
  })
}

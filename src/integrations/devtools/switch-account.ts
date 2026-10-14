import { authClient } from '@/lib/auth-client'

type SwitchAccountResult = { ok: false; message: string } | { ok: true; destination: string }

function safeDestination(href: string) {
  try {
    const url = new URL(href, window.location.origin)
    if (url.origin !== window.location.origin) return '/'

    if (url.pathname === '/login' || url.pathname.startsWith('/auth/')) {
      return '/'
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}

/** Switch through Better Auth's normal sign-in flow without bypassing guards. */
export async function switchDevelopmentAccount(input: {
  email: string
  password: string
  href: string
}): Promise<SwitchAccountResult> {
  if (!import.meta.env.DEV) {
    return {
      ok: false,
      message: 'Account switching is only available in development.',
    }
  }

  try {
    const { error } = await authClient.signIn.email({
      email: input.email.trim(),
      password: input.password,
      rememberMe: false,
    })

    if (error) {
      return { ok: false, message: error.message ?? 'Unable to sign in.' }
    }
  } catch {
    return {
      ok: false,
      message: 'The account could not be reached. Try again.',
    }
  }

  return { ok: true, destination: safeDestination(input.href) }
}

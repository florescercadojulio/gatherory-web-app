import { viewPaths } from '@better-auth-ui/core'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { cn } from 'cn'
import { CheckIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Auth } from '@/components/auth/auth'
import { ServerErrorToast } from '@/components/route-feedback'
import { getSession } from '@/lib/auth.functions'
import { safeAuthContinuation } from '@/lib/event-invitation-links'

const passwordlessAuthPaths = ['email-otp', 'magic-link', 'magic-link-sent'] as const
const validAuthPaths = new Set<string>([...Object.values(viewPaths.auth), ...passwordlessAuthPaths])
const signedOutOnlyPaths = new Set<string>([
  viewPaths.auth.signIn,
  viewPaths.auth.signUp,
  ...passwordlessAuthPaths,
])

export const Route = createFileRoute('/auth/$path/')({
  validateSearch: (search: Record<string, unknown>): { redirectTo?: string } => ({
    redirectTo: safeAuthContinuation(search.redirectTo) ?? undefined,
  }),
  beforeLoad: async ({ params: { path }, search, location }) => {
    // Better Auth UI reads the browser's raw query string. Remove unsafe
    // continuations from the URL itself, not just the router's parsed search.
    const rawContinuation = new URLSearchParams(location.searchStr).get('redirectTo')
    if (rawContinuation !== null && !safeAuthContinuation(rawContinuation)) {
      throw redirect({ to: '/auth/$path', params: { path }, search: {}, replace: true })
    }
    if (!validAuthPaths.has(path)) {
      throw redirect({
        to: '/auth/$path',
        params: { path: 'sign-in' },
      })
    }

    if (signedOutOnlyPaths.has(path)) {
      const session = await getSession()
      if (session.ok && session.data) throw redirect({ href: search.redirectTo ?? '/' })
      return { sessionError: session.ok ? null : session.error }
    }

    return { sessionError: null }
  },
  component: AuthPage,
})

function AuthPage() {
  const { t } = useTranslation()
  const { path } = Route.useParams()
  const { sessionError } = Route.useRouteContext()
  const isSignIn = path === viewPaths.auth.signIn
  const isSignUp = path === viewPaths.auth.signUp
  const hidesCardHeader = isSignIn || isSignUp

  return (
    <main className={cn('auth-page min-h-svh px-4 py-6 sm:px-6 sm:py-8', 'auth-signin-page')}>
      <ServerErrorToast error={sessionError} />
      <div
        className={cn(
          'auth-shell mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/72 shadow-2xl shadow-blue-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/74 lg:grid-cols-[1.05fr_0.95fr]',
          'auth-signin-shell'
        )}
      >
        <section className="auth-story relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="auth-orb auth-orb-one" />
          <div className="auth-orb auth-orb-two" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="size-11 overflow-hidden rounded-2xl border border-white/35 shadow-lg shadow-blue-950/15">
              <img src="/gatherory-icon.png" alt="" className="size-full object-cover" />
            </div>
            <p className="text-lg font-semibold tracking-tight text-white">Gatherory</p>
          </div>

          <div className="relative z-10 max-w-xl">
            <h1 className="max-w-lg text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white">
              {t('authStory.headline')}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-blue-50/80">
              {t('authStory.description')}
            </p>

            <ul className="mt-8 grid gap-3 text-sm text-white/90">
              {[t('authStory.pointOne'), t('authStory.pointTwo'), t('authStory.pointThree')].map(
                (item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="grid size-6 place-items-center rounded-full bg-white/15">
                      <CheckIcon className="size-3.5" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-blue-100/65">{t('authStory.footer')}</p>
        </section>

        <section
          className={cn(
            'flex items-center justify-center px-5 py-8 sm:px-10 lg:px-14',
            'auth-signin-pane'
          )}
        >
          <div className={cn('w-full max-w-md', 'auth-signin-stage')}>
            <div
              className={cn(
                'mb-8 flex flex-col items-center gap-3 text-center lg:items-start lg:text-left',
                'auth-signin-intro'
              )}
            >
              <div className="size-12 overflow-hidden rounded-2xl shadow-lg lg:hidden">
                <img src="/gatherory-icon.png" alt="" className="size-full object-cover" />
              </div>
              <div>
                <p className="text-xl font-semibold tracking-tight text-foreground lg:hidden">
                  Gatherory
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t('authStory.signInIntro')}
                </p>
              </div>
            </div>

            <Auth
              path={path}
              className={cn(
                'auth-card max-w-none',
                'auth-signin-card',
                hidesCardHeader && 'auth-hide-header'
              )}
              socialPosition="bottom"
              socialLayout="grid"
            />

            <p
              className={cn(
                'mx-auto mt-6 max-w-sm text-center text-xs leading-5 text-muted-foreground',
                'auth-signin-legal'
              )}
            >
              {t('authStory.legal')}
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

import { viewPaths } from "@better-auth-ui/core"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { CheckIcon, SparklesIcon } from "lucide-react"

import { Auth } from "@/components/auth/auth"
import { ServerErrorToast } from "@/components/route-feedback"
import { getSession } from "@/lib/auth.functions"

const passwordlessAuthPaths = [
  "email-otp",
  "magic-link",
  "magic-link-sent",
] as const
const validAuthPaths = new Set<string>([
  ...Object.values(viewPaths.auth),
  ...passwordlessAuthPaths,
])
const signedOutOnlyPaths = new Set<string>([
  viewPaths.auth.signIn,
  viewPaths.auth.signUp,
  ...passwordlessAuthPaths,
])

export const Route = createFileRoute("/auth/$path/")({
  beforeLoad: async ({ params: { path } }) => {
    if (!validAuthPaths.has(path)) {
      throw redirect({
        to: "/auth/$path",
        params: { path: "sign-in" },
      })
    }

    if (signedOutOnlyPaths.has(path)) {
      const session = await getSession()
      if (session.ok && session.data) throw redirect({ to: "/" })
      return { sessionError: session.ok ? null : session.error }
    }

    return { sessionError: null }
  },
  component: AuthPage,
})

function AuthPage() {
  const { path } = Route.useParams()
  const { sessionError } = Route.useRouteContext()

  return (
    <main className="auth-page min-h-svh px-4 py-6 sm:px-6 sm:py-8">
      <ServerErrorToast error={sessionError} />
      <div className="auth-shell mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/72 shadow-2xl shadow-blue-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/74 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="auth-story relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="auth-orb auth-orb-one" />
          <div className="auth-orb auth-orb-two" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="size-11 overflow-hidden rounded-2xl border border-white/35 shadow-lg shadow-blue-950/15">
              <img
                src="/gatherory-icon.png"
                alt=""
                className="size-full object-cover"
              />
            </div>
            <p className="text-lg font-semibold tracking-tight text-white">
              Gatherory
            </p>
          </div>

          <div className="relative z-10 max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-sm font-medium text-blue-50 backdrop-blur-xl">
              <SparklesIcon className="size-4" aria-hidden="true" />
              One place for every gathering
            </div>
            <h1 className="max-w-lg text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white">
              Bring the plan and the people together.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-blue-50/80">
              Shape the main event, collect ideas, make decisions, and keep
              every collaborator moving in the same direction.
            </p>

            <ul className="mt-8 grid gap-3 text-sm text-white/90">
              {[
                "A shared planning space for every event",
                "Decisions, schedules, and guests in context",
                "Designed for planning together",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-full bg-white/15">
                    <CheckIcon className="size-3.5" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-blue-100/65">
            Gatherory keeps the story of an event connected from first idea to
            final memory.
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
              <div className="size-12 overflow-hidden rounded-2xl shadow-lg lg:hidden">
                <img
                  src="/gatherory-icon.png"
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <div>
                <p className="text-xl font-semibold tracking-tight text-foreground lg:hidden">
                  Gatherory
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Sign in to continue planning, or create a new account.
                </p>
              </div>
            </div>

            <Auth
              path={path}
              className="auth-card max-w-none"
              socialPosition="bottom"
              socialLayout="grid"
            />

            <p className="mx-auto mt-6 max-w-sm text-center text-xs leading-5 text-muted-foreground">
              By continuing, you agree to Gatherory&apos;s Terms and acknowledge
              the Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

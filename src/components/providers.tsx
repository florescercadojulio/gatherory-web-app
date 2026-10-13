import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import { ThemeProvider, useTheme } from "next-themes"
import { useEffect, type ReactNode } from "react"

import { AuthProvider } from "@/components/auth/auth-provider"
import { Toaster } from "@/components/ui/sonner"
import { authClient } from "@/lib/auth-client"
import { emailOtpPlugin } from "@/lib/auth/email-otp-plugin"
import { magicLinkPlugin } from "@/lib/auth/magic-link-plugin"
import { themePlugin } from "@/lib/auth/theme-plugin"
import { safeAuthContinuation } from "@/lib/event-invitation-links"

export function Providers({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const search = useRouterState({ select: (state) => state.location.search })
  const redirectTo = safeAuthContinuation((search as Record<string, unknown>).redirectTo) ?? "/"
  const socialProviders = [
    ...(import.meta.env.VITE_APPLE_AUTH_ENABLED ? (["apple"] as const) : []),
    ...(import.meta.env.VITE_GOOGLE_AUTH_ENABLED ? (["google"] as const) : []),
  ]

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <BrowserChromeTheme />
      <AuthProvider
        authClient={authClient}
        redirectTo={redirectTo}
        socialProviders={socialProviders}
        emailAndPassword={{
          enabled: true,
          forgotPassword: true,
          requireEmailVerification: true,
        }}
        plugins={[
          themePlugin({ useTheme }),
          magicLinkPlugin(),
          emailOtpPlugin({
            disableSignUp: true,
            otpLength: 6,
            signIn: true,
          }),
        ]}
        navigate={navigate}
        Link={({ href, ...props }) => <Link to={href} {...props} />}
      >
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

/** Keep iOS Safari's safe-area/status-bar surface aligned with an explicit
 * in-app theme, even when it differs from the device color scheme. */
function BrowserChromeTheme() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!resolvedTheme) return
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"][data-gatherory-theme]',
    )
    if (!meta) {
      meta = document.createElement("meta")
      meta.name = "theme-color"
      meta.dataset.gatheroryTheme = "true"
      document.head.append(meta)
    }
    meta.content = resolvedTheme === "dark" ? "#07080a" : "#f7f7f8"
  }, [resolvedTheme])

  return null
}

import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import { ThemeProvider, useTheme } from "next-themes"
import { I18nextProvider } from "react-i18next"
import { useEffect, type ReactNode } from "react"

import { AuthProvider } from "@/components/auth/auth-provider"
import { Toaster } from "@/components/ui/sonner"
import { authClient } from "@/lib/auth-client"
import { emailOtpPlugin } from "@/lib/auth/email-otp-plugin"
import { magicLinkPlugin } from "@/lib/auth/magic-link-plugin"
import { themePlugin } from "@/lib/auth/theme-plugin"
import { safeAuthContinuation } from "@/lib/event-invitation-links"
import i18n from "@/i18n"

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
      <I18nextProvider i18n={i18n}>
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
            themePlugin({
              useTheme,
              localization: {
                appearance: i18n.t("appearance.title"),
                theme: i18n.t("appearance.theme"),
                system: i18n.t("appearance.system"),
                light: i18n.t("appearance.light"),
                dark: i18n.t("appearance.dark"),
              },
            }),
            magicLinkPlugin({
              localization: {
                magicLink: i18n.t("authPlugin.magicLink"),
                sendMagicLink: i18n.t("authPlugin.sendMagicLink"),
                magicLinkSent: i18n.t("authPlugin.magicLinkSent"),
                magicLinkSentTo: i18n.t("authPlugin.magicLinkSentTo"),
              },
            }),
            emailOtpPlugin({
              disableSignUp: true,
              otpLength: 6,
              signIn: true,
              localization: {
                emailOtp: i18n.t("authPlugin.emailOtp"),
                sendCode: i18n.t("authPlugin.sendCode"),
                code: i18n.t("authPlugin.code"),
                verifyCode: i18n.t("authPlugin.verifyCode"),
                codeSentTo: i18n.t("authPlugin.codeSentTo"),
                codeLengthMismatch: i18n.t("authPlugin.codeLengthMismatch"),
                useDifferentEmail: i18n.t("authPlugin.useDifferentEmail"),
                codeSent: i18n.t("authPlugin.codeSent"),
                emailVerified: i18n.t("authPlugin.emailVerified"),
                confirmCurrentEmail: i18n.t("authPlugin.confirmCurrentEmail"),
                confirmNewEmail: i18n.t("authPlugin.confirmNewEmail"),
                confirmEmailDescription: i18n.t("authPlugin.confirmEmailDescription"),
              },
            }),
          ]}
          navigate={navigate}
          Link={({ href, ...props }) => <Link to={href} {...props} />}
        >
          {children}
          <Toaster />
        </AuthProvider>
      </I18nextProvider>
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

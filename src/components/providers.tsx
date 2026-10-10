import { Link, useNavigate } from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"

import { AuthProvider } from "@/components/auth/auth-provider"
import { Toaster } from "@/components/ui/sonner"
import { authClient } from "@/lib/auth-client"
import { emailOtpPlugin } from "@/lib/auth/email-otp-plugin"
import { magicLinkPlugin } from "@/lib/auth/magic-link-plugin"

export function Providers({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const socialProviders = [
    ...(import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true"
      ? (["google"] as const)
      : []),
    ...(import.meta.env.VITE_APPLE_AUTH_ENABLED === "true"
      ? (["apple"] as const)
      : []),
  ]

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider
        authClient={authClient}
        redirectTo="/"
        socialProviders={socialProviders}
        emailAndPassword={{
          enabled: true,
          forgotPassword: true,
          requireEmailVerification: true,
        }}
        plugins={[
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

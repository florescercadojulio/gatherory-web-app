import { Link, useNavigate } from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"

import { AuthProvider } from "@/components/auth/auth-provider"
import { Toaster } from "@/components/ui/sonner"
import { authClient } from "@/lib/auth-client"

export function Providers({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const socialProviders = [
    ...(import.meta.env.VITE_GOOGLE_AUTH_ENABLED ? (["google"] as const) : []),
    ...(import.meta.env.VITE_APPLE_AUTH_ENABLED ? (["apple"] as const) : []),
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
          forgotPassword: false,
          requireEmailVerification: false,
        }}
        navigate={navigate}
        Link={({ href, ...props }) => <Link to={href} {...props} />}
      >
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

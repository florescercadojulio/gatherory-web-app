"use client"

import {
  type AuthView,
  authMutationKeys,
  getAuthLinkURL
} from "@better-auth-ui/core"
import { useAuth, useAuthPlugin } from "@better-auth-ui/react"
import { useIsMutating } from "@tanstack/react-query"
import { KeyRound, Lock } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { emailOtpPlugin } from "@/lib/auth/email-otp-plugin"
import { cn } from "cn"

export type EmailOtpButtonProps = {
  view?: AuthView
}

export function EmailOtpButton({ view }: EmailOtpButtonProps) {
  const {
    basePaths,
    emailAndPassword,
    localization,
    redirectTo,
    viewPaths,
    Link
  } = useAuth()
  const { localization: emailOtpLocalization, viewPaths: emailOtpViewPaths } =
    useAuthPlugin(emailOtpPlugin)

  const signInMutating = useIsMutating({
    mutationKey: authMutationKeys.signIn.all
  })
  const signUpMutating = useIsMutating({
    mutationKey: authMutationKeys.signUp.all
  })
  const isPending = signInMutating + signUpMutating > 0
  const isEmailOtpView = view === "emailOtp"

  if (isEmailOtpView && !emailAndPassword?.enabled) return null

  return (
    <Link
      href={getAuthLinkURL(
        `${basePaths.auth}/${isEmailOtpView ? viewPaths.auth.signIn : emailOtpViewPaths.auth.emailOtp}`,
        redirectTo
      )}
      aria-disabled={isPending || undefined}
      tabIndex={isPending ? -1 : undefined}
      onClick={(event) => {
        if (isPending) event.preventDefault()
      }}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "w-full",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      {isEmailOtpView ? <Lock /> : <KeyRound />}
      {localization.auth.continueWith.replace(
        "{{provider}}",
        isEmailOtpView
          ? localization.auth.password
          : emailOtpLocalization.emailOtp
      )}
    </Link>
  )
}

"use client"

import { type AuthView, authMutationKeys } from "@better-auth-ui/core"
import { useAuth, useAuthPlugin } from "@better-auth-ui/react"
import { useIsMutating } from "@tanstack/react-query"
import { Lock, Mail } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { magicLinkPlugin } from "@/lib/auth/magic-link-plugin"
import { cn } from "cn"

export type MagicLinkButtonProps = {
  view?: AuthView
}

export function MagicLinkButton({ view }: MagicLinkButtonProps) {
  const { basePaths, emailAndPassword, viewPaths, localization, Link } =
    useAuth()
  const { localization: magicLinkLocalization, viewPaths: magicLinkViewPaths } =
    useAuthPlugin(magicLinkPlugin)

  const signInMutating = useIsMutating({
    mutationKey: authMutationKeys.signIn.all
  })
  const signUpMutating = useIsMutating({
    mutationKey: authMutationKeys.signUp.all
  })
  const isPending = signInMutating + signUpMutating > 0
  const isMagicLinkView = view === "magicLink"

  if (isMagicLinkView && !emailAndPassword?.enabled) return null

  return (
    <Link
      href={`${basePaths.auth}/${isMagicLinkView ? viewPaths.auth.signIn : magicLinkViewPaths.auth.magicLink}`}
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
      {isMagicLinkView ? <Lock /> : <Mail />}
      {localization.auth.continueWith.replace(
        "{{provider}}",
        isMagicLinkView
          ? localization.auth.password
          : magicLinkLocalization.magicLink
      )}
    </Link>
  )
}

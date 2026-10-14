import { useAuth, useSignOut } from '@better-auth-ui/react'
import { useEffect, useRef } from 'react'
import { Spinner } from '@/components/ui/spinner.tsx'
import { cn } from 'cn'
import { getAuthLinkURL } from '@better-auth-ui/core'

export type SignOutProps = {
  className?: string
}

/**
 * Signs the current user out on mount and renders a centered spinner while the operation completes.
 *
 * @param className - Optional additional class names appended to the root element
 * @returns The spinner shown during sign-out
 */
export function SignOut({ className }: SignOutProps) {
  const { authClient, basePaths, navigate, viewPaths, redirectTo } = useAuth()

  const { mutate: signOut } = useSignOut(authClient, {
    onError: () => {
      navigate({
        to: getAuthLinkURL(`${basePaths.auth}/${viewPaths.auth.signIn}`, redirectTo),
        replace: true,
      })
    },
    onSuccess: () =>
      navigate({
        to: getAuthLinkURL(`${basePaths.auth}/${viewPaths.auth.signIn}`, redirectTo),
        replace: true,
      }),
  })

  const hasSignedOut = useRef(false)

  useEffect(() => {
    if (hasSignedOut.current) return
    hasSignedOut.current = true

    signOut()
  }, [signOut])

  return <Spinner className={cn('mx-auto my-auto', className)} />
}

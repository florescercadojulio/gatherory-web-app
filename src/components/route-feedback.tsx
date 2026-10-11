import type { ErrorComponentProps } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  toastServerError,
  toastUnexpectedError,
} from "@/lib/toast-server-error"
import type { ClientError } from "@/server/result"

export function ServerErrorToast({
  error,
}: {
  error: ClientError | null | undefined
}) {
  const errorId = error?.errorId
  const userMessage = error?.userMessage

  useEffect(() => {
    if (errorId && userMessage) toastServerError({ errorId, userMessage })
  }, [errorId, userMessage])

  return null
}

export function PageUnavailable({
  title = "This page is temporarily unavailable",
  description = "The rest of Gatherory is still available. Try loading this page again.",
}: {
  title?: string
  description?: string
}) {
  return (
    <main className="mx-auto flex min-h-[70svh] w-full max-w-3xl items-center p-4 md:p-8">
      <Card className="w-full border-dashed">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </CardContent>
      </Card>
    </main>
  )
}

export function RouteErrorFallback({ reset }: ErrorComponentProps) {
  const [errorId] = useState(() => crypto.randomUUID())

  useEffect(() => {
    toastUnexpectedError(errorId)
  }, [errorId])

  return (
    <main className="mx-auto flex min-h-[70svh] w-full max-w-3xl items-center p-4 md:p-8">
      <Card className="w-full border-dashed">
        <CardHeader>
          <CardTitle>This page could not finish loading</CardTitle>
          <CardDescription>
            The rest of Gatherory is still available. Try loading this page
            again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </main>
  )
}

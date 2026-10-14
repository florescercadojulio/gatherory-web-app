import type { ErrorComponentProps } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toastServerError, toastUnexpectedError } from '@/lib/toast-server-error'
import type { ClientError } from '@/server/result'

export function ServerErrorToast({ error }: { error: ClientError | null | undefined }) {
  const errorId = error?.errorId
  const userMessage = error?.userMessage

  useEffect(() => {
    if (errorId && userMessage) toastServerError({ errorId, userMessage })
  }, [errorId, userMessage])

  return null
}

export function PageUnavailable({ title, description }: { title?: string; description?: string }) {
  const { t } = useTranslation()
  return (
    <main className="mx-auto flex min-h-[70svh] w-full max-w-3xl items-center p-4 md:p-8">
      <Card className="w-full border-dashed">
        <CardHeader>
          <CardTitle>{title ?? t('feedback.pageUnavailable')}</CardTitle>
          <CardDescription>{description ?? t('feedback.restAvailable')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>{t('feedback.tryAgain')}</Button>
        </CardContent>
      </Card>
    </main>
  )
}

export function RouteErrorFallback({ reset }: ErrorComponentProps) {
  const { t } = useTranslation()
  const [errorId] = useState(() => crypto.randomUUID())

  useEffect(() => {
    toastUnexpectedError(errorId)
  }, [errorId])

  return (
    <main className="mx-auto flex min-h-[70svh] w-full max-w-3xl items-center p-4 md:p-8">
      <Card className="w-full border-dashed">
        <CardHeader>
          <CardTitle>{t('feedback.couldNotFinish')}</CardTitle>
          <CardDescription>{t('feedback.restAvailable')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset}>{t('feedback.tryAgain')}</Button>
        </CardContent>
      </Card>
    </main>
  )
}

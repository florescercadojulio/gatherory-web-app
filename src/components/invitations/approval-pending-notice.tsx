import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function ApprovalPendingNotice({ refresh }: { refresh: () => Promise<void> }) {
  const { t } = useTranslation()
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  async function checkStatus() {
    setChecking(true)
    setError('')
    try {
      await refresh()
    } catch {
      setError(t('invitation.approvalStatusFailed'))
    } finally {
      setChecking(false)
    }
  }

  return (
    <section aria-labelledby="invitation-approval-heading" className="space-y-4">
      <h2 id="invitation-approval-heading" className="text-lg font-semibold">
        {t('invitation.awaitingApproval')}
      </h2>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full justify-start whitespace-normal text-left sm:w-auto"
        disabled={checking}
        onClick={() => void checkStatus()}
      >
        {checking ? t('invitation.checkingApprovalStatus') : t('invitation.checkApprovalStatus')}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}

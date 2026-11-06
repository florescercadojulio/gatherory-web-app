import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function InvitationAccessAction({
  requiresApproval,
  pending,
  disabled,
  onAccept,
}: {
  requiresApproval: boolean
  pending: boolean
  disabled: boolean
  onAccept: () => Promise<unknown>
}) {
  const { t } = useTranslation()
  return (
    <Button
      className="min-h-11 w-full whitespace-normal text-left sm:w-auto"
      disabled={disabled}
      onClick={() => void onAccept()}
    >
      {pending
        ? requiresApproval
          ? t('invitation.requestingAccess')
          : t('invitation.accepting')
        : requiresApproval
          ? t('invitation.requestAccess')
          : t('invitation.accept')}
    </Button>
  )
}

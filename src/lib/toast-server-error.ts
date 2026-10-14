import { toast } from 'sonner'

import i18n from '@/i18n'
import type { ClientError } from '@/server/result'

/** Displays the only server-failure details intentionally exposed to a user. */
export function toastServerError(error: ClientError) {
  toast.error(error.userMessage, {
    id: error.errorId,
    description: i18n.t('errors.errorId', { id: error.errorId }),
  })
}

export function toastUnexpectedError(errorId: string) {
  toast.error(i18n.t('errors.unexpected'), {
    id: errorId,
    description: i18n.t('errors.errorId', { id: errorId }),
  })
}

import { serverOperationError } from '@/server/effect'

/** Expected tagged failures preserve their identity at the safe transport boundary. */
export function mediaError(cause: unknown) {
  return serverOperationError(cause, {
    category: 'system',
    code: 'MEDIA_OPERATION_FAILED',
    userMessageKey: 'serverErrors.MEDIA_OPERATION_FAILED',
  })
}

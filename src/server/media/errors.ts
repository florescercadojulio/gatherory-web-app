import { Data } from 'effect'
import type { DomainErrorShape } from '@/lib/domain-errors'

export class MediaError extends Data.TaggedError('MediaError')<DomainErrorShape> {}

export function mediaFailure(
  code: 'MEDIA_FORBIDDEN' | 'MEDIA_UPLOAD_MISMATCH' | 'MEDIA_INVALID_STATE' | 'MEDIA_CREATE_FAILED',
  debugMessage?: string
) {
  return new MediaError({
    code,
    category:
      code === 'MEDIA_FORBIDDEN'
        ? 'authorization'
        : code === 'MEDIA_UPLOAD_MISMATCH'
          ? 'validation'
          : code === 'MEDIA_INVALID_STATE'
            ? 'conflict'
            : 'system',
    userMessageKey: `serverErrors.${code}`,
    debugMessage: debugMessage ?? code,
  })
}

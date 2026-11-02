import { Effect } from 'effect'
import { InvalidInputError, PersistenceError, isDomainError } from '@/lib/domain-errors'

export const MAX_BLUEPRINT_MEASUREMENT_ROWS = 20_000

export function requireBoundedMeasurementRows(length: number) {
  return length <= MAX_BLUEPRINT_MEASUREMENT_ROWS
    ? Effect.void
    : Effect.fail(
        new InvalidInputError({
          category: 'validation',
          code: 'BLUEPRINT_MEASUREMENT_ROW_LIMIT',
          userMessageKey: 'serverErrors.VALIDATION',
        })
      )
}

/** Diagnostic SQL may contain private values; preserve only known domain errors. */
export function measurementReadFailure(cause: unknown) {
  return isDomainError(cause)
    ? cause
    : new PersistenceError({
        category: 'system',
        code: 'BLUEPRINT_MEASUREMENT_READ_FAILED',
        userMessageKey: 'serverErrors.SYSTEM',
      })
}

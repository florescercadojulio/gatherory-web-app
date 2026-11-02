import { expect, it } from '@effect/vitest'
import { Effect, Exit } from 'effect'
import { InvalidInputError } from '@/lib/domain-errors'
import {
  measurementReadFailure,
  requireBoundedMeasurementRows,
} from '@/server/blueprints/repos/blueprint-measurement-readiness.errors'

it.effect('bounded reports fail with a typed error after the 20,000-row limit', () =>
  Effect.gen(function* () {
    yield* requireBoundedMeasurementRows(20_000)
    const result = yield* Effect.exit(requireBoundedMeasurementRows(20_001))
    expect(Exit.isFailure(result)).toBe(true)
    if (Exit.isFailure(result)) {
      expect(result.cause.reasons).toContainEqual(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'BLUEPRINT_MEASUREMENT_ROW_LIMIT' }),
        })
      )
    }
  })
)

it.effect('read failures retain domain identity and scrub private SQL diagnostics', () =>
  Effect.sync(() => {
    const limit = new InvalidInputError({
      category: 'validation',
      code: 'BLUEPRINT_MEASUREMENT_ROW_LIMIT',
    })
    expect(measurementReadFailure(limit)).toBe(limit)
    const safe = measurementReadFailure(new Error('select private_email, token from private_data'))
    expect(safe.code).toBe('BLUEPRINT_MEASUREMENT_READ_FAILED')
    expect(safe.cause).toBeUndefined()
    expect(JSON.stringify(safe)).not.toMatch(/private_email|private_data|token/)
  })
)

import { expect, it } from '@effect/vitest'
import { Data, Effect } from 'effect'
import { z } from 'zod'
import {
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  InvalidInputError,
  PersistenceError,
  runServerEffect,
  runServerResponse,
  tryServerOperation,
} from '@/server/effect-utils'
import { validateInput } from '@/server/validation'
import { eventRepositoryError } from '@/server/events/errors'
import en from '@/i18n/locales/en.server-errors'
import es from '@/i18n/locales/es.server-errors'

it.effect('client request IDs correlate failures without echoing arbitrary header content', () =>
  Effect.promise(async () => {
    const failure = Effect.fail(
      new ForbiddenError({
        category: 'authorization',
        code: 'MEDIA_FORBIDDEN',
        userMessageKey: 'serverErrors.MEDIA_FORBIDDEN',
      })
    )
    const requestID = crypto.randomUUID()
    const response = await runServerResponse(failure, {
      headers: new Headers({ 'x-request-id': requestID }),
      operation: 'media.prepare',
    })
    const body = await response.json()
    expect(body.error.traceId).toBe(requestID)
    expect(body.error.code).toBe('MEDIA_FORBIDDEN')
    expect(body.error.errorId).toBeTruthy()
    const untrusted = await runServerResponse(failure, {
      headers: new Headers({ 'x-request-id': 'private-untrusted-value' }),
    })
    const untrustedBody = await untrusted.json()
    expect(untrustedBody.error.traceId).toMatch(/^[0-9a-f-]{36}$/i)
    expect(JSON.stringify(untrustedBody)).not.toMatch(/private-untrusted-value/)
  })
)

it.effect('translated errors never serialize provider causes or developer context', () =>
  Effect.promise(async () => {
    const result = await runServerEffect(
      Effect.fail(
        new PersistenceError({
          category: 'system',
          code: 'SECRET_PROVIDER_CODE',
          userMessageKey: 'serverErrors.SYSTEM',
          debugMessage: 'private-driver-detail',
          cause: { credential: 'private-provider-secret' },
        })
      ),
      { locale: 'es' }
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.userMessage).toBe(es.SYSTEM)
    expect(result.error.messageKey).toBe('serverErrors.SYSTEM')
    expect(result.error.errorId).toMatch(/^[0-9a-f-]{36}$/i)
    expect(JSON.stringify(result)).not.toMatch(/private-|SECRET_PROVIDER_CODE|cause|debugMessage/)
  })
)

it.effect('simultaneous request languages do not mutate a shared locale', () =>
  Effect.promise(async () => {
    const failure = Effect.fail(
      new ForbiddenError({
        category: 'authorization',
        userMessageKey: 'serverErrors.AUTHORIZATION',
      })
    )
    const [spanish, english, unsupported] = await Promise.all([
      runServerEffect(failure, { headers: new Headers({ 'Accept-Language': 'es-MX, en;q=0.5' }) }),
      runServerEffect(failure, { headers: new Headers({ 'Accept-Language': 'es;q=0, en;q=0.8' }) }),
      runServerEffect(failure, { locale: 'fr' }),
    ])
    expect(spanish.ok ? null : spanish.error.userMessage).toBe(es.AUTHORIZATION)
    expect(english.ok ? null : english.error.userMessage).toBe(en.AUTHORIZATION)
    expect(unsupported.ok ? null : unsupported.error.userMessage).toBe(en.AUTHORIZATION)
  })
)

it.effect('a tagged error without a code retains its category and localized default', () =>
  Effect.promise(async () => {
    class MissingEvent extends Data.TaggedError('MissingEvent')<{ category: 'not_found' }> {}
    const response = await runServerResponse(
      Effect.fail(new MissingEvent({ category: 'not_found' }))
    )
    expect(response.status).toBe(404)
    expect((await response.json()).error.userMessage).toBe(en.NOT_FOUND)
  })
)

it.effect(
  'promise adapters preserve a thrown tagged conflict instead of wrapping it as system',
  () =>
    Effect.promise(async () => {
      const expected = new ConflictError({
        category: 'conflict',
        code: 'STALE',
        userMessageKey: 'serverErrors.CONFLICT',
      })
      const response = await runServerResponse(
        tryServerOperation({ category: 'system', code: 'WRAPPER' }, async () => {
          throw expected
        })
      )
      expect(response.status).toBe(409)
      expect((await response.json()).error.userMessage).toBe(en.CONFLICT)
    })
)

it.effect(
  'unexpected defects receive generic copy while thrown domain errors retain classification',
  () =>
    Effect.promise(async () => {
      const defect = await runServerEffect(Effect.die(new Error('private-runtime-detail')))
      expect(defect.ok ? null : defect.error.userMessage).toBe(en.SYSTEM)
      expect(JSON.stringify(defect)).not.toMatch(/private-runtime-detail/)
      const expected = await runServerResponse(
        Effect.sync(() => {
          throw new ForbiddenError({ category: 'authorization' })
        })
      )
      expect(expected.status).toBe(403)
    })
)

it.effect(
  'HTTP responses distinguish auth, validation, conflict, provider and system failures',
  () =>
    Effect.promise(async () => {
      const cases = [
        [new ForbiddenError({ category: 'authorization', httpStatus: 401 }), 401],
        [new InvalidInputError({ category: 'validation' }), 400],
        [new InvalidInputError({ category: 'validation', httpStatus: 413 }), 413],
        [new ConflictError({ category: 'conflict' }), 409],
        [new ExternalServiceError({ category: 'external' }), 503],
        [new PersistenceError({ category: 'system' }), 500],
      ] as const
      for (const [error, expected] of cases)
        expect((await runServerResponse(Effect.fail(error))).status).toBe(expected)
    })
)

it.effect('input validation preserves defaults and hides raw validation details', () =>
  Effect.promise(async () => {
    const schema = z.object({ title: z.string().min(1), count: z.number().default(1) })
    expect(await runServerEffect(validateInput(schema, { title: 'Party' }))).toEqual({
      ok: true,
      data: { title: 'Party', count: 1 },
    })
    const invalid = await runServerResponse(
      validateInput(schema, { title: '', credential: 'private-input' })
    )
    expect(invalid.status).toBe(400)
    const body = await invalid.json()
    expect(body.error.userMessage).toBe(en.VALIDATION)
    expect(JSON.stringify(body)).not.toMatch(/private-input|issues|ZodError/)
  })
)

it.effect('native sync success and legacy error code remain compatible', () =>
  Effect.promise(async () => {
    const success = await runServerResponse(Effect.succeed({ results: [] }), {
      successEnvelope: false,
      legacyErrorCode: true,
    })
    expect(await success.json()).toEqual({ results: [] })
    const failed = await runServerResponse(
      Effect.fail(
        new InvalidInputError({
          category: 'validation',
          code: 'SYNC_PAYLOAD_TOO_LARGE',
          httpStatus: 413,
          userMessageKey: 'serverErrors.SYNC_PAYLOAD_TOO_LARGE',
        })
      ),
      { legacyErrorCode: true, locale: 'es' }
    )
    const body = await failed.json()
    expect(failed.status).toBe(413)
    expect(body.error).toBe('SYNC_PAYLOAD_TOO_LARGE')
    expect(body.userMessage).toBe(es.SYNC_PAYLOAD_TOO_LARGE)
  })
)

it('event domain classification uses typed codes instead of manufactured causes', () => {
  expect(eventRepositoryError('EVENT_PARENT_NOT_FOUND').category).toBe('not_found')
  expect(eventRepositoryError('EVENT_DEPTH_EXCEEDED').category).toBe('conflict')
  expect(eventRepositoryError('EVENT_INVITATION_EMAIL_MISMATCH').category).toBe('authorization')
  expect(eventRepositoryError('EVENT_CREATE_FAILED').category).toBe('system')
  expect(eventRepositoryError('EVENT_DEPTH_EXCEEDED').cause).toBe(undefined)
})

it.effect('an untrusted provider object cannot impersonate safe domain copy', () =>
  Effect.promise(async () => {
    const result = await runServerEffect(
      tryServerOperation({ category: 'external', code: 'PROVIDER_FAILED' }, async () => {
        throw {
          _tag: 'ExternalServiceError',
          category: 'validation',
          userMessage: 'private-provider-payload',
        }
      })
    )
    expect(result.ok ? null : result.error.userMessage).toBe(en.EXTERNAL)
    expect(JSON.stringify(result)).not.toMatch(/private-provider-payload/)
  })
)

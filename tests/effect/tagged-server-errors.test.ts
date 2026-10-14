import assert from 'node:assert/strict'
import { it } from '@effect/vitest'
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
    assert.equal(body.error.traceId, requestID)
    assert.equal(body.error.code, 'MEDIA_FORBIDDEN')
    assert.ok(body.error.errorId)
    const untrusted = await runServerResponse(failure, {
      headers: new Headers({ 'x-request-id': 'private-untrusted-value' }),
    })
    const untrustedBody = await untrusted.json()
    assert.match(untrustedBody.error.traceId, /^[0-9a-f-]{36}$/i)
    assert.doesNotMatch(JSON.stringify(untrustedBody), /private-untrusted-value/)
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
    assert.equal(result.ok, false)
    if (result.ok) return
    assert.equal(result.error.userMessage, es.SYSTEM)
    assert.equal(result.error.messageKey, 'serverErrors.SYSTEM')
    assert.match(result.error.errorId, /^[0-9a-f-]{36}$/i)
    assert.doesNotMatch(JSON.stringify(result), /private-|SECRET_PROVIDER_CODE|cause|debugMessage/)
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
    assert.equal(spanish.ok ? null : spanish.error.userMessage, es.AUTHORIZATION)
    assert.equal(english.ok ? null : english.error.userMessage, en.AUTHORIZATION)
    assert.equal(unsupported.ok ? null : unsupported.error.userMessage, en.AUTHORIZATION)
  })
)

it.effect('a tagged error without a code retains its category and localized default', () =>
  Effect.promise(async () => {
    class MissingEvent extends Data.TaggedError('MissingEvent')<{ category: 'not_found' }> {}
    const response = await runServerResponse(
      Effect.fail(new MissingEvent({ category: 'not_found' }))
    )
    assert.equal(response.status, 404)
    assert.equal((await response.json()).error.userMessage, en.NOT_FOUND)
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
      assert.equal(response.status, 409)
      assert.equal((await response.json()).error.userMessage, en.CONFLICT)
    })
)

it.effect(
  'unexpected defects receive generic copy while thrown domain errors retain classification',
  () =>
    Effect.promise(async () => {
      const defect = await runServerEffect(Effect.die(new Error('private-runtime-detail')))
      assert.equal(defect.ok ? null : defect.error.userMessage, en.SYSTEM)
      assert.doesNotMatch(JSON.stringify(defect), /private-runtime-detail/)
      const expected = await runServerResponse(
        Effect.sync(() => {
          throw new ForbiddenError({ category: 'authorization' })
        })
      )
      assert.equal(expected.status, 403)
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
        assert.equal((await runServerResponse(Effect.fail(error))).status, expected)
    })
)

it.effect('input validation preserves defaults and hides raw validation details', () =>
  Effect.promise(async () => {
    const schema = z.object({ title: z.string().min(1), count: z.number().default(1) })
    assert.deepEqual(await runServerEffect(validateInput(schema, { title: 'Party' })), {
      ok: true,
      data: { title: 'Party', count: 1 },
    })
    const invalid = await runServerResponse(
      validateInput(schema, { title: '', credential: 'private-input' })
    )
    assert.equal(invalid.status, 400)
    const body = await invalid.json()
    assert.equal(body.error.userMessage, en.VALIDATION)
    assert.doesNotMatch(JSON.stringify(body), /private-input|issues|ZodError/)
  })
)

it.effect('native sync success and legacy error code remain compatible', () =>
  Effect.promise(async () => {
    const success = await runServerResponse(Effect.succeed({ results: [] }), {
      successEnvelope: false,
      legacyErrorCode: true,
    })
    assert.deepEqual(await success.json(), { results: [] })
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
    assert.equal(failed.status, 413)
    assert.equal(body.error, 'SYNC_PAYLOAD_TOO_LARGE')
    assert.equal(body.userMessage, es.SYNC_PAYLOAD_TOO_LARGE)
  })
)

it('event domain classification uses typed codes instead of manufactured causes', () => {
  assert.equal(eventRepositoryError('EVENT_PARENT_NOT_FOUND').category, 'not_found')
  assert.equal(eventRepositoryError('EVENT_DEPTH_EXCEEDED').category, 'conflict')
  assert.equal(eventRepositoryError('EVENT_INVITATION_EMAIL_MISMATCH').category, 'authorization')
  assert.equal(eventRepositoryError('EVENT_CREATE_FAILED').category, 'system')
  assert.equal(eventRepositoryError('EVENT_DEPTH_EXCEEDED').cause, undefined)
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
    assert.equal(result.ok ? null : result.error.userMessage, en.EXTERNAL)
    assert.doesNotMatch(JSON.stringify(result), /private-provider-payload/)
  })
)

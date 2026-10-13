import assert from "node:assert/strict"
import { test } from "node:test"
import { Data, Effect } from "effect"
import { z } from "zod"
import {
  ConflictError, ExternalServiceError, ForbiddenError, InvalidInputError, PersistenceError,
  runServerEffect, runServerResponse, tryServerOperation,
} from "../src/server/effect-utils"
import { validateInput } from "../src/server/validation"
import { eventRepositoryError } from "../src/server/events/errors"
import en from "../src/i18n/locales/en.server-errors"
import es from "../src/i18n/locales/es.server-errors"

test("translated errors never serialize provider causes or developer context", async () => {
  const result = await runServerEffect(Effect.fail(new PersistenceError({
    category: "system", code: "SECRET_PROVIDER_CODE", userMessageKey: "serverErrors.SYSTEM",
    debugMessage: "private-driver-detail", cause: { credential: "private-provider-secret" },
  })), { locale: "es" })
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.error.userMessage, es.SYSTEM)
  assert.equal(result.error.messageKey, "serverErrors.SYSTEM")
  assert.match(result.error.errorId, /^[0-9a-f-]{36}$/i)
  assert.doesNotMatch(JSON.stringify(result), /private-|SECRET_PROVIDER_CODE|cause|debugMessage/)
})

test("simultaneous request languages do not mutate a shared locale", async () => {
  const failure = Effect.fail(new ForbiddenError({ category: "authorization", userMessageKey: "serverErrors.AUTHORIZATION" }))
  const [spanish, english, unsupported] = await Promise.all([
    runServerEffect(failure, { headers: new Headers({ "Accept-Language": "es-MX, en;q=0.5" }) }),
    runServerEffect(failure, { headers: new Headers({ "Accept-Language": "es;q=0, en;q=0.8" }) }),
    runServerEffect(failure, { locale: "fr" }),
  ])
  assert.equal(spanish.ok ? null : spanish.error.userMessage, es.AUTHORIZATION)
  assert.equal(english.ok ? null : english.error.userMessage, en.AUTHORIZATION)
  assert.equal(unsupported.ok ? null : unsupported.error.userMessage, en.AUTHORIZATION)
})

test("a tagged error without a code retains its category and localized default", async () => {
  class MissingEvent extends Data.TaggedError("MissingEvent")<{ category: "not_found" }> {}
  const response = await runServerResponse(Effect.fail(new MissingEvent({ category: "not_found" })))
  assert.equal(response.status, 404)
  assert.equal((await response.json()).error.userMessage, en.NOT_FOUND)
})

test("promise adapters preserve a thrown tagged conflict instead of wrapping it as system", async () => {
  const expected = new ConflictError({ category: "conflict", code: "STALE", userMessageKey: "serverErrors.CONFLICT" })
  const response = await runServerResponse(tryServerOperation({ category: "system", code: "WRAPPER" }, async () => { throw expected }))
  assert.equal(response.status, 409)
  assert.equal((await response.json()).error.userMessage, en.CONFLICT)
})

test("unexpected defects receive generic copy while thrown domain errors retain classification", async () => {
  const defect = await runServerEffect(Effect.die(new Error("private-runtime-detail")))
  assert.equal(defect.ok ? null : defect.error.userMessage, en.SYSTEM)
  assert.doesNotMatch(JSON.stringify(defect), /private-runtime-detail/)
  const expected = await runServerResponse(Effect.sync(() => { throw new ForbiddenError({ category: "authorization" }) }))
  assert.equal(expected.status, 403)
})

test("HTTP responses distinguish auth, validation, conflict, provider and system failures", async () => {
  const cases = [
    [new ForbiddenError({ category: "authorization", httpStatus: 401 }), 401],
    [new InvalidInputError({ category: "validation" }), 400],
    [new InvalidInputError({ category: "validation", httpStatus: 413 }), 413],
    [new ConflictError({ category: "conflict" }), 409],
    [new ExternalServiceError({ category: "external" }), 503],
    [new PersistenceError({ category: "system" }), 500],
  ] as const
  for (const [error, expected] of cases) assert.equal((await runServerResponse(Effect.fail(error))).status, expected)
})

test("input validation preserves defaults and hides raw validation details", async () => {
  const schema = z.object({ title: z.string().min(1), count: z.number().default(1) })
  assert.deepEqual(await runServerEffect(validateInput(schema, { title: "Party" })), { ok: true, data: { title: "Party", count: 1 } })
  const invalid = await runServerResponse(validateInput(schema, { title: "", credential: "private-input" }))
  assert.equal(invalid.status, 400)
  const body = await invalid.json()
  assert.equal(body.error.userMessage, en.VALIDATION)
  assert.doesNotMatch(JSON.stringify(body), /private-input|issues|ZodError/)
})

test("native sync success and legacy error code remain compatible", async () => {
  const success = await runServerResponse(Effect.succeed({ results: [] }), { successEnvelope: false, legacyErrorCode: true })
  assert.deepEqual(await success.json(), { results: [] })
  const failed = await runServerResponse(Effect.fail(new InvalidInputError({
    category: "validation", code: "SYNC_PAYLOAD_TOO_LARGE", httpStatus: 413, userMessageKey: "serverErrors.SYNC_PAYLOAD_TOO_LARGE",
  })), { legacyErrorCode: true, locale: "es" })
  const body = await failed.json()
  assert.equal(failed.status, 413)
  assert.equal(body.error, "SYNC_PAYLOAD_TOO_LARGE")
  assert.equal(body.userMessage, es.SYNC_PAYLOAD_TOO_LARGE)
})

test("event domain classification uses typed codes instead of manufactured causes", () => {
  assert.equal(eventRepositoryError("EVENT_PARENT_NOT_FOUND").category, "not_found")
  assert.equal(eventRepositoryError("EVENT_DEPTH_EXCEEDED").category, "conflict")
  assert.equal(eventRepositoryError("EVENT_INVITATION_EMAIL_MISMATCH").category, "authorization")
  assert.equal(eventRepositoryError("EVENT_CREATE_FAILED").category, "system")
  assert.equal(eventRepositoryError("EVENT_DEPTH_EXCEEDED").cause, undefined)
})

test("an untrusted provider object cannot impersonate safe domain copy", async () => {
  const result = await runServerEffect(tryServerOperation({ category: "external", code: "PROVIDER_FAILED" }, async () => {
    throw { _tag: "ExternalServiceError", category: "validation", userMessage: "private-provider-payload" }
  }))
  assert.equal(result.ok ? null : result.error.userMessage, en.EXTERNAL)
  assert.doesNotMatch(JSON.stringify(result), /private-provider-payload/)
})

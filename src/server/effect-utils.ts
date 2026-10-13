import { getRequestHeaders } from "@tanstack/react-start/server"
import { Cause, Effect, Exit } from "effect"
import {
  isDomainError, PersistenceError, ServerOperationError, serverOperationError,
  type DomainError, type DomainErrorShape, type ErrorCategory, type UserMessageKey,
} from "@/lib/domain-errors"
import { errorLocale, translateError } from "./error-localization"
import type { ServerResult } from "./result"

export * from "@/lib/domain-errors"

const defaultKeys: Record<ErrorCategory, UserMessageKey> = {
  validation: "serverErrors.VALIDATION", authorization: "serverErrors.AUTHORIZATION",
  not_found: "serverErrors.NOT_FOUND", conflict: "serverErrors.CONFLICT",
  external: "serverErrors.EXTERNAL", system: "serverErrors.SYSTEM",
}

export function findDomainError(cause: Cause.Cause<unknown>): DomainError | undefined {
  for (const reason of cause.reasons) {
    const failure = Cause.isFailReason(reason) ? reason.error : Cause.isDieReason(reason) ? reason.defect : undefined
    if (isDomainError(failure)) return failure
  }
}

function requestHeaders() {
  // Scheduled jobs and CLI calls have no HTTP request context.
  try { return getRequestHeaders() } catch { return undefined }
}

export type ServerEffectOptions = {
  headers?: Headers
  locale?: string
  onFailure?: (error: DomainErrorShape) => void
}

/** Logs full developer context; only translated product copy and IDs cross this boundary. */
export async function runServerEffect<A, E>(program: Effect.Effect<A, E>, options: ServerEffectOptions = {}): Promise<ServerResult<A>> {
  const traceId = crypto.randomUUID()
  const exit = await Effect.runPromiseExit(program.pipe(Effect.annotateLogs({ traceId })))
  if (Exit.isSuccess(exit)) return { ok: true, data: exit.value }

  const domain = findDomainError(exit.cause) ?? new ServerOperationError({
    category: "system", code: "UNEXPECTED_SERVER_ERROR", cause: exit.cause,
  })
  const errorId = crypto.randomUUID()
  const category = domain.category
  const messageKey = domain.userMessageKey ?? (domain.userMessage ? undefined : defaultKeys[category])
  const userMessage = messageKey
    ? translateError(messageKey, errorLocale(options.headers ?? requestHeaders(), options.locale), domain.messageParams)
    : domain.userMessage!

  await Effect.runPromise(Effect.logError("Server operation failed").pipe(Effect.annotateLogs({
    traceId, errorId, category, code: domain.code ?? domain._tag,
    debugMessage: domain.debugMessage ?? "none", cause: Cause.pretty(exit.cause),
  })))
  options.onFailure?.(domain)
  return { ok: false, error: {
    userMessage, errorId,
    ...(messageKey ? { messageKey } : {}),
    ...(domain.messageParams ? { messageParams: domain.messageParams } : {}),
  } }
}

const statusByCategory: Record<ErrorCategory, number> = {
  validation: 400, authorization: 403, not_found: 404, conflict: 409, external: 503, system: 500,
}

/** HTTP endpoints share the same error serializer and category/status mapping. */
export async function runServerResponse<A, E>(program: Effect.Effect<A, E>, options: Omit<ServerEffectOptions, "onFailure"> & { successEnvelope?: boolean; legacyErrorCode?: boolean } = {}) {
  let status = 500
  let code = "UNEXPECTED_SERVER_ERROR"
  const result = await runServerEffect(program, { ...options, onFailure: error => {
    status = error.httpStatus ?? statusByCategory[error.category]
    code = error.code ?? "UNEXPECTED_SERVER_ERROR"
  } })
  const body = result.ok && options.successEnvelope === false ? result.data
    : !result.ok && options.legacyErrorCode ? { ok: false, error: code, ...result.error } : result
  return Response.json(body, {
    status: result.ok ? 200 : status, headers: { "Cache-Control": "private, no-store" },
  })
}

export function tryPersistence<A>(code: string, operation: () => Promise<A>): Effect.Effect<A, DomainError> {
  return Effect.tryPromise({ try: operation, catch: cause => isDomainError(cause) ? cause : new PersistenceError({ category: "system", code, cause }) })
}

export function tryServerOperation<A>(error: Omit<DomainErrorShape, "cause">, operation: () => Promise<A>): Effect.Effect<A, DomainError> {
  return Effect.tryPromise({ try: operation, catch: cause => serverOperationError(cause, error) })
}

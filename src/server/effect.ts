import { Cause, Data, Effect, Exit } from "effect"

import type { ServerResult } from "@/server/result"

export type ErrorCategory =
  | "validation"
  | "authorization"
  | "not_found"
  | "conflict"
  | "external"
  | "system"

export type DomainErrorShape = {
  category: ErrorCategory
  code: string
  userMessage?: string
  debugMessage?: string
  cause?: unknown
}

export class InvalidInputError extends Data.TaggedError(
  "InvalidInputError",
)<DomainErrorShape> {}

export class ForbiddenError extends Data.TaggedError(
  "ForbiddenError",
)<DomainErrorShape> {}

export class EntityNotFoundError extends Data.TaggedError(
  "EntityNotFoundError",
)<DomainErrorShape> {}

export class ConflictError extends Data.TaggedError(
  "ConflictError",
)<DomainErrorShape> {}

export class PersistenceError extends Data.TaggedError(
  "PersistenceError",
)<DomainErrorShape> {}

export class ExternalServiceError extends Data.TaggedError(
  "ExternalServiceError",
)<DomainErrorShape> {}

const defaultMessage: Record<ErrorCategory, string> = {
  validation: "The request could not be processed.",
  authorization: "You are not allowed to perform this action.",
  not_found: "The requested resource was not found.",
  conflict: "This action cannot be completed in its current state.",
  external: "A required service is temporarily unavailable.",
  system: "Something went wrong.",
}

function findDomainError(cause: Cause.Cause<unknown>) {
  for (const reason of cause.reasons) {
    if (
      Cause.isFailReason(reason) &&
      typeof reason.error === "object" &&
      reason.error !== null &&
      "category" in reason.error &&
      "code" in reason.error
    ) {
      return reason.error as DomainErrorShape
    }
  }
}

function debugMessage(cause: unknown) {
  if (cause instanceof Error) return cause.message
  if (typeof cause === "string") return cause
  return cause === undefined ? undefined : String(cause)
}

/**
 * The only Effect-to-transport boundary used by server functions. Domain and
 * infrastructure failures are logged with a correlation ID; clients receive
 * only deliberately safe product copy.
 */
export async function runServerEffect<A, E>(
  program: Effect.Effect<A, E>,
): Promise<ServerResult<A>> {
  const traceId = crypto.randomUUID()
  const exit = await Effect.runPromiseExit(
    program.pipe(Effect.annotateLogs({ traceId })),
  )

  if (Exit.isSuccess(exit)) return { ok: true, data: exit.value }

  const domainError = findDomainError(exit.cause)
  const errorId = crypto.randomUUID()
  const category = domainError?.category ?? "system"

  Effect.runFork(
    Effect.logError("Server operation failed").pipe(
      Effect.annotateLogs({
        traceId,
        errorId,
        category,
        code: domainError?.code ?? "UNEXPECTED_SERVER_ERROR",
        debugMessage:
          domainError?.debugMessage ?? debugMessage(domainError?.cause) ?? "none",
        cause: Cause.pretty(exit.cause),
      }),
    ),
  )

  return {
    ok: false,
    error: {
      userMessage: domainError?.userMessage ?? defaultMessage[category],
      errorId,
    },
  }
}

export function tryPersistence<A>(
  code: string,
  operation: () => Promise<A>,
): Effect.Effect<A, PersistenceError> {
  return Effect.tryPromise({
    try: operation,
    catch: (cause) =>
      new PersistenceError({
        category: "system",
        code,
        cause,
        debugMessage: debugMessage(cause),
      }),
  })
}

import { Data } from 'effect'
import type serverErrors from '@/i18n/locales/en.server-errors'

export type ErrorCategory =
  'validation' | 'authorization' | 'not_found' | 'conflict' | 'external' | 'system'
export type UserMessageKey = `serverErrors.${keyof typeof serverErrors}`
export type MessageParams = Readonly<Record<string, string | number>>

/** Client-safe vocabulary; never import server runtime modules from UI code. */
export type DomainErrorShape = {
  category: ErrorCategory
  code?: string
  userMessageKey?: UserMessageKey
  messageParams?: MessageParams
  /** Explicit safe copy for compatibility. New application errors use keys. */
  userMessage?: string
  debugMessage?: string
  /** Original provider/runtime failure. Never sent to the client. */
  cause?: unknown
  /** Transport override, e.g. unauthenticated (401) or oversized payload (413). */
  httpStatus?: number
}

export type DomainError = DomainErrorShape & { readonly _tag: string }
export class InvalidInputError extends Data.TaggedError('InvalidInputError')<DomainErrorShape> {}
export class ForbiddenError extends Data.TaggedError('ForbiddenError')<DomainErrorShape> {}
export class EntityNotFoundError extends Data.TaggedError(
  'EntityNotFoundError'
)<DomainErrorShape> {}
export class ConflictError extends Data.TaggedError('ConflictError')<DomainErrorShape> {}
export class PersistenceError extends Data.TaggedError('PersistenceError')<DomainErrorShape> {}
export class ExternalServiceError extends Data.TaggedError(
  'ExternalServiceError'
)<DomainErrorShape> {}
export class ServerOperationError extends Data.TaggedError(
  'ServerOperationError'
)<DomainErrorShape> {}
export class ConfigurationError extends Data.TaggedError('ConfigurationError')<DomainErrorShape> {}

const categories = new Set<ErrorCategory>([
  'validation',
  'authorization',
  'not_found',
  'conflict',
  'external',
  'system',
])
export function isDomainError(value: unknown): value is DomainError {
  return (
    value instanceof Error &&
    '_tag' in value &&
    typeof value._tag === 'string' &&
    'category' in value &&
    categories.has(value.category as ErrorCategory)
  )
}

/** Promise/SDK boundaries preserve expected tagged failures, not message strings. */
export function serverOperationError(
  cause: unknown,
  error: Omit<DomainErrorShape, 'cause'>
): DomainError {
  return isDomainError(cause) ? cause : new ServerOperationError({ ...error, cause })
}

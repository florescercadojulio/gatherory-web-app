import type { Effect } from 'effect'
import { runServerEffect, type ServerEffectOptions } from '@/server/effect-utils'

/**
 * Function middleware must stop before next() on denial. Its failures happen
 * before a handler's ServerResult boundary, so log/translate here and throw only
 * public copy. Never throw a provider or database error across the RPC boundary.
 */
export async function runAuthorizationCheck<A, E>(
  program: Effect.Effect<A, E>,
  options: ServerEffectOptions = {}
): Promise<A> {
  const result = await runServerEffect(program, options)
  if (!result.ok) {
    const publicError = new Error(`${result.error.userMessage} (${result.error.errorId})`)
    publicError.stack = undefined
    throw publicError
  }
  return result.data
}

import { createHmac } from 'node:crypto'
import { Effect } from 'effect'
import { ConfigurationError, ForbiddenError, InvalidInputError } from '@/lib/domain-errors'
import type { WaitlistActor, WaitlistSignupInput } from '../contracts/waitlist.contracts'
import type { WaitlistConfig } from '../waitlist.config'
import { WaitlistRepo } from '../repos/waitlist.repo'

export function requireWaitlistAdmin(actor: WaitlistActor, config: WaitlistConfig) {
  return actor?.emailVerified && config.adminEmails.has(actor.email.trim().toLowerCase())
    ? Effect.void
    : Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'WAITLIST_ADMIN_REQUIRED',
          userMessageKey: 'serverErrors.WAITLIST_ADMIN_REQUIRED',
          httpStatus: actor ? 403 : 401,
        })
      )
}

export const signupToWaitlist = (
  input: WaitlistSignupInput,
  config: WaitlistConfig,
  ip?: string,
  now = new Date()
) =>
  Effect.gen(function* () {
    // Honeypot submissions get the same non-enumerating response without storing PII.
    if (input.website) return { accepted: true as const }
    if (config.rateSecret.length < 32)
      return yield* Effect.fail(
        new ConfigurationError({
          category: 'external',
          code: 'WAITLIST_NOT_CONFIGURED',
          userMessageKey: 'serverErrors.WAITLIST_UNAVAILABLE',
        })
      )
    const repo = yield* WaitlistRepo
    const window = Math.floor(now.getTime() / 600_000)
    const expiry = new Date((window + 1) * 600_000)
    const hash = (key: string) =>
      createHmac('sha256', config.rateSecret).update(`${window}:${key}`).digest('hex')
    const limits = [
      ['global', 200],
      [`email:${input.email}`, 3],
      ...(ip ? [[`ip:${ip}`, 10] as const] : []),
    ] as const
    for (const [key, maximum] of limits) {
      if (!(yield* repo.consumeRate(hash(key), maximum, expiry))) {
        return yield* Effect.fail(
          new InvalidInputError({
            category: 'validation',
            code: 'WAITLIST_RATE_LIMITED',
            userMessageKey: 'serverErrors.WAITLIST_RATE_LIMITED',
            httpStatus: 429,
          })
        )
      }
    }
    yield* repo.signup(input)
    return { accepted: true as const }
  })

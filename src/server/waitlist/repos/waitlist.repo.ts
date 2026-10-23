import { Context, type Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'
import type {
  WaitlistPage,
  WaitlistPageInput,
  WaitlistSignupInput,
} from '../contracts/waitlist.contracts'

export class WaitlistRepo extends Context.Service<
  WaitlistRepo,
  {
    consumeRate: (
      key: string,
      maximum: number,
      expiresAt: Date
    ) => Effect.Effect<boolean, DomainError>
    signup: (input: WaitlistSignupInput) => Effect.Effect<void, DomainError>
    list: (input: WaitlistPageInput) => Effect.Effect<WaitlistPage, DomainError>
    unsubscribe: (id: string) => Effect.Effect<void, DomainError>
  }
>()('WaitlistRepo') {}

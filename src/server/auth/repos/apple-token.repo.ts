import { Context, type Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'

export type AppleTokenRepoError = DomainError

export class AppleTokenRepo extends Context.Service<
  AppleTokenRepo,
  {
    readonly findLinkedAccount: (input: {
      userId: string
      subject: string
    }) => Effect.Effect<string | null, AppleTokenRepoError>
    readonly saveTokens: (input: {
      accountId: string
      userId: string
      accessToken: string
      refreshToken: string
      expiresIn: number
    }) => Effect.Effect<void, AppleTokenRepoError>
  }
>()('AppleTokenRepo') {}

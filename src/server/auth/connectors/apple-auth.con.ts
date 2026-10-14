import { Context, type Effect } from 'effect'
import type { jwtVerify } from 'jose'
import type { DomainError } from '@/lib/domain-errors'

export type AppleProviderOptions = {
  readonly fetcher?: typeof fetch
  readonly keys?: Parameters<typeof jwtVerify>[1]
}

export type AppleTokenSet = {
  readonly subject: string
  readonly accessToken: string
  readonly refreshToken: string
  readonly expiresIn: number
}

export class AppleAuthCon extends Context.Service<
  AppleAuthCon,
  {
    readonly exchangeCode: (
      code: string,
      options?: AppleProviderOptions
    ) => Effect.Effect<AppleTokenSet, DomainError>
    readonly revoke: (
      token: string,
      type: 'refresh_token' | 'access_token',
      options?: AppleProviderOptions
    ) => Effect.Effect<void, DomainError>
  }
>()('AppleAuthCon') {}

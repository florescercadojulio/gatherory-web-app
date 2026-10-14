import { Context, type Effect } from 'effect'
import type { AppleProviderOptions } from './apple-auth.con'

export class AppleTokenRevocationCon extends Context.Service<
  AppleTokenRevocationCon,
  {
    readonly decodeStoredToken: (value: string | null) => Effect.Effect<string | null, unknown>
    readonly allowedClientIds: () => ReadonlyArray<string>
    readonly revoke: (
      clientId: string,
      token: string,
      type: 'refresh_token' | 'access_token',
      options?: AppleProviderOptions
    ) => Effect.Effect<void, unknown>
  }
>()('AppleTokenRevocationCon') {}

import { Context, type Effect } from 'effect'
import type { SaveAppleTokenInput } from '../contracts/apple-token.contract'
import type { AppleProviderOptions } from '../connectors/apple-auth.con'
import type { AppleTokenRepoError } from '../repos/apple-token.repo'

export class AppleTokenService extends Context.Service<
  AppleTokenService,
  {
    readonly saveAuthorizationCode: (
      input: SaveAppleTokenInput,
      userId: string,
      options?: AppleProviderOptions
    ) => Effect.Effect<{ saved: true }, AppleTokenRepoError>
  }
>()('AppleTokenService') {}

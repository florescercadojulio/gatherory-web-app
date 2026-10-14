import { Effect } from 'effect'
import { AppleTokenService } from '../services/apple-token.service'
import type { AppleProviderOptions } from '../connectors/apple-auth.con'
import type { SaveAppleTokenInput } from '../contracts/apple-token.contract'

export const saveAppleTokenWorkflow = (
  input: SaveAppleTokenInput,
  userId: string,
  options?: AppleProviderOptions
) =>
  Effect.gen(function* () {
    const service = yield* AppleTokenService
    return yield* service.saveAuthorizationCode(input, userId, options)
  })

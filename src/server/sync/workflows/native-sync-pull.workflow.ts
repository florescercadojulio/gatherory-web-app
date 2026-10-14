import { Effect } from 'effect'

import { NativeSyncRepo } from '../repos/native-sync.repo'

export function pullNativeSync(input: { userId: string; scopeId: string; after: number }) {
  return Effect.gen(function* () {
    const repo = yield* NativeSyncRepo
    return yield* repo.pullChanges(input)
  })
}

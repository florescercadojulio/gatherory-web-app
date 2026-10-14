import { Effect } from 'effect'

import { NativeSyncRepo } from '../repos/native-sync.repo'

export function bootstrapNativeSync(userId: string) {
  return Effect.gen(function* () {
    const repo = yield* NativeSyncRepo
    return yield* repo.listWorkspaceSnapshots(userId)
  })
}

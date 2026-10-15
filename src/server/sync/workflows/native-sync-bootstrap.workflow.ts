import { Effect } from 'effect'

import { NativeSyncRepo } from '../repos/native-sync.repo'

export function bootstrapNativeSync(input: { userId: string; supportsBlueprintGuides: boolean }) {
  return Effect.gen(function* () {
    const repo = yield* NativeSyncRepo
    return yield* repo.listWorkspaceSnapshots(input)
  })
}

import { Effect } from 'effect'

import { NativeSyncRepo } from '../repos/native-sync.repo'
import type { NativeMutation } from '../contracts/native-sync.contracts'

export function pushNativeSync(input: {
  userId: string
  mutations: NativeMutation[]
  supportsBlueprintGuides: boolean
}) {
  return Effect.gen(function* () {
    const repo = yield* NativeSyncRepo
    return yield* repo.applyMutations(input)
  })
}

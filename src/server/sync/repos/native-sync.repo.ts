import { Context, type Effect } from 'effect'

import type { DomainError } from '@/lib/domain-errors'
import type {
  NativeMutation,
  NativePullPage,
  NativePushResult,
  NativeWorkspaceSnapshots,
} from '../contracts/native-sync.contracts'

export type NativeSyncRepoShape = {
  readonly applyMutations: (input: {
    userId: string
    mutations: NativeMutation[]
    supportsTodos?: boolean
    supportsBlueprintGuides: boolean
  }) => Effect.Effect<{ results: NativePushResult[] }, DomainError>
  readonly pullChanges: (input: {
    userId: string
    scopeId: string
    after: number
    supportsTodos?: boolean
    supportsBlueprintGuides: boolean
    limit?: number
  }) => Effect.Effect<NativePullPage | null, DomainError>
  readonly listWorkspaceSnapshots: (input: {
    userId: string
    supportsTodos?: boolean
    supportsBlueprintGuides: boolean
  }) => Effect.Effect<NativeWorkspaceSnapshots, DomainError>
}

export class NativeSyncRepo extends Context.Service<NativeSyncRepo, NativeSyncRepoShape>()(
  'NativeSyncRepo'
) {}

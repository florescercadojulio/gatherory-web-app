import { Context, type Effect } from 'effect'

import type { DomainError } from '@/lib/domain-errors'
import type { NativeWorkspaceInsightsResult } from '../contracts/native-insights.contract'

export type NativeInsightsRepoShape = {
  readonly listForUser: (
    userId: string
  ) => Effect.Effect<NativeWorkspaceInsightsResult, DomainError>
}

export class NativeInsightsRepo extends Context.Service<
  NativeInsightsRepo,
  NativeInsightsRepoShape
>()('NativeInsightsRepo') {}
